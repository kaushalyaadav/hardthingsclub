import "@/app/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hard Things Club",
  description: "6-month accountability tracker"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
