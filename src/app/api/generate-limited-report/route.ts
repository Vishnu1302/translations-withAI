// import { NextResponse } from 'next/server';
// import { createClient, PlainClientAPI, ContentFields } from 'contentful-management';
// import ExcelJS from 'exceljs';
// import translateBatchWithGemini from '../../helpers/gemini-ai-translation-helper';

// export const runtime = 'nodejs';
// export const dynamic = 'force-dynamic';

// interface TranslationEntry {
//     contentType: string;
//     sourceValue: string;
//     locale: string;
//     editLink: string;
// }

// const fetchAllEntriesForContentType = async (
//     client: PlainClientAPI,
//     spaceId: string,
//     environmentId: string,
//     contentType: string,
//     limit = 20 // Limit entries per content type
// ) => {
//     try {
//         const response = await client.entry.getMany({
//             spaceId,
//             environmentId,
//             query: {
//                 content_type: contentType,
//                 limit,
//                 include: 0,
//             },
//         });

//         return response.items;
//     } catch (error) {
//         console.error(`Error fetching entries for content type ${contentType}:`, error);
//         return [];
//     }
// };

// function validateTranslation(original: any, translated: any): boolean {
//     // First check if both values are valid strings
//     if (typeof original !== 'string' || typeof translated !== 'string') {
//         return false;
//     }

//     // Skip validation for URLs, paths, or JSON content
//     if (original.startsWith('/') ||
//         original.startsWith('http') ||
//         original.includes('{') ||
//         original.includes('[')) {
//         return true;
//     }

//     // Basic validation rules
//     const isValid =
//         translated &&
//         translated.length >= original.length / 3 &&
//         translated.length <= original.length * 3 &&
//         translated !== original && // Not identical (unless it's a proper noun)
//         !/^\/|^http/.test(translated); // Doesn't start with / or http

//     return Boolean(isValid);
// }

// export async function POST(request: Request) {
//     try {
//         console.log("Request received for limited report generation");

//         const { spaceId, environmentId, accessToken, sourceLocales, targetLocales } = await request.json();
//         console.log("Parameters:", { spaceId, environmentId, sourceLocales, targetLocales });

//         if (!spaceId || !environmentId || !accessToken || !Array.isArray(targetLocales)) {
//             return NextResponse.json({ error: 'Missing or invalid required parameters' }, { status: 400 });
//         }

//         const client = createClient({ accessToken }, { type: 'plain' });
//         const workbook = new ExcelJS.Workbook();
//         const sheet = workbook.addWorksheet("Missing Translations (Limited)");

//         // Enhanced column structure
//         sheet.columns = [
//             { header: "Content Type", key: "contentType", width: 20 },
//             { header: "Missing Locale", key: "missingLocale", width: 15 },
//             { header: sourceLocales, key: "sourceValue", width: 40 },
//             { header: "Translation", key: "translation", width: 40 },
//             { header: "Edit Link", key: "editLink", width: 30 },
//         ];

//         const contentTypes = await client.contentType.getMany({
//             spaceId,
//             environmentId,
//             query: { limit: 100 }, // Limit to 5 content types for testing
//         });

//         const translationEntries: TranslationEntry[] = [];

//         // Collect entries that need translation
//         for (const ct of contentTypes.items) {
//             // Get field types for reference
//             const fieldTypes = new Map(
//                 ct.fields.map(f => [f.id, f.type])
//             );

//             const localizedTextFieldIds = ct.fields
//                 .filter((f: ContentFields) => f.localized &&
//                     (f.type === 'Text' || f.type === 'Symbol' || f.type === 'RichText'))
//                 .map((f: ContentFields) => f.id);

//             if (localizedTextFieldIds.length === 0) continue;

//             const entries = await fetchAllEntriesForContentType(
//                 client,
//                 spaceId,
//                 environmentId,
//                 ct.sys.id
//             );

//             // Inside your entry processing loop, replace the sourceValue extraction:
//             for (const entry of entries) {
//                 const fields = entry.fields || {};
//                 const entryId = entry.sys.id;
//                 const title = fields[Object.keys(fields)[0]]?.[sourceLocales] || "(no title)";

