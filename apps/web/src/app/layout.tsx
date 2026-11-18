import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'ZeeZo™ Billing — Fast & Smart POS Platform',
  description: 'Fast counter billing, offline POS, thermal printing, barcode scanning, and inventory management for retail shops, supermarkets, and restaurants.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
