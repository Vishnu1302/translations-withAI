// import { NextResponse } from 'next/server';
// import { createClient, PlainClientAPI, ContentFields } from 'contentful-management';
// import ExcelJS from 'exceljs';

// export const dynamic = 'force-dynamic'; // needed to enable binary response

// const jsonData: {
//     contentType: string;
//     entryTitle: string;
//     field: string;
//     sourceValue: string;
//     missingLocale: string;
//     editLink: string;
// }[] = [];

// const fetchAllEntriesForContentType = async (
//     client: PlainClientAPI,
//     spaceId: string,
//     environmentId: string,
//     contentType: string
// ) => {
//     const limit = 100;
//     let skip = 0;
//     let total = 0;
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     let allEntries: any[] = [];

//     do {
//         const response = await client.entry.getMany({
//             spaceId,
//             environmentId,
//             query: {
//                 content_type: contentType,
//                 skip,
//                 limit,
//                 include: 0,
//             },
//         });

//         allEntries = allEntries.concat(response.items);
//         total = response.total;
//         skip += limit;
//     } while (skip < total);

//     return allEntries;
// };

// export async function POST(request: Request) {
//     try {
//         console.log("Request received for report generation");
//         const { spaceId, environmentId, patToken, sourceLocales, targetLocales } = await request.json();

//         if (!spaceId || !environmentId || !patToken || !Array.isArray(targetLocales)) {
//             return NextResponse.json({ error: 'Missing or invalid required parameters' }, { status: 400 });
//         }

//         const client = createClient(
//             { accessToken: patToken },
//             { type: 'plain' }
//         );

//         const sourceLocale = sourceLocales || 'en-US'; // source language

//         const workbook = new ExcelJS.Workbook();
//         const sheet = workbook.addWorksheet("Missing Translations");

//         sheet.columns = [
//             { header: "Content Type", key: "contentType", width: 20 },
//             { header: "Entry Title", key: "entryTitle", width: 30 },
//             { header: "Field", key: "field", width: 20 },
//             { header: "Missing Locale", key: "missingLocale", width: 15 },
//             { header: sourceLocale, key: "sourceValue", width: 30 },
//             { header: "Translation", key: "translation", width: 30 },
//             { header: "Edit Link", key: "editLink", width: 30 },
//         ];

//         const contentTypes = await client.contentType.getMany({
//             spaceId,
//             environmentId,
//             query: { limit: 1000 },
//         });

//         for (const ct of contentTypes.items) {
//             const localizedFieldIds = ct.fields
//                 .filter((f: ContentFields) => f.localized)
//                 .map((f: ContentFields) => f.id);

//             if (localizedFieldIds.length === 0) continue;

//             const entries = await fetchAllEntriesForContentType(client, spaceId, environmentId, ct.sys.id);

//             for (const entry of entries) {
//                 const fields = entry.fields || {};
//                 const entryId = entry.sys.id;
//                 const title =
//                     Object.keys(fields).length > 0
//                         ? fields[Object.keys(fields)[0]]?.[sourceLocale] || "(no title)"
//                         : "(no title)";

//                 for (const fieldKey of localizedFieldIds) {
//                     const sourceValue = fields[fieldKey]?.[sourceLocale];
//                     if (!sourceValue) continue;

//                     for (const locale of targetLocales) {
//                         const targetValue = fields[fieldKey]?.[locale];
//                         if (!targetValue || targetValue === "") {
//                             const editUrl = `https://app.contentful.com/spaces/${spaceId}/environments/${environmentId}/entries/${entryId}?focusedField=${fieldKey}&focusedLocale=${locale}`;

//                             const row = sheet.addRow({
//                                 contentType: ct.sys.id,
//                                 entryTitle: title,
//                                 field: fieldKey,
//                                 missingLocale: locale,
//                                 sourceValue,
//                                 translation: "",
//                             });

//                             row.getCell("editLink").value = {
//                                 text: "Edit Entry",
//                                 hyperlink: editUrl,
//                             };
//                         }
//                     }
//                 }
//             }
//         }

//         const buffer = await workbook.xlsx.writeBuffer();

//         return new Response(buffer, {
//             status: 200,
//             headers: {
//                 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//                 'Content-Disposition': `attachment; filename=missing-translations-${spaceId}-${environmentId}.xlsx`,
//             },
//         });
//     } catch (error) {
//         console.error("Report generation error:", error);
//         return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
//     }
// }

// import { NextResponse } from 'next/server';
// import { createClient, PlainClientAPI, ContentFields } from 'contentful-management';
// import ExcelJS from 'exceljs';

// export const dynamic = 'force-dynamic'; // needed to enable binary response

