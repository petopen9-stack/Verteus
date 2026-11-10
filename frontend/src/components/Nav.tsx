"use client";

import { useWallet } from "@/lib/wallet";

export function Nav() {
  const { accountId, isConnected, connect, disconnect } = useWallet();

  return (
    <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <a href="/" className="text-2xl font-bold text-verteus-500">
          Verteus
        </a>
        <span className="text-xs bg-verteus-900 text-verteus-100 px-2 py-0.5 rounded-full">
          BETA
        </span>
      </div>

      <div className="flex items-center gap-6 text-sm">
        <a href="/" className="text-gray-400 hover:text-white">
          Discover
        </a>
        <a href="/list" className="text-gray-400 hover:text-white">
          List Skill
        </a>
        <a href="/auctions" className="text-gray-400 hover:text-white">
          Auctions
        </a>
        <a href="/dashboard" className="text-gray-400 hover:text-white">
          Dashboard
        </a>

        {isConnected ? (
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-gray-400 max-w-[120px] truncate">
              {accountId}
            </span>
            <button
              onClick={() => disconnect()}
              className="text-xs border border-gray-700 px-3 py-1.5 rounded-lg hover:border-gray-500"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={connect}
            className="bg-verteus-600 hover:bg-verteus-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
}
