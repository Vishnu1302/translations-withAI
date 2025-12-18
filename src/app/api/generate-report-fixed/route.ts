import { NextResponse } from 'next/server';
import { createClient, PlainClientAPI, ContentFields } from 'contentful-management';
import ExcelJS from 'exceljs';
import translateBatchWithGemini from '../../helpers/gemini-ai-translation-helper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface TranslationEntry {
    contentType: string;
    sourceValue: string;
    locale: string;
    editLink: string;
    fieldType: string;
    entryId: string;
    fieldKey: string;
}

const fetchAllEntriesForContentType = async (
    client: PlainClientAPI,
    spaceId: string,
    environmentId: string,
    contentType: string,
    limit = 20
) => {
    try {
        const response = await client.entry.getMany({
            spaceId,
            environmentId,
            query: {
                content_type: contentType,
                limit,
                include: 0,
            },
        });
        return response.items;
    } catch (error) {
        console.error(`Error fetching entries for content type ${contentType}:`, error);
        return [];
    }
};

function validateTranslation(original: string, translated: string): boolean {
    if (typeof original !== 'string' || typeof translated !== 'string') {
        return false;
    }
    if (original.startsWith('/') ||
        original.startsWith('http') ||
        original.includes('{') ||
        original.includes('[')) {
        return true;
    }
    const isValid =
        translated &&
        translated.length >= original.length / 3 &&
        translated.length <= original.length * 3 &&
        translated !== original &&
        !/^\/|^http/.test(translated);
    return Boolean(isValid);
}

export async function POST(request: Request) {
    try {
        console.log("Request received for generate-report-fixed");
        const { spaceId, environmentId, accessToken, sourceLocales, targetLocales } = await request.json();
        console.log("Parameters:", { spaceId, environmentId, sourceLocales, targetLocales });
        if (!spaceId || !environmentId || !accessToken || !Array.isArray(targetLocales)) {
            return NextResponse.json({ error: 'Missing or invalid required parameters' }, { status: 400 });
        }
        const client = createClient({ accessToken }, { type: 'plain' });
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Missing Translations (Fixed)");
        sheet.columns = [
            { header: "Content Type", key: "contentType", width: 20 },
            { header: "Field Type", key: "fieldType", width: 15 },
            { header: "Entry ID", key: "entryId", width: 20 },
            { header: "Field Key", key: "fieldKey", width: 20 },
            { header: "Missing Locale", key: "missingLocale", width: 15 },
            { header: sourceLocales, key: "sourceValue", width: 60 },
            { header: "Translation", key: "translation", width: 40 },
            { header: "Edit Link", key: "editLink", width: 30 },
        ];
        const contentTypes = await client.contentType.getMany({
            spaceId,
            environmentId,
            query: { limit: 100 },
        });
        const translationEntries: TranslationEntry[] = [];
        for (const ct of contentTypes.items) {
            const fieldTypes = new Map(
                ct.fields.map(f => [f.id, f.type])
            );
            const localizedTextFieldIds = ct.fields
                .filter((f: ContentFields) => f.localized &&
                    (f.type === 'Text' || f.type === 'Symbol' || f.type === 'RichText'))
                .map((f: ContentFields) => f.id);
            if (localizedTextFieldIds.length === 0) continue;
            const entries = await fetchAllEntriesForContentType(
                client,
                spaceId,
                environmentId,
                ct.sys.id
            );
            for (const entry of entries) {
                const fields = entry.fields || {};
                const entryId = entry.sys.id;
                for (const fieldKey of localizedTextFieldIds) {
                    const sourceValue = fields[fieldKey]?.[sourceLocales];
                    const fieldType = fieldTypes.get(fieldKey) || 'unknown';
                    if (sourceValue === undefined || sourceValue === null) {
                        continue;
                    }
                    let displaySourceValue: string;
                    if (typeof sourceValue === 'string') {
                        displaySourceValue = sourceValue;
                    } else {
                        displaySourceValue = JSON.stringify(sourceValue, null, 2);
                    }
                    for (const locale of targetLocales) {
                        const targetValue = fields[fieldKey]?.[locale];
                        const isMissing = targetValue === undefined || 
                                        targetValue === null || 
                                        targetValue === "" ||
                                        (typeof targetValue === 'object' && Object.keys(targetValue).length === 0);
                        if (isMissing) {
                            const editLink = `https://app.contentful.com/spaces/${spaceId}/environments/${environmentId}/entries/${entryId}?focusedField=${fieldKey}&focusedLocale=${locale}`;
                            translationEntries.push({
                                contentType: ct.sys.id,
                                sourceValue: displaySourceValue,
                                locale,
                                editLink,
                                fieldType,
                                entryId,
                                fieldKey
                            });
                        }
                    }
                }
            }
        }
        // --- STRICT MAPPING AND LOGGING ---
        const stringEntries = translationEntries.filter(entry => entry.fieldType !== 'RichText');
        const textsToTranslate = stringEntries.map(e => e.sourceValue);
        let translatedTexts: string[] = [];
        if (textsToTranslate.length > 0) {
            translatedTexts = await translateBatchWithGemini(textsToTranslate, targetLocales[0]);
        }
        // Debug logging
        console.log('textsToTranslate:', textsToTranslate);
        console.log('translatedTexts:', translatedTexts);
        if (translatedTexts.length !== textsToTranslate.length) {
            console.warn('Translation count mismatch:', {
                textsToTranslate: textsToTranslate.length,
                translatedTexts: translatedTexts.length
            });
        }
        let stringIndex = 0;
        for (const entry of translationEntries) {
            let translation = '';
            let isValid = false;
            if (entry.fieldType === 'RichText') {
                translation = '';
                isValid = false;
            } else {
                translation = translatedTexts[stringIndex] || '';
                isValid = validateTranslation(entry.sourceValue, translation);
                stringIndex++;
            }
            const row = sheet.addRow({
                contentType: entry.contentType,
                fieldType: entry.fieldType,
                entryId: entry.entryId,
                fieldKey: entry.fieldKey,
                missingLocale: entry.locale,
                sourceValue: entry.sourceValue,
                translation: translation,
            });
            row.getCell("editLink").value = {
                text: "Edit Entry",
                hyperlink: entry.editLink,
            };
            if (entry.fieldType === 'RichText' || !isValid) {
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: entry.fieldType === 'RichText' ? 'FFFFCC99' : 'FFFFD7D7' }
                };
            }
        }
        const buffer = await workbook.xlsx.writeBuffer();
        return new Response(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=generate-report-fixed-${spaceId}-${environmentId}.xlsx`,
            },
        });
    } catch (error) {
        console.error("Report generation error (fixed):", error);
        return NextResponse.json({
            error: 'Failed to generate report',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
