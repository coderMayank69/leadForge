import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "LeadForge — Intelligent Lead Distribution Engine",
  description: "A production-grade lead distribution system with fair allocation, real-time dashboards, and webhook idempotency. Inspired by Prowider.",
  keywords: ["lead distribution", "lead management", "provider allocation", "real-time dashboard"],
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
