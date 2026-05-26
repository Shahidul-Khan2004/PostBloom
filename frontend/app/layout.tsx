import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import '../styles.css';
import './app.css';

export const metadata: Metadata = {
  title: 'PostBloom',
  description: 'The AI operating system for creator teams.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script src="/app/app.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
