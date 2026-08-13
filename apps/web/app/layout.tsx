import './globals.css';
import type { Metadata } from 'next';
import { Syne, Roboto } from 'next/font/google';

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

export const metadata: Metadata = {
  title: 'ChatPlace — Всё для роста в контенте и мессенджерах',
  description: 'ИИ-агенты и чат-боты для продвижения в Instagram, Telegram и TikTok. Запустите по готовым шаблонам с телефона.'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${syne.variable} ${roboto.variable}`}>
      <body className="min-h-screen bg-white text-zinc-900 font-body flex flex-col">
        {children}
      </body>
    </html>
  );
}
