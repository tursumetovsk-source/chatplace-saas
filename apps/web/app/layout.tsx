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
  title: 'Virale AI — Automate your work. Focus on what matters',
  description: 'ИИ-агенты и чат-боты Virale AI для продвижения в Instagram, Telegram и TikTok. Запустите по готовым шаблонам с телефона.'
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
