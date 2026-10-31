import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'POS Platform',
  description: 'MSME Point of Sale and Business Management Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
