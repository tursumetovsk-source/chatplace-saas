import './globals.css';
import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Virale AI — AI-агенты, Inbox и автоматизация продаж',
  description: 'Автоматизируйте продажи и коммуникации в Instagram, Telegram, TikTok и WhatsApp с AI-агентами, единым Inbox и CRM Virale AI.',
  metadataBase: new URL('https://virale-ai.vercel.app'),
  openGraph: {
    title: 'Virale AI — автоматизация продаж в социальных каналах',
    description: 'AI-агенты, единый Inbox, CRM и визуальные воронки для команд Казахстана и СНГ.',
    url: '/',
    siteName: 'Virale AI',
    locale: 'ru_KZ',
    type: 'website'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={manrope.variable}>
      <body className="min-h-screen bg-[#f0f0f0] text-[#141414] font-sans antialiased selection:bg-[#BEFF53] selection:text-[#0C0C0C]">
        {children}
      </body>
    </html>
  );
}
