// // src/app/apply-translations/page.tsx
// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';

// export default function ApplyTranslations() {
//     const router = useRouter();
//     const [spaceId, setSpaceId] = useState('');
//     const [environmentId, setEnvironmentId] = useState('');
//     const [patToken, setPatToken] = useState('');
//     const [file, setFile] = useState<File | null>(null);
//     const [loading, setLoading] = useState(false);
//     const [message, setMessage] = useState<string | null>(null);
//     const [error, setError] = useState<string | null>(null);

//     async function handleSubmit(e: React.FormEvent) {
//         e.preventDefault();

//         if (!file) {
//             setError('Please upload an XLSX file.');
//             return;
//         }
//         setLoading(true);
//         setError(null);
//         setMessage(null);

//         try {
//             const formData = new FormData();
//             formData.append('spaceId', spaceId);
//             formData.append('environmentId', environmentId);
//             formData.append('patToken', patToken);
//             formData.append('file', file);

//             // Example API call:
//             const response = await fetch('/api/apply-translations', {
//                 method: 'POST',
//                 body: formData,
//             });
//             const result = await response.json();
//             if (!response.ok) throw new Error(result.message || 'Failed');
//             setMessage('Translations applied successfully!');
//             // setEnvironmentId('');
//             // setSpaceId('');
//             // setPatToken('');
//             setFile(null);
//         } catch (err) {
//             setError(`Failed to apply translations. Please check inputs and try again. ${err}`);
//         } finally {
//             setLoading(false);
//         }
//     }

//     return (
//         <main className="max-w-lg mx-auto p-4">
//             <button
//                 className="mb-4 text-blue-600 hover:underline"
//                 onClick={() => router.push('/')}
//             >
//                 &larr; Back
//             </button>

//             <h1 className="text-2xl font-bold mb-6">Apply Translations</h1>

//             <form onSubmit={handleSubmit}>
//                 <label className="block mb-2">
//                     Space ID:
//                     <input
//                         type="text"
//                         value={spaceId}
//                         onChange={(e) => setSpaceId(e.target.value)}
//                         className="mt-1 w-full p-2 border rounded"
//                         placeholder="Contentful Space ID"
//                         required
//                     />
//                 </label>

//                 <label className="block mb-2">
//                     Environment ID:
//                     <select
//                         value={environmentId}
//                         onChange={(e) => setEnvironmentId(e.target.value)}
//                         className="mt-1 w-full p-2 border rounded bg-white"
//                     >
//                         <option value="" disabled>
//                             Select environment
//                         </option>
//                         <option value="UAT">UAT</option>
//                         <option value="uat">uat</option>
//                     </select>
//                 </label>

//                 <label className="block mb-4">
//                     Contentful PAT Token:
//                     <input
//                         type="password"
//                         value={patToken}
//                         onChange={(e) => setPatToken(e.target.value)}
//                         className="mt-1 w-full p-2 border rounded"
//                         placeholder="Personal Access Token"
//                         required
//                     />
//                 </label>

//                 <label className="block mb-4 cursor-pointer">
//                     Upload XLSX File:
//                     <input
//                         type="file"
//                         accept=".xlsx, .xls"
//                         onChange={(e) => setFile(e.target.files?.[0] || null)}
//                         className="mt-1 w-full"
//                         required
//                     />
//                 </label>

//                 <button
//                     type="submit"
//                     disabled={loading || !spaceId || !environmentId || !patToken || !file}
//                     className={`w-full py-3 text-white rounded ${loading || !spaceId || !environmentId || !patToken || !file
//                         ? 'bg-gray-400 cursor-not-allowed'
//                         : 'bg-[#8ab942] hover:bg-[#b9df89]'
//                         }`}
//                 >
//                     {loading ? 'Applying...' : 'Apply Translations'}
//                 </button>
//             </form>

//             {message && <p className="mt-4 text-green-600">{message}</p>}
//             {error && <p className="mt-4 text-red-600">{error}</p>}
//         </main>
//     );
// }

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useContentfulForm } from '../hooks/useContentfulForm';
import ContentfulAccessForm from '../components/contentfulAccessForm';

export default function ApplyTranslations() {
  const router = useRouter();
  const { form, updateField } = useContentfulForm();

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      setError('Please upload an XLSX file.');
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('spaceId', form.spaceId);
      formData.append('environmentId', form.environmentId);
      formData.append('accessToken', form.accessToken);
      formData.append('file', file);

      const response = await fetch('/api/apply-translations', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed');

      setMessage('Translations applied successfully!');
      setFile(null);
    } catch (err) {
      setError(`Failed to apply translations. ${err}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-lg mx-auto p-4">
      <button onClick={() => router.push('/')} className="mb-4 text-blue-600 hover:underline">
        &larr; Back
      </button>

      <h1 className="text-2xl font-bold mb-6">Apply Translations</h1>

      <form onSubmit={handleSubmit}>
        <ContentfulAccessForm form={form} onChange={updateField} />

        <label className="block mb-4">
          Upload XLSX File:
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mt-1 w-full"
            required
          />
        </label>

        <button
          type="submit"
          disabled={loading || !form.spaceId || !form.environmentId || !form.accessToken || !file}
          className={`w-full py-3 text-white rounded ${
            loading || !form.spaceId || !form.environmentId || !form.accessToken || !file
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-[#8ab942] hover:bg-[#b9df89]'
          }`}
        >
          {loading ? 'Applying...' : 'Apply Translations'}
        </button>
      </form>

      {message && <p className="mt-4 text-green-600">{message}</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </main>
  );
}


// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';

// export default function ApplyTranslations() {
//     const router = useRouter();

//     const [form, setForm] = useState({
//         spaceId: '',
//         environmentId: '',
//         accessToken: '',
//         file: null as File | null,
//         loading: false,
//         message: null as string | null,
//         error: null as string | null,
//     });

//     function updateForm<K extends keyof typeof form>(key: K, value: typeof form[K]) {
//         setForm(prev => ({ ...prev, [key]: value }));
//     }

//     async function handleSubmit(e: React.FormEvent) {
//         e.preventDefault();

//         if (!form.file) {
//             updateForm('error', 'Please upload an XLSX file.');
//             return;
//         }

//         updateForm('loading', true);
//         updateForm('error', null);
//         updateForm('message', null);

//         try {
//             const formData = new FormData();
//             formData.append('spaceId', form.spaceId);
//             formData.append('environmentId', form.environmentId);
//             formData.append('accessToken', form.accessToken);
//             formData.append('file', form.file);

//             const response = await fetch('/api/apply-translations', {
//                 method: 'POST',
//                 body: formData,
//             });

//             const result = await response.json();

//             if (!response.ok) throw new Error(result.message || 'Failed');

//             updateForm('message', 'Translations applied successfully!');
//             setForm(prev => ({ ...prev, file: null }));
//         } catch (err) {
//             updateForm('error', `Failed to apply translations. Please check inputs and try again. ${err}`);
//         } finally {
//             updateForm('loading', false);
//         }
//     }

//     return (
//         <main className="max-w-lg mx-auto p-4">
//             <button
//                 className="mb-4 text-blue-600 hover:underline"
//                 onClick={() => router.push('/')}
//             >
//                 &larr; Back
//             </button>

//             <h1 className="text-2xl font-bold mb-6">Apply Translations</h1>

//             <form onSubmit={handleSubmit}>
//                 <label className="block mb-2">
//                     Space ID:
//                     <input
//                         type="text"
//                         value={form.spaceId}
//                         onChange={(e) => updateForm('spaceId', e.target.value)}
//                         className="mt-1 w-full p-2 border rounded"
//                         placeholder="Contentful Space ID"
//                         required
//                     />
//                 </label>

//                 <label className="block mb-2">
//                     Environment ID:
//                     <select
//                         value={form.environmentId}
//                         onChange={(e) => updateForm('environmentId', e.target.value)}
//                         className="mt-1 w-full p-2 border rounded bg-white"
//                     >
//                         <option value="" disabled>Select environment</option>
//                         <option value="UAT">UAT</option>
//                         <option value="uat">uat</option>
//                         <option value="uat-alias">uat-alias</option>
//                     </select>
//                 </label>

//                 <label className="block mb-4">
//                     Contentful PAT Token:
//                     <input
//                         type="password"
//                         value={form.accessToken}
//                         onChange={(e) => updateForm('accessToken', e.target.value)}
//                         className="mt-1 w-full p-2 border rounded"
//                         placeholder="Personal Access Token"
//                         required
//                     />
//                 </label>

//                 <label className="block mb-4 cursor-pointer">
//                     Upload XLSX File:
//                     <input
//                         type="file"
//                         accept=".xlsx, .xls"
//                         onChange={(e) => updateForm('file', e.target.files?.[0] || null)}
//                         className="mt-1 w-full"
//                         required
//                     />
//                 </label>

//                 <button
//                     type="submit"
//                     disabled={
//                         form.loading ||
//                         !form.spaceId ||
//                         !form.environmentId ||
//                         !form.accessToken ||
//                         !form.file
//                     }
//                     className={`w-full py-3 text-white rounded ${form.loading || !form.spaceId || !form.environmentId || !form.accessToken || !form.file
//                         ? 'bg-gray-400 cursor-not-allowed'
//                         : 'bg-[#8ab942] hover:bg-[#b9df89]'
//                         }`}
//                 >
//                     {form.loading ? 'Applying...' : 'Apply Translations'}
//                 </button>
//             </form>

//             {form.message && <p className="mt-4 text-green-600">{form.message}</p>}
//             {form.error && <p className="mt-4 text-red-600">{form.error}</p>}
//         </main>
//     );
// }
