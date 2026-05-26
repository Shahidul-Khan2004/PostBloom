'use client';

import { useEffect } from 'react';

type LegacyPageProps = {
  bodyClass?: string;
  html: string;
  page?: string;
};

export function LegacyPage({ bodyClass = '', html, page }: LegacyPageProps) {
  useEffect(() => {
    document.body.className = bodyClass;
    if (page) {
      document.body.dataset.page = page;
    } else {
      delete document.body.dataset.page;
    }
  }, [bodyClass, page]);

  return (
    <div data-postbloom-page={page || undefined} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
