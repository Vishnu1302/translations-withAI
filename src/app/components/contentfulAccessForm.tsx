'use client';
import React from 'react';

interface Props {
  form: {
    spaceId: string;
    environmentId: string;
    accessToken: string;
  };
  onChange: (key: keyof Props['form'], value: string) => void;
}

export default function ContentfulAccessForm({ form, onChange }: Props) {
  return (
    <>
      <label className="block mb-2">
        Space ID:
        <input
          type="text"
          value={form.spaceId}
          onChange={(e) => onChange('spaceId', e.target.value)}
          className="mt-1 w-full p-2 border rounded"
          placeholder="Contentful Space ID"
          required
        />
      </label>

      <label className="block mb-2">
        Environment ID:
        {/* <select
          value={form.environmentId}
          onChange={(e) => onChange('environmentId', e.target.value)}
          className="mt-1 w-full p-2 border rounded bg-white"
          required
        >
          <option value="" disabled>Select environment</option>
          <option value="UAT">UAT</option>
          <option value="uat">uat</option>
          <option value="uat-alias">uat-alias</option>
        </select> */}
         <input
          type="text"
          value={form.environmentId}
          onChange={(e) => onChange('environmentId', e.target.value)}
          className="mt-1 w-full p-2 border rounded"
          placeholder="e.g., master, uat"
          required
        />
      </label>

      <label className="block mb-4">
        Contentful PAT Token:
        <input
          type="password"
          value={form.accessToken}
          onChange={(e) => onChange('accessToken', e.target.value)}
          className="mt-1 w-full p-2 border rounded"
          placeholder="Personal Access Token"
          required
        />
      </label>
    </>
  );
}