//                 for (const fieldKey of localizedTextFieldIds) {
//                     const sourceValue = fields[fieldKey]?.[sourceLocales];

//                     // Skip if sourceValue is not a string or is empty
//                     if (!sourceValue || typeof sourceValue !== 'string' || sourceValue.trim() === '') {
//                         continue;
//                     }

//                     for (const locale of targetLocales) {
//                         const targetValue = fields[fieldKey]?.[locale];
//                         if (!targetValue || targetValue === "") {
//                             const editLink = `https://app.contentful.com/spaces/${spaceId}/environments/${environmentId}/entries/${entryId}?focusedField=${fieldKey}&focusedLocale=${locale}`;

//                             translationEntries.push({
//                                 contentType: ct.sys.id,
//                                 sourceValue: sourceValue, // Now guaranteed to be a string
//                                 locale,
//                                 editLink
//                             });
//                         }
//                     }
//                 }
//             }
//         }

//         // Limit to 100 entries
//         const limitedEntries = translationEntries;
//         console.log(`Processing ${limitedEntries.length} entries out of ${translationEntries.length} total`);

//         // Translate in batches
//         const textsToTranslate = limitedEntries.map(e => e.sourceValue);
//         const translatedTexts = await translateBatchWithGemini(textsToTranslate, targetLocales[0]);

//         // Add rows to Excel with translations and validation
//         limitedEntries.forEach((item, i) => {
//             const translation = translatedTexts[i];
//             const isValid = validateTranslation(item.sourceValue, translation);

//             const row = sheet.addRow({
//                 contentType: item.contentType,
//                 missingLocale: item.locale,
//                 sourceValue: item.sourceValue,
//                 translation: translation,
//             });

//             row.getCell("editLink").value = {
//                 text: "Edit Entry",
//                 hyperlink: item.editLink,
//             };

//             // Highlight rows that need review
//             if (!isValid) {
//                 row.fill = {
//                     type: 'pattern',
//                     pattern: 'solid',
//                     fgColor: { argb: 'FFFFD7D7' }
//                 };
//             }
//         });

//         const buffer = await workbook.xlsx.writeBuffer();

//         return new Response(buffer, {
//             status: 200,
//             headers: {
//                 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//                 'Content-Disposition': `attachment; filename=limited-translations-${spaceId}-${environmentId}.xlsx`,
//             },
//         });
//     } catch (error) {
//         console.error("Report generation error:", error);
//         return NextResponse.json({
//             error: 'Failed to generate report',
//             details: error instanceof Error ? error.message : 'Unknown error'
//         }, { status: 500 });
//     }
// }


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
}

