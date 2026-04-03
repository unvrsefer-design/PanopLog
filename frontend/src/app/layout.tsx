import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PanopLog",
  description: "AI Incident Intelligence",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}