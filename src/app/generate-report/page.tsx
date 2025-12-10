// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';

// export default function GenerateReport() {
//   const router = useRouter();

//   const [form, setForm] = useState({
//     spaceId: '',
//     environmentId: '',
//     patToken: '',
//     sourceLocales: '',
//     targetLocales: ''
//   });

//   const [errors, setErrors] = useState({
//     sourceLocales: null as string | null,
//     targetLocales: null as string | null
//   });

//   const [loading, setLoading] = useState(false);
//   const [reportUrl, setReportUrl] = useState<string | null>(null);
//   const [error, setError] = useState<string | null>(null);

//   function validateLocales(input: string): string[] | null {
//     const locales = input.split(',').map((l) => l.trim());
//     const localeRegex = /^[a-z]{2}-[A-Z]{2}$/;
//     for (const locale of locales) {
//       if (!localeRegex.test(locale)) {
//         return null;
//       }
//     }
//     return locales;
//   }

//   async function handleGenerate() {
//     setLoading(true);
//     setError(null);
//     setReportUrl(null);
//     setErrors({ sourceLocales: null, targetLocales: null });

//     const sourceLocales = validateLocales(form.sourceLocales);
//     const targetLocales = validateLocales(form.targetLocales);

//     if (!sourceLocales || !targetLocales) {
//       setErrors({
//         sourceLocales: !sourceLocales ? 'Invalid source locale format (e.g. en-US)' : null,
//         targetLocales: !targetLocales ? 'Invalid target locale format (e.g. fr-FR)' : null
//       });
//       setLoading(false);
//       return;
//     }

//     try {
//       const response = await fetch('/api/generate-report', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           spaceId: form.spaceId,
//           environmentId: form.environmentId,
//           patToken: form.patToken,
//           sourceLocales,
//           targetLocales
//         })
//       });

//       if (!response.ok) {
//         throw new Error('API error');
//       }

//       const blob = await response.blob();
//       const url = URL.createObjectURL(blob);
//       setReportUrl(url);
//     } catch (err) {
//       setError(`Failed to generate report. Please check your inputs. ${err}`);
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <main className="max-w-lg mx-auto p-4">
//       <button className="mb-4 text-blue-600 hover:underline" onClick={() => router.push('/')}>
//         &larr; Back
//       </button>

//       <h1 className="text-2xl font-bold mb-6">Generate Translation Report</h1>

//       <label className="block mb-2">
//         Space ID:
//         <input
//           type="text"
//           value={form.spaceId}
//           onChange={(e) => setForm({ ...form, spaceId: e.target.value })}
//           className="mt-1 w-full p-2 border rounded"
//           placeholder="Contentful Space ID"
//         />
//       </label>

//       <label className="block mb-2">
//         Environment ID:
//         <select
//           value={form.environmentId}
//           onChange={(e) => setForm({ ...form, environmentId: e.target.value })}
//           className="mt-1 w-full p-2 border rounded bg-white"
//         >
//           <option value="" disabled>
//             Select environment
//           </option>
//           <option value="UAT">UAT</option>
//           <option value="uat">uat</option>
//           <option value="uat-alias">uat-alias</option>
//         </select>
//       </label>

//       <label className="block mb-4">
//         Contentful PAT Token:
//         <input
//           type="password"
//           value={form.patToken}
//           onChange={(e) => setForm({ ...form, patToken: e.target.value })}
//           className="mt-1 w-full p-2 border rounded"
//           placeholder="Personal Access Token"
//         />
//       </label>

//       <label className="block mb-4">
//         Source Locales (e.g. en-US):
//         <input
//           type="text"
//           value={form.sourceLocales}
//           onChange={(e) => setForm({ ...form, sourceLocales: e.target.value })}
//           className={`mt-1 w-full p-2 border rounded ${errors.sourceLocales ? 'border-red-600' : ''}`}
//           placeholder="e.g. en-US"
//         />
//         {errors.sourceLocales && <p className="text-red-600 mt-1">{errors.sourceLocales}</p>}
//       </label>

//       <label className="block mb-4">
//         Target Locales (comma-separated, e.g. fr-FR):
//         <input
//           type="text"
//           value={form.targetLocales}
//           onChange={(e) => setForm({ ...form, targetLocales: e.target.value })}
//           className={`mt-1 w-full p-2 border rounded ${errors.targetLocales ? 'border-red-600' : ''}`}
//           placeholder="e.g. fr-FR"
//         />
//         {errors.targetLocales && <p className="text-red-600 mt-1">{errors.targetLocales}</p>}
//       </label>

//       <button
//         onClick={handleGenerate}
//         disabled={
//           loading ||
//           !form.spaceId ||
//           !form.environmentId ||
//           !form.patToken ||
//           !form.sourceLocales ||
//           !form.targetLocales
//         }
//         className={`w-full py-3 text-white rounded ${loading ||
//             !form.spaceId ||
//             !form.environmentId ||
//             !form.patToken ||
//             !form.sourceLocales ||
//             !form.targetLocales
//             ? 'bg-gray-400 cursor-not-allowed'
//             : 'bg-[#00333b] hover:bg-[#69b3c2]'
//           }`}
//       >
//         {loading ? 'Generating...' : 'Generate Report'}
//       </button>

//       {error && <p className="text-red-600 mt-4">{error}</p>}

//       {reportUrl && (
//         <div className="mt-6">
//           <p className="mb-2">Report generated successfully!</p>
//           <a
//             href={reportUrl}
//             download="translation-report.xlsx"
//             className="inline-block px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700"
//             onClick={() => {
//               setForm({
//                 spaceId: '',
//                 environmentId: '',
//                 patToken: '',
//                 sourceLocales: '',
//                 targetLocales: ''
//               });
//             }}
//           >
//             Download Excel Report
//           </a>
//           <button
//             onClick={() => router.push('/apply-translations')}
//             className="ml-4 px-6 py-3 bg-[#8ab942] text-white rounded hover:bg-[#b9df89] cursor-pointer"
//           >
//             Apply Translations
//           </button>
//         </div>
//       )}
//     </main>
//   );
// }


// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';

// export default function GenerateReport() {
//   const router = useRouter();

//   const [form, setForm] = useState({
//     spaceId: '',
//     environmentId: '',
//     patToken: '',
//     sourceLocales: '',
//     targetLocales: ''
//   });

//   const [errors, setErrors] = useState({
//     sourceLocales: null as string | null,
//     targetLocales: null as string | null
//   });

//   const [loading, setLoading] = useState(false);
//   const [reportUrl, setReportUrl] = useState<string | null>(null);
//   const [error, setError] = useState<string | null>(null);

//   function validateLocales(input: string): string[] | null {
//     const locales = input.split(',').map((l) => l.trim());
//     const localeRegex = /^[a-z]{2}-[A-Z]{2}$/;
//     for (const locale of locales) {
//       if (!localeRegex.test(locale)) {
//         return null;
//       }
//     }
//     return locales;
//   }

//   async function handleGenerate(generateType: 'excel' | 'json') {
//     setLoading(true);
//     setError(null);
//     setReportUrl(null);
//     setErrors({ sourceLocales: null, targetLocales: null });

//     const sourceLocales = validateLocales(form.sourceLocales);
//     const targetLocales = validateLocales(form.targetLocales);

//     if (!sourceLocales || !targetLocales) {
//       setErrors({
//         sourceLocales: !sourceLocales ? 'Invalid source locale format (e.g. en-US)' : null,
//         targetLocales: !targetLocales ? 'Invalid target locale format (e.g. fr-FR)' : null
//       });
//       setLoading(false);
//       return;
//     }

//     try {
//       const response = await fetch('/api/generate-report', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           spaceId: form.spaceId,
//           environmentId: form.environmentId,
//           patToken: form.patToken,
//           sourceLocales,
//           targetLocales,
//           generateType,   // <-- pass generateType here
//         }),
//       });

//       if (!response.ok) {
//         throw new Error('API error');
//       }

//       if (generateType === 'excel') {
//       // Excel: get blob and create URL for download
//       const blob = await response.blob();
//       const url = URL.createObjectURL(blob);
//       setReportUrl(url);
//     } else if (generateType === 'json') {
//       // JSON: parse json and save in sessionStorage for translations table
//       const jsonData = await response.json();
//       sessionStorage.setItem('translationsData', JSON.stringify(jsonData));
//       router.push('/translations-table');
//     }
//     } catch (err) {
//       setError(`Failed to generate report. Please check your inputs. ${err}`);
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <main className="max-w-lg mx-auto p-4">
//       <button className="mb-4 text-blue-600 hover:underline" onClick={() => router.push('/')}>
//         &larr; Back
//       </button>

//       <h1 className="text-2xl font-bold mb-6">Generate Translation Report</h1>

//       <label className="block mb-2">
//         Space ID:
//         <input
//           type="text"
//           value={form.spaceId}
//           onChange={(e) => setForm({ ...form, spaceId: e.target.value })}
//           className="mt-1 w-full p-2 border rounded"
//           placeholder="Contentful Space ID"
//         />
//       </label>

//       <label className="block mb-2">
//         Environment ID:
//         <select
//           value={form.environmentId}
//           onChange={(e) => setForm({ ...form, environmentId: e.target.value })}
//           className="mt-1 w-full p-2 border rounded bg-white"
//         >
//           <option value="" disabled>
//             Select environment
//           </option>
//           <option value="UAT">UAT</option>
//           <option value="uat">uat</option>
//           <option value="uat-alias">uat-alias</option>
//         </select>
//       </label>

//       <label className="block mb-4">
//         Contentful PAT Token:
//         <input
//           type="password"
//           value={form.patToken}
//           onChange={(e) => setForm({ ...form, patToken: e.target.value })}
//           className="mt-1 w-full p-2 border rounded"
//           placeholder="Personal Access Token"
//         />
//       </label>

//       <label className="block mb-4">
//         Source Locales (e.g. en-US):
//         <input
//           type="text"
//           value={form.sourceLocales}
//           onChange={(e) => setForm({ ...form, sourceLocales: e.target.value })}
//           className={`mt-1 w-full p-2 border rounded ${errors.sourceLocales ? 'border-red-600' : ''}`}
//           placeholder="e.g. en-US"
//         />
//         {errors.sourceLocales && <p className="text-red-600 mt-1">{errors.sourceLocales}</p>}
//       </label>

//       <label className="block mb-4">
//         Target Locales (comma-separated, e.g. fr-FR):
//         <input
//           type="text"
//           value={form.targetLocales}
//           onChange={(e) => setForm({ ...form, targetLocales: e.target.value })}
//           className={`mt-1 w-full p-2 border rounded ${errors.targetLocales ? 'border-red-600' : ''}`}
//           placeholder="e.g. fr-FR"
//         />
//         {errors.targetLocales && <p className="text-red-600 mt-1">{errors.targetLocales}</p>}
//       </label>

//       <div className="flex gap-4 mb-6">
//         <button
//           onClick={() => handleGenerate('excel')}
//           disabled={
//             loading ||
//             !form.spaceId ||
//             !form.environmentId ||
//             !form.patToken ||
//             !form.sourceLocales ||
//             !form.targetLocales
//           }
//           className={`flex-1 py-3 text-white rounded ${
//             loading ||
//             !form.spaceId ||
//             !form.environmentId ||
//             !form.patToken ||
//             !form.sourceLocales ||
//             !form.targetLocales
//               ? 'bg-gray-400 cursor-not-allowed'
//               : 'bg-[#00333b] hover:bg-[#69b3c2]'
//           }`}
//         >
//           {loading ? 'Generating...' : 'Generate Report'}
//         </button>

//         <button
//           onClick={() => handleGenerate('json')}
//           disabled={
//             loading ||
//             !form.spaceId ||
//             !form.environmentId ||
//             !form.patToken ||
//             !form.sourceLocales ||
//             !form.targetLocales
//           }
//           className={`flex-1 py-3 text-white rounded ${
//             loading ||
//             !form.spaceId ||
//             !form.environmentId ||
//             !form.patToken ||
//             !form.sourceLocales ||
//             !form.targetLocales
//               ? 'bg-gray-400 cursor-not-allowed'
//               : 'bg-[#8ab942] hover:bg-[#b9df89]'
//           }`}
//         >
//           {loading ? 'Fetching JSON...' : 'AI Translator'}
//         </button>
//       </div>

//       {error && <p className="text-red-600 mt-4">{error}</p>}

//       {reportUrl && (
//         <div className="mt-6">
//           <p className="mb-2">Report generated successfully!</p>
//           <a
//             href={reportUrl}
//             download="translation-report.xlsx"
//             className="inline-block px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700"
//             onClick={() => {
//               setForm({
//                 spaceId: '',
//                 environmentId: '',
//                 patToken: '',
//                 sourceLocales: '',
//                 targetLocales: ''
//               });
//               setReportUrl(null);
//             }}
//           >
//             Download Excel Report
//           </a>

