import type { Metadata } from 'next';
import './globals.css';
import { GoogleNewsHeader } from '../components/GoogleNewsHeader';

export const metadata: Metadata = {
  title: 'GlobalPulse — Independent Global News, Tech, Business & Science',
  description: 'Comprehensive, real-time news coverage aggregated across global bureaus and verified sources by GlobalPulse.',
  metadataBase: new URL('https://globalpulse.news'),
  openGraph: {
    title: 'GlobalPulse — Independent Global News',
    description: 'Comprehensive, real-time news coverage aggregated across global bureaus and verified sources.',
    url: 'https://globalpulse.news',
    siteName: 'GlobalPulse News',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GlobalPulse News',
    description: 'Real-time multi-agent and human verified news dispatches.',
  },
  alternates: {
    types: {
      'application/rss+xml': '/api/feeds/rss',
      'application/atom+xml': '/api/feeds/atom',
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 selection:bg-blue-500/20 selection:text-blue-600 transition-colors">
        <GoogleNewsHeader />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-10 mt-16 text-xs text-slate-500 dark:text-slate-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 dark:text-white flex items-center gap-1 text-sm">
                  Global<span className="text-blue-600">Pulse</span>
                </span>
                <span>•</span>
                <span>Modern High-Performance Publishing Platform</span>
              </div>

              <div className="flex items-center gap-6">
                <span className="hover:text-blue-600 cursor-pointer">Editorial Standards</span>
                <span className="hover:text-blue-600 cursor-pointer">Privacy Policy</span>
                <span className="hover:text-blue-600 cursor-pointer">Terms of Service</span>
                <span className="hover:text-blue-600 cursor-pointer">Publisher Registry</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
              <p>© 2026 GlobalPulse Platform. Verified news and multimedia intelligence.</p>
              <div className="flex items-center gap-2">
                <span>Edition:</span>
                <span className="font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  Global Edition (English)
                </span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
