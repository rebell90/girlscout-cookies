import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from './SessionProvider'

export const metadata: Metadata = {
  title: "Cookie Sales Tracker",
  description: "Track Girl Scout cookie sales, inventory, and deliveries",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}