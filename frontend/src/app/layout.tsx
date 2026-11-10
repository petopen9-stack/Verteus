import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Verteus — Rare Skill Marketplace for AI Agents",
  description: "Trade scarce, specialized AI skills on NEAR. Lease, auction, compose.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-verteus-500">Verteus</span>
            <span className="text-xs bg-verteus-900 text-verteus-100 px-2 py-0.5 rounded-full">
              BETA
            </span>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="/" className="hover:text-white">Discover</a>
            <a href="/list" className="hover:text-white">List Skill</a>
            <a href="/dashboard" className="hover:text-white">Dashboard</a>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
        <footer className="border-t border-gray-800 mt-20 py-8 text-center text-sm text-gray-500">
          Built for NEAR HACKATHON 2026 · Agent Economy track
        </footer>
      </body>
    </html>
  );
}
