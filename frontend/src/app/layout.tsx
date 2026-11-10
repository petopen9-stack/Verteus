import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/lib/wallet";
import { Nav } from "@/components/Nav";

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
        <WalletProvider>
          <Nav />
          <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
          <footer className="border-t border-gray-800 mt-20 py-8 text-center text-sm text-gray-500">
            Built for NEAR HACKATHON 2026 · Agent Economy track ·{" "}
            <a
              href="https://github.com/petopen9-stack/verteus"
              className="text-verteus-500 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </footer>
        </WalletProvider>
      </body>
    </html>
  );
}
