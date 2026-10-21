import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Block Studio — GlobalPulse',
  description:
    'A workbench for previewing and editing every story block: one variant at a time, with live validation.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try {
              var theme = localStorage.getItem('block_studio_theme');
              if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('studio-dark');
              } else {
                document.documentElement.classList.remove('studio-dark');
              }
            } catch (_) {}`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
