import './globals.css';
import type { Metadata } from 'next';
import { Syne, Roboto, Plus_Jakarta_Sans } from 'next/font/google';

const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-syne'
});

const roboto = Roboto({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto'
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta'
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
    <html lang="ru" className={`${syne.variable} ${roboto.variable} ${plusJakartaSans.variable}`}>
      <body className="min-h-screen bg-[#f0f0f0] text-[#141414] font-sans antialiased selection:bg-[#BEFF53] selection:text-[#0C0C0C]">
        {children}
      </body>
    </html>
  );
}
