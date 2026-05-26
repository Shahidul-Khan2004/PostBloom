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
        <Script id="postbloom-config" strategy="beforeInteractive">
          {`window.__POSTBLOOM_API_BASE__=${JSON.stringify(process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000')};`}
        </Script>
        <Script src="/app/app.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
