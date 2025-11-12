import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agentic Google Drive → YouTube Uploader",
  description:
    "Coordinate Google Drive sourcing, AI-driven creative, and programmatic uploads to YouTube."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
