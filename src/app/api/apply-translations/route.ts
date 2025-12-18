// import { NextRequest, NextResponse } from 'next/server';
// import { createClient, PlainClientAPI } from 'contentful-management';
// import * as XLSX from 'xlsx';

// type TranslationRow = {
//   field: string;
//   locale: string;
//   translation: string;
//   editLink: string;
// };

// async function parseExcel(buffer: Buffer): Promise<TranslationRow[]> {
//   const workbook = XLSX.read(buffer, { type: 'buffer' });
//   const sheetName = workbook.SheetNames[0];
//   const sheet = workbook.Sheets[sheetName]!;

//   // first, read all rows into JSON so we get field/locale/translation values
//   // defval:'' ensures empty strings rather than undefined
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

//   const translations: TranslationRow[] = [];

//   // now for each row, grab the hyperlink URL from the raw sheet
//   for (let rowIndex = 0; rowIndex < json.length; rowIndex++) {
//     const row = json[rowIndex];
//     const field       = row['Field'];
//     const locale      = row['Missing Locale'];
//     const translation = row['Translation'];

//     // compute the Excel row number (json[0] is row 2 in the sheet, etc.)
//     const excelRowNum = rowIndex + 2; 

//     // column letter for "Edit Link" might be found via header lookup, but
//     // if you know it's in column H (for example), you can hard‐code it:
//     // const linkCellAddr = `H${excelRowNum}`;

//     // to find dynamically:
//     const headers = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, range: 0 })[0];
//     const editLinkColIndex = headers.findIndex(h => h === 'Edit Link');
//     const colLetter = XLSX.utils.encode_col(editLinkColIndex);
//     const linkCellAddr = `${colLetter}${excelRowNum}`;

//     const linkCell = sheet[linkCellAddr];
//     const editLink = linkCell && typeof linkCell.l === 'object'
//       ? (linkCell.l as { Target: string }).Target
//       : '';

//     if (field && locale && translation && editLink) {
//       translations.push({ field, locale, translation, editLink });
//     }
//   }

//   return translations;
// }


// async function applyTranslationsToContentful(
//   translations: TranslationRow[],
//   spaceId: string,
//   environmentId: string,
//   patToken: string
// ) {
//   const client: PlainClientAPI = createClient({ accessToken: patToken }, {type: 'plain' });

//   const translationsByEntry: Record<string, TranslationRow[]> = {};

//   for (const t of translations) {
//     const match = t.editLink.match(/\/entries\/([a-zA-Z0-9]+)/);
//     if (!match) continue;
//     const entryId = match[1];

//     if (!translationsByEntry[entryId]) {
//       translationsByEntry[entryId] = [];
//     }
//     translationsByEntry[entryId].push(t);
//   }
//   console.log("Translations grouped by entry", translationsByEntry);

//   for (const [entryId, trans] of Object.entries(translationsByEntry)) {
//     const entry = await client.entry.get({spaceId, environmentId, entryId});
//     console.log("Entry found", entryId, entry);

//     for (const t of trans) {
//       if (!entry.fields[t.field]) {
//         entry.fields[t.field] = {};
//       }
//       entry.fields[t.field][t.locale] = t.translation;
//     }

//     const updated = await client.entry.update({spaceId, environmentId, entryId}, entry);
//     await client.entry.publish({spaceId, environmentId, entryId}, updated);
//   }
// }

// export async function POST(req: NextRequest) {
//   try {
//     const form = await req.formData();

//     const file = form.get('file') as File;
//     const spaceId = form.get('spaceId')?.toString();
//     const environmentId = form.get('environmentId')?.toString();
//     const patToken = form.get('patToken')?.toString();

//     if (!file || !spaceId || !environmentId || !patToken) {
//       return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
//     }

//     const buffer = Buffer.from(await file.arrayBuffer());
//     const translations = await parseExcel(buffer);

//     if (!translations.length) {
//       return NextResponse.json({ message: 'No valid rows found' }, { status: 400 });
//     }

//     await applyTranslationsToContentful(translations, spaceId, environmentId, patToken);

//     return NextResponse.json({ message: 'Translations applied successfully' });
//   } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
//     return NextResponse.json({ message: err.message || 'Something went wrong' }, { status: 500 });
//   }
// }


import { NextRequest, NextResponse } from 'next/server';
import { createClient, PlainClientAPI } from 'contentful-management';
import * as XLSX from 'xlsx';

type TranslationRow = {
  field: string;
  locale: string;
  translation: string | Record<string, unknown>;
  editLink: string;
};

async function parseExcel(buffer: Buffer): Promise<TranslationRow[]> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName]!;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  const headers = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, range: 0 })[0];
  const editLinkColIndex = headers.findIndex(h => h === 'Edit Link');
  const colLetter = XLSX.utils.encode_col(editLinkColIndex);

  const translations: TranslationRow[] = [];

  for (let rowIndex = 0; rowIndex < json.length; rowIndex++) {
    const row = json[rowIndex];
    const field = row['Field'];
    const locale = row['Missing Locale'];
    const rawTranslation = row['Translation'];

    const excelRowNum = rowIndex + 2;
    const linkCellAddr = `${colLetter}${excelRowNum}`;
    const linkCell = sheet[linkCellAddr];
    const editLink = linkCell && typeof linkCell.l === 'object'
      ? (linkCell.l as { Target: string }).Target
      : '';

    let translation: string | Record<string, unknown> = rawTranslation;

    // Try parsing as JSON
    try {
      const parsed = JSON.parse(rawTranslation);
      if (typeof parsed === 'object' && parsed !== null) {
        translation = parsed;
      }
    } catch {
      // Keep it as string if parsing fails
    }

    if (field && locale && translation && editLink) {
      translations.push({ field, locale, translation, editLink });
    }
  }

  return translations;
}

async function applyTranslationsToContentful(
  translations: TranslationRow[],
  spaceId: string,
  environmentId: string,
  accessToken: string
) {
  const client: PlainClientAPI = createClient({ accessToken: accessToken }, { type: 'plain' });

  const translationsByEntry: Record<string, TranslationRow[]> = {};

  for (const t of translations) {
    const match = t.editLink.match(/\/entries\/([a-zA-Z0-9]+)/);
    if (!match) continue;
    const entryId = match[1];

    if (!translationsByEntry[entryId]) {
      translationsByEntry[entryId] = [];
    }
    translationsByEntry[entryId].push(t);
  }

  console.log("🧩 Translations grouped by entry", Object.keys(translationsByEntry).length);

  for (const [entryId, trans] of Object.entries(translationsByEntry)) {
    try {
      const entry = await client.entry.get({ spaceId, environmentId, entryId });
      console.log(`✅ Found entry: ${entryId}`);

      for (const t of trans) {
        if (!entry.fields[t.field]) {
          entry.fields[t.field] = {};
        }
        entry.fields[t.field][t.locale] = t.translation;
      }

      const updated = await client.entry.update({ spaceId, environmentId, entryId }, entry);
      await client.entry.publish({ spaceId, environmentId, entryId }, updated);

      console.log(`🚀 Updated and published entry: ${entryId}`);
    } catch (error: unknown) {
      // Catch missing or deleted entries
      const err = error as { name?: string; message?: string };
      if (err.name === 'NotFound' || err.message?.includes('not exist')) {
        console.warn(`⚠️ Entry not found: ${entryId}, skipping...`);
        continue;
      }
      // Catch permission or API-related issues
      console.error(`❌ Error updating entry ${entryId}: ${err.message}`);
      continue;
    }
  }
}


// async function applyTranslationsToContentful(
//   translations: TranslationRow[],
//   spaceId: string,
//   environmentId: string,
//   accessToken: string
// ) {
//   const client: PlainClientAPI = createClient({ accessToken: accessToken }, { type: 'plain' });

//   const translationsByEntry: Record<string, TranslationRow[]> = {};

//   for (const t of translations) {
//     const match = t.editLink.match(/\/entries\/([a-zA-Z0-9]+)/);
//     if (!match) continue;
//     const entryId = match[1];

//     if (!translationsByEntry[entryId]) {
//       translationsByEntry[entryId] = [];
//     }
//     translationsByEntry[entryId].push(t);
//   }

//   console.log("Translations grouped by entry", translationsByEntry);

//   for (const [entryId, trans] of Object.entries(translationsByEntry)) {
//     const entry = await client.entry.get({ spaceId, environmentId, entryId });
//     console.log("Entry found", entryId, entry);

//     for (const t of trans) {
//       if (!entry.fields[t.field]) {
//         entry.fields[t.field] = {};
//       }

//       // This supports both plain strings and structured JSON (like RichText)
//       entry.fields[t.field][t.locale] = t.translation;
//     }

//     const updated = await client.entry.update({ spaceId, environmentId, entryId }, entry);
//     await client.entry.publish({ spaceId, environmentId, entryId }, updated);
//   }
// }

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    const file = form.get('file') as File;
    const spaceId = form.get('spaceId')?.toString();
    const environmentId = form.get('environmentId')?.toString();
    const accessToken = form.get('accessToken')?.toString();

    if (!file || !spaceId || !environmentId || !accessToken) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const translations = await parseExcel(buffer);

    if (!translations.length) {
      return NextResponse.json({ message: 'No valid rows found' }, { status: 400 });
    }

    await applyTranslationsToContentful(translations, spaceId, environmentId, accessToken);

    return NextResponse.json({ message: 'Translations applied successfully' });
  } 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any 
  catch (err: any) {
    return NextResponse.json({ message: err.message || 'Something went wrong' }, { status: 500 });
  }
}