// const fetchAllEntriesForContentType = async (
//     client: PlainClientAPI,
//     spaceId: string,
//     environmentId: string,
//     contentType: string
// ) => {
//     const limit = 100;
//     let skip = 0;
//     let total = 0;
//     let allEntries: any[] = [];

//     do {
//         const response = await client.entry.getMany({
//             spaceId,
//             environmentId,
//             query: {
//                 content_type: contentType,
//                 skip,
//                 limit,
//                 include: 0,
//             },
//         });

//         allEntries = allEntries.concat(response.items);
//         total = response.total;
//         skip += limit;
//     } while (skip < total);

//     return allEntries;
// };

// export async function POST(request: Request) {
//     try {
//         const { spaceId, environmentId, patToken, sourceLocales, targetLocales, generateType } = await request.json();

//         if (!spaceId || !environmentId || !patToken || !Array.isArray(targetLocales)) {
//             return NextResponse.json({ error: 'Missing or invalid required parameters' }, { status: 400 });
//         }

//         const sourceLocale = sourceLocales || 'en-US';

//         const client = createClient(
//             { accessToken: patToken },
//             { type: 'plain' }
//         );

//         const jsonData: {
//             contentType: string;
//             entryTitle: string;
//             field: string;
//             sourceValue: string;
//             missingLocale: string;
//             editLink: string;
//         }[] = [];

//         const workbook = new ExcelJS.Workbook();
//         const sheet = workbook.addWorksheet("Missing Translations");

//         sheet.columns = [
//             { header: "Content Type", key: "contentType", width: 20 },
//             { header: "Entry Title", key: "entryTitle", width: 30 },
//             { header: "Field", key: "field", width: 20 },
//             { header: "Missing Locale", key: "missingLocale", width: 15 },
//             { header: sourceLocale, key: "sourceValue", width: 30 },
//             { header: "Translation", key: "translation", width: 30 },
//             { header: "Edit Link", key: "editLink", width: 30 },
//         ];

//         const contentTypes = await client.contentType.getMany({
//             spaceId,
//             environmentId,
//             query: { limit: 1000 },
//         });

//         for (const ct of contentTypes.items) {
//             const localizedFieldIds = ct.fields
//                 .filter((f: ContentFields) => f.localized)
//                 .map((f: ContentFields) => f.id);

//             if (localizedFieldIds.length === 0) continue;

//             const entries = await fetchAllEntriesForContentType(client, spaceId, environmentId, ct.sys.id);

//             for (const entry of entries) {
//                 const fields = entry.fields || {};
//                 const entryId = entry.sys.id;
//                 const title =
//                     Object.keys(fields).length > 0
//                         ? fields[Object.keys(fields)[0]]?.[sourceLocale] || "(no title)"
//                         : "(no title)";

//                 for (const fieldKey of localizedFieldIds) {
//                     const sourceValue = fields[fieldKey]?.[sourceLocale];
//                     if (!sourceValue) continue;

//                     for (const locale of targetLocales) {
//                         const targetValue = fields[fieldKey]?.[locale];
//                         if (!targetValue || targetValue === "") {
//                             const editUrl = `https://app.contentful.com/spaces/${spaceId}/environments/${environmentId}/entries/${entryId}?focusedField=${fieldKey}&focusedLocale=${locale}`;

//                             jsonData.push({
//                                 contentType: ct.sys.id,
//                                 entryTitle: title,
//                                 field: fieldKey,
//                                 sourceValue: sourceValue,
//                                 missingLocale: locale,
//                                 editLink: editUrl,
//                             });

//                             if (generateType === 'excel') {
//                                 const row = sheet.addRow({
//                                     contentType: ct.sys.id,
//                                     entryTitle: title,
//                                     field: fieldKey,
//                                     missingLocale: locale,
//                                     sourceValue,
//                                     translation: "",
//                                 });

//                                 row.getCell("editLink").value = {
//                                     text: "Edit Entry",
//                                     hyperlink: editUrl,
//                                 };
//                             }
//                         }
//                     }
//                 }
//             }
//         }

//         if (generateType === 'json') {
//             return NextResponse.json({ data: jsonData });
//         }

//         // default to Excel
//         const buffer = await workbook.xlsx.writeBuffer();

//         return new Response(buffer, {
//             status: 200,
//             headers: {
//                 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//                 'Content-Disposition': `attachment; filename=missing-translations-${spaceId}-${environmentId}.xlsx`,
//             },
//         });
//     } catch (error) {
//         console.error("Report generation error:", error);
//         return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
//     }
// }

// app/api/generate-report/route.ts

