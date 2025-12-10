'use client';
import { useState } from 'react';

export interface ContentfulFormState {
  spaceId: string;
  environmentId: string;
  accessToken: string;
}

export function useContentfulForm(initial: Partial<ContentfulFormState> = {}) {
  const [form, setForm] = useState<ContentfulFormState>({
    spaceId: '',
    environmentId: '',
    accessToken: '',
    ...initial,
  });

  function updateField<K extends keyof ContentfulFormState>(key: K, value: ContentfulFormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  return { form, updateField, setForm };
}
