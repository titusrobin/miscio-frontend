// src/app/layout.tsx - REPLACE your current file with this:

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Miscio AI",
  description: "Unlock Student-centricity with AI assistants",
  icons: {
    icon: '/images/mai.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-helvetica antialiased">
        {children}
      </body>
    </html>
  );
}