import { NextResponse } from 'next/server';
import { createClient, PlainClientAPI, ContentFields } from 'contentful-management';
import ExcelJS from 'exceljs';
import translateBatchWithGemini from '../../helpers/gemini-ai-translation-helper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const fetchAllEntriesForContentType = async (
    client: PlainClientAPI,
    spaceId: string,
    environmentId: string,
    contentType: string
) => {
    const limit = 100;
    let skip = 0;
    let total = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let allEntries: any[] = [];

    do {
        const response = await client.entry.getMany({
            spaceId,
            environmentId,
            query: {
                content_type: contentType,
                skip,
                limit,
                include: 0,
            },
        });

        allEntries = allEntries.concat(response.items);
        total = response.total;
        skip += limit;
    } while (skip < total);

    return allEntries;
};

export async function POST(request: Request) {
    try {
        console.log("Request received for report generation");

        const { spaceId, environmentId, accessToken, sourceLocales, targetLocales } = await request.json();
        console.log("Parameters:", { spaceId, environmentId, accessToken, sourceLocales, targetLocales });

        if (!spaceId || !environmentId || !accessToken || !Array.isArray(targetLocales)) {
            return NextResponse.json({ error: 'Missing or invalid required parameters' }, { status: 400 });
        }

        const client = createClient({ accessToken: accessToken }, { type: 'plain' });

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Missing Translations");

        sheet.columns = [
            { header: "Content Type", key: "contentType", width: 20 },
            { header: "Entry Title", key: "entryTitle", width: 30 },
            { header: "Field", key: "field", width: 20 },
            { header: "Missing Locale", key: "missingLocale", width: 15 },
            { header: sourceLocales, key: "sourceValue", width: 30 },
            { header: "Translation", key: "translation", width: 30 },
            { header: "Edit Link", key: "editLink", width: 30 },
        ];

        const translationsToRun: {
            sourceValue: string;
            locale: string;
            contentType: string;
            entryTitle: string;
            field: string;
            editLink: string;
        }[] = [];

        // Get content types
        const contentTypes = await client.contentType.getMany({
            spaceId,
            environmentId,
            query: { limit: 1000 },
        });

        for (const ct of contentTypes.items) {
            // Filter for localized fields of type Text or RichText only
            const localizedTextFieldIds = ct.fields
                .filter((f: ContentFields) => f.localized &&
                    (
                        (f.type === 'RichText') ||
                        (f.type === 'Symbol' && (!f.validations || f.validations.length === 0))
                    ))
                .map((f: ContentFields) => f.id);

            if (localizedTextFieldIds.length === 0) continue;

            // Fetch all entries for this content type
            const entries = await fetchAllEntriesForContentType(client, spaceId, environmentId, ct.sys.id);

            for (const entry of entries) {
                const fields = entry.fields || {};
                const entryId = entry.sys.id;

                // Use first localized field's source locale value as title fallback
                const title =
                    Object.keys(fields).length > 0
                        ? fields[Object.keys(fields)[0]]?.[sourceLocales] || "(no title)"
                        : "(no title)";

                for (const fieldKey of localizedTextFieldIds) {
                    const sourceValue = fields[fieldKey]?.[sourceLocales];
                    if (!sourceValue) continue;

                    for (const locale of targetLocales) {
                        const targetValue = fields[fieldKey]?.[locale];
                        if (!targetValue || targetValue === "") {
                            const editLink = `https://app.contentful.com/spaces/${spaceId}/environments/${environmentId}/entries/${entryId}?focusedField=${fieldKey}&focusedLocale=${locale}`;
                            translationsToRun.push({
                                sourceValue,
                                locale,
                                contentType: ct.sys.id,
                                entryTitle: title,
                                field: fieldKey,
                                editLink,
                            });
                        }
                    }
                }
            }
        }

        console.log(`Found ${translationsToRun.length} missing translations to process.`);

        // Call AI translation for all missing translations
        // Here we assume you translate to one target locale at a time
        // You could extend for multiple locales by batching or looping
        // const translatedTexts = await translateBatchWithGemini(
        //     translationsToRun.map(t => t.sourceValue),
        //     targetLocales[0]
        // );

        const translatedTexts = await translateBatchWithGemini(
            translationsToRun.map(t => t.sourceValue),
            targetLocales[0]
        );
        // const translatedTexts: any[] = [];

        // Add rows to Excel with translations
        translatedTexts.forEach((translated, i) => {
            const item = translationsToRun[i];
            const row = sheet.addRow({
                contentType: item.contentType,
                entryTitle: item.entryTitle,
                field: item.field,
                missingLocale: item.locale,
                sourceValue: item.sourceValue,
                translation: translated,
            });
            row.getCell("editLink").value = {
                text: "Edit Entry",
                hyperlink: item.editLink,
            };
        });

        const buffer = await workbook.xlsx.writeBuffer();

        return new Response(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=missing-translations-${spaceId}-${environmentId}.xlsx`,
            },
        });
    } catch (error) {
        console.error("Report generation error:", error);
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}