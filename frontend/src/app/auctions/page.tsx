"use client";

import { useEffect, useState } from "react";
import { viewMethod, CONTRACT_ID } from "@/lib/near";
import { useWallet } from "@/lib/wallet";

interface Auction {
  skill_id: number;
  seller: string;
  start_price: string;
  end_price: string;
  start_time: number;
  end_time: number;
  winner: string | null;
  final_price: string | null;
  settled: boolean;
}

function formatNear(yocto: string) {
  const n = BigInt(yocto || "0");
  return (Number(n) / 1e24).toFixed(2);
}

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState<[number, Auction][]>([]);
  const [prices, setPrices] = useState<Record<number, string>>({});
  const { isConnected, connect, callMethod } = useWallet();
  const [buying, setBuying] = useState<number | null>(null);

  useEffect(() => {
    if (!CONTRACT_ID) return;
    viewMethod("get_active_auctions", { limit: 20 })
      .then(async (data) => {
        if (data && Array.isArray(data)) {
          setAuctions(data);
          const priceMap: Record<number, string> = {};
          for (const [id] of data) {
            const p = await viewMethod("get_auction_price", { auction_id: id });
            if (p) priceMap[id] = p;
          }
          setPrices(priceMap);
        }
      })
      .catch(console.error);
  }, []);

  const handleBuy = async (auctionId: number, price: string) => {
    if (!isConnected) {
      connect();
      return;
    }
    setBuying(auctionId);
    try {
      await callMethod("buy_auction", { auction_id: auctionId }, price);
      alert(`Won auction #${auctionId}!`);
    } catch (e: any) {
      alert(e?.message || "Buy failed");
    } finally {
      setBuying(null);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Dutch Auctions</h1>
      <p className="text-gray-400 mb-10">
        High-rarity skills (≥ 80) can be auctioned. Price starts high and decays over time — buy when
        the price feels right.
      </p>

      {!CONTRACT_ID && (
        <div className="border border-dashed border-gray-700 rounded-xl p-12 text-center text-gray-500">
          Connect a deployed contract to see live auctions.
          <br />
          <span className="text-sm">Set NEXT_PUBLIC_CONTRACT_ID in .env.local</span>
        </div>
      )}

      {CONTRACT_ID && auctions.length === 0 && (
        <div className="border border-dashed border-gray-700 rounded-xl p-12 text-center text-gray-500">
          No active auctions right now.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {auctions.map(([id, auction]) => (
          <div
            key={id}
            className="border border-gray-800 rounded-xl p-6 bg-gray-900/50"
          >
            <div className="flex justify-between mb-3">
              <h2 className="text-lg font-semibold">Auction #{id}</h2>
              <span className="text-xs bg-purple-900 text-purple-200 px-2 py-1 rounded">
                Skill #{auction.skill_id}
              </span>
            </div>
            <div className="text-sm text-gray-400 space-y-1 mb-4">
              <div>Seller: {auction.seller}</div>
              <div>
                Range: {formatNear(auction.start_price)} → {formatNear(auction.end_price)} NEAR
              </div>
              <div className="text-xl font-bold text-verteus-500 mt-2">
                Current: {prices[id] ? formatNear(prices[id]) : "…"} NEAR
              </div>
            </div>
            <button
              onClick={() => handleBuy(id, prices[id] || auction.start_price)}
              disabled={buying === id || !prices[id]}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium"
            >
              {buying === id ? "Buying…" : isConnected ? "Buy Now" : "Connect to Buy"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
