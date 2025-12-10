// src/app/page.tsx
'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
      <h1 className="text-3xl font-bold">Translation helper for Opcos</h1>

      <p>This tool helps you fetch a report from Contentful in Excel format, listing all your localized fields alongside their source-locale (e.g., English) content.</p>
      <p>Click “Generate Report” to download an Excel file containing every localized field in your space.</p>

      <p>Open the downloaded workbook and enter your translations. Avoid editing rich-text or reference fields in Excel—if you need to translate those, use the “Edit Entry” link in the sheet to go directly to that entry and field in the Contentful web app.</p>

      <p>When your Excel is complete, switch to “Apply Translations,” upload the file, and let the tool push your new translations back into Contentful automatically.</p>

      <div className="flex gap-4">
        <button
          className="px-6 py-3 bg-[#00333b] text-white rounded hover:bg-[#69b3c2] cursor-pointer"
          onClick={() => router.push('/generate-report')}
        >
          Generate Report
        </button>
        <button
          className="px-6 py-3 bg-[#8ab942] text-white rounded hover:bg-[#b9df89] cursor-pointer"
          onClick={() => router.push('/apply-translations')}
        >
          Apply Translations
        </button>
      </div>
    </main>
  );
}