const fetchAllEntriesForContentType = async (
    client: PlainClientAPI,
    spaceId: string,
    environmentId: string,
    contentType: string,
    limit = 20 // Limit entries per content type
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

function validateTranslation(original: any, translated: any): boolean {
    // First check if both values are valid strings
    if (typeof original !== 'string' || typeof translated !== 'string') {
        return false;
    }

    // Skip validation for URLs, paths, or JSON content
    if (original.startsWith('/') ||
        original.startsWith('http') ||
        original.includes('{') ||
        original.includes('[')) {
        return true;
    }

    // Basic validation rules
    const isValid =
        translated &&
        translated.length >= original.length / 3 &&
        translated.length <= original.length * 3 &&
        translated !== original && // Not identical (unless it's a proper noun)
        !/^\/|^http/.test(translated); // Doesn't start with / or http

    return Boolean(isValid);
}

export async function POST(request: Request) {
    try {
        console.log("Request received for limited report generation");

        const { spaceId, environmentId, accessToken, sourceLocales, targetLocales } = await request.json();
        console.log("Parameters:", { spaceId, environmentId, sourceLocales, targetLocales });

        if (!spaceId || !environmentId || !accessToken || !Array.isArray(targetLocales)) {
            return NextResponse.json({ error: 'Missing or invalid required parameters' }, { status: 400 });
        }

        const client = createClient({ accessToken }, { type: 'plain' });
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Missing Translations (Limited)");

        // Enhanced column structure
        sheet.columns = [
            { header: "Content Type", key: "contentType", width: 20 },
            { header: "Field Type", key: "fieldType", width: 15 },
            { header: "Missing Locale", key: "missingLocale", width: 15 },
            { header: sourceLocales, key: "sourceValue", width: 60 },
            { header: "Translation", key: "translation", width: 40 },
            { header: "Edit Link", key: "editLink", width: 30 },
        ];

        const contentTypes = await client.contentType.getMany({
            spaceId,
            environmentId,
            query: { limit: 100 }, // Limit to 100 content types
        });

        const translationEntries: TranslationEntry[] = [];

        // Collect entries that need translation
        for (const ct of contentTypes.items) {
            // Get field types for reference
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

            // Simple processing - keep everything as is
            for (const entry of entries) {
                const fields = entry.fields || {};
                const entryId = entry.sys.id;

                for (const fieldKey of localizedTextFieldIds) {
                    const sourceValue = fields[fieldKey]?.[sourceLocales];
                    const fieldType = fieldTypes.get(fieldKey) || 'unknown';

                    // Skip only if completely missing
                    if (sourceValue === undefined || sourceValue === null) {
                        continue;
                    }

                    // Convert to string for display (JSON.stringify for objects)
                    let displaySourceValue: string;
                    if (typeof sourceValue === 'string') {
                        displaySourceValue = sourceValue;
                    } else {
                        displaySourceValue = JSON.stringify(sourceValue, null, 2);
                    }

                    for (const locale of targetLocales) {
                        const targetValue = fields[fieldKey]?.[locale];
                        
                        // Check if target is missing or empty
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
                                fieldType
                            });
                        }
                    }
                }
            }
        }

        const limitedEntries = translationEntries;
        console.log(`Processing ${limitedEntries.length} entries out of ${translationEntries.length} total`);

        if (limitedEntries.length === 0) {
            console.log("No entries found that need translation");
            
            // Create empty report
            sheet.addRow({
                contentType: "N/A",
                fieldType: "N/A",
                missingLocale: "N/A",
                sourceValue: "No entries found that need translation",
                translation: "Check your content types and locales",
            });
        } else {
            // Separate string fields from rich text fields for translation
            const stringEntries = limitedEntries.filter(entry => entry.fieldType !== 'RichText');
            const richTextEntries = limitedEntries.filter(entry => entry.fieldType === 'RichText');

            console.log(`Found ${stringEntries.length} string fields and ${richTextEntries.length} rich text fields`);

            // Translate only string fields
            let translatedTexts: string[] = [];
            if (stringEntries.length > 0) {
                const textsToTranslate = stringEntries.map(e => e.sourceValue);
                console.log(`Translating ${textsToTranslate.length} string texts`);
                translatedTexts = await translateBatchWithGemini(textsToTranslate, targetLocales[0]);
                console.log(`Received ${translatedTexts.length} translations`);
            }

            // Add rows to Excel
            let stringIndex = 0;
            limitedEntries.forEach((item) => {
                let translation = '';
                let isValid = false;

                if (item.fieldType === 'RichText') {
                    // Leave translation empty for rich text
                    translation = '';
                    isValid = false;
                } else {
                    // Use translated text for string fields
                    translation = translatedTexts[stringIndex] || '';
                    isValid = validateTranslation(item.sourceValue, translation);
                    stringIndex++;
                }

                const row = sheet.addRow({
                    contentType: item.contentType,
                    fieldType: item.fieldType,
                    missingLocale: item.locale,
                    sourceValue: item.sourceValue,
                    translation: translation,
                });

                row.getCell("editLink").value = {
                    text: "Edit Entry",
                    hyperlink: item.editLink,
                };

                // Highlight rich text rows and invalid translations
                if (item.fieldType === 'RichText' || !isValid) {
                    row.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: item.fieldType === 'RichText' ? 'FFFFCC99' : 'FFFFD7D7' } // Orange for rich text, red for invalid
                    };
                }
            });
        }

        const buffer = await workbook.xlsx.writeBuffer();

        return new Response(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=limited-translations-${spaceId}-${environmentId}.xlsx`,
            },
        });
    } catch (error) {
        console.error("Report generation error:", error);
        return NextResponse.json({
            error: 'Failed to generate report',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}