'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useContentfulForm } from '../hooks/useContentfulForm';
import ContentfulAccessForm from '../components/contentfulAccessForm';


export default function GenerateLimitedReport() {
  const router = useRouter();
  const { form, updateField } = useContentfulForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-limited-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spaceId: form.spaceId,
          environmentId: form.environmentId,
          accessToken: form.accessToken,
          sourceLocales: 'en-US',
          targetLocales: ['pl-PL'], // Adjust target locale as needed
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate report');
      }

      // Handle Excel file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `limited-translations-${form.spaceId}-${form.environmentId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-lg mx-auto p-4">
      <button
        onClick={() => router.push('/')}
        className="mb-4 text-blue-600 hover:underline"
      >
        &larr; Back
      </button>

      <h1 className="text-2xl font-bold mb-6">Generate Limited Translation Report</h1>
      <p className="mb-4 text-gray-600">
        This will generate a report with up to 100 missing translations for testing purposes.
      </p>

      <form onSubmit={handleSubmit}>
        <ContentfulAccessForm form={form} onChange={updateField} />

        <button
          type="submit"
          disabled={loading || !form.spaceId || !form.environmentId || !form.accessToken}
          className={`w-full py-3 text-white rounded ${
            loading || !form.spaceId || !form.environmentId || !form.accessToken
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-[#8ab942] hover:bg-[#b9df89]'
          }`}
        >
          {loading ? 'Generating...' : 'Generate Limited Report'}
        </button>
      </form>

      {error && <p className="mt-4 text-red-600">{error}</p>}
    </main>
  );
}