//           <button
//             onClick={() => router.push('/apply-translations')}
//             className="ml-4 px-6 py-3 bg-[#8ab942] text-white rounded hover:bg-[#b9df89] cursor-pointer"
//           >
//             Apply Translations
//           </button>
//         </div>
//       )}
//     </main>
//   );
// }

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useContentfulForm } from '../hooks/useContentfulForm'; // adjust path as needed
import ContentfulAccessForm from '../components/contentfulAccessForm'; // adjust path as needed

export default function GenerateReport() {
  const router = useRouter();
  const { form, updateField } = useContentfulForm();
  const [sourceLocales, setSourceLocales] = useState('');
  const [targetLocales, setTargetLocales] = useState('');
  const [errors, setErrors] = useState<{ sourceLocales: string | null; targetLocales: string | null }>({ sourceLocales: null, targetLocales: null });
  const [loading, setLoading] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function validateLocales(input: string): string[] | null {
    const locales = input.split(',').map((l) => l.trim());
    const localeRegex = /^[a-z]{2}-[A-Z]{2}$/;
    return locales.every(locale => localeRegex.test(locale)) ? locales : null;
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setReportUrl(null);
    setErrors({ sourceLocales: null, targetLocales: null });

    const src = validateLocales(sourceLocales);
    const tgt = validateLocales(targetLocales);

    console.log(sourceLocales, targetLocales, src, tgt);

    if (!src || !tgt) {
      setErrors({
        sourceLocales: !src ? 'Invalid source locale format (e.g. en-US)' : null,
        targetLocales: !tgt ? 'Invalid target locale format (e.g. fr-FR)' : null,
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/generate-report-fixed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, sourceLocales: src, targetLocales: tgt }),
      });

      if (!response.ok) throw new Error('API error');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setReportUrl(url);
    } catch (err) {
      setError(`Failed to generate report. Please check your inputs. ${err}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-lg mx-auto p-4">
      <button className="mb-4 text-blue-600 hover:underline" onClick={() => router.push('/')}>
        &larr; Back
      </button>

      <h1 className="text-2xl font-bold mb-6">Generate Translation Report</h1>

      <ContentfulAccessForm form={form} onChange={updateField} />

      <label className="block mb-4">
        Source Locales (e.g. en-US):
        <input
          type="text"
          value={sourceLocales}
          onChange={(e) => setSourceLocales(e.target.value)}
          className={`mt-1 w-full p-2 border rounded ${errors.sourceLocales ? 'border-red-600' : ''}`}
          placeholder="e.g. en-US"
        />
        {errors.sourceLocales && <p className="text-red-600 mt-1">{errors.sourceLocales}</p>}
      </label>

      <label className="block mb-4">
        Target Locales (comma-separated, e.g. fr-FR):
        <input
          type="text"
          value={targetLocales}
          onChange={(e) => setTargetLocales(e.target.value)}
          className={`mt-1 w-full p-2 border rounded ${errors.targetLocales ? 'border-red-600' : ''}`}
          placeholder="e.g. fr-FR"
        />
        {errors.targetLocales && <p className="text-red-600 mt-1">{errors.targetLocales}</p>}
      </label>

      <button
        onClick={handleGenerate}
        disabled={
          loading ||
          !form.spaceId ||
          !form.environmentId ||
          !form.accessToken ||
          !sourceLocales ||
          !targetLocales
        }
        className={`w-full py-3 text-white rounded ${loading ||
          !form.spaceId ||
          !form.environmentId ||
          !form.accessToken ||
          !sourceLocales ||
          !targetLocales
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-[#00333b] hover:bg-[#69b3c2]'
          }`}
      >
        {loading ? 'Generating...' : 'Generate Report'}
      </button>

      {error && <p className="text-red-600 mt-4">{error}</p>}

      {reportUrl && (
        <div className="mt-6">
          <p className="mb-2">Report generated successfully!</p>
          <a
            href={reportUrl}
            download="translation-report.xlsx"
            className="inline-block px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Download Excel Report
          </a>
          <button
            onClick={() => router.push('/apply-translations')}
            className="ml-4 px-6 py-3 bg-[#8ab942] text-white rounded hover:bg-[#b9df89] cursor-pointer"
          >
            Apply Translations
          </button>
        </div>
      )}
    </main>
  );
}
