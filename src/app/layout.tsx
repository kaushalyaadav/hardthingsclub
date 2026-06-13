import "@/app/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hard Things Club",
  description: "Log daily. Build consistency.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HTC",
  },
  formatDetection: { telephone: false },
};

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/htc-logo.jpg" />
      </head>
      <body>{children}</body>
    </html>
  );
}
