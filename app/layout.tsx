import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/session-provider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Capacity Connect — Enterprise Competency & Learning Management",
  description: "Enterprise Digital Capacity Building, Competency Rubrics, Skill Gap Analytics, and LMS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased bg-background text-foreground selection:bg-indigo-500/20 selection:text-indigo-900">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
