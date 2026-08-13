import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'ChatPlace — Omnichannel AI Sales & Automation Platform',
  description: 'Enterprise multi-tenant platform for Instagram, Telegram, TikTok, WhatsApp automations & AI sales agents in Kazakhstan & CIS.'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="dark">
      <body className={`${inter.className} min-h-screen bg-zinc-950 text-zinc-100 flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
