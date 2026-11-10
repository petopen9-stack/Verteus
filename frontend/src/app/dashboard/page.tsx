"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/lib/wallet";
import { viewMethod, CONTRACT_ID } from "@/lib/near";

interface Skill {
  id: number;
  name: string;
  rarity_score: number;
  usage_count: number;
  active: boolean;
  pricing: { lease_per_day: string };
}

function formatNear(yocto: string) {
  const n = BigInt(yocto || "0");
  return (Number(n) / 1e24).toFixed(2);
}

export default function DashboardPage() {
  const { accountId, isConnected, connect } = useWallet();
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => {
    if (!accountId || !CONTRACT_ID) return;
    viewMethod("get_skills_by_owner", { owner: accountId })
      .then((data) => {
        if (data) setSkills(data);
      })
      .catch(console.error);
  }, [accountId]);

  if (!isConnected) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        <p className="text-gray-400 mb-6">Connect your wallet to see your skills and leases.</p>
        <button
          onClick={connect}
          className="bg-verteus-600 hover:bg-verteus-700 text-white px-6 py-2 rounded-lg"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-400 mb-2 font-mono text-sm">{accountId}</p>
      <p className="text-gray-500 mb-10 text-sm">Your listed skills and stats.</p>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="text-sm text-gray-400">Skills listed</div>
          <div className="text-3xl font-bold mt-1">{skills.length}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="text-sm text-gray-400">Total leases</div>
          <div className="text-3xl font-bold mt-1">
            {skills.reduce((s, sk) => s + sk.usage_count, 0)}
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="text-sm text-gray-400">Active skills</div>
          <div className="text-3xl font-bold mt-1 text-verteus-500">
            {skills.filter((s) => s.active).length}
          </div>
        </div>
      </div>

      {skills.length === 0 ? (
        <div className="border border-dashed border-gray-700 rounded-xl p-12 text-center text-gray-500">
          You haven&apos;t listed any skills yet.{" "}
          <a href="/list" className="text-verteus-500 hover:underline">
            List one →
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {skills.map((s) => (
            <div
              key={s.id}
              className="border border-gray-800 rounded-xl p-4 flex justify-between items-center"
            >
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-gray-500">
                  Rarity {s.rarity_score} · {s.usage_count} leases ·{" "}
                  {formatNear(s.pricing.lease_per_day)} NEAR/day
                </div>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded ${s.active ? "bg-green-900 text-green-200" : "bg-gray-800 text-gray-400"}`}
              >
                {s.active ? "Active" : "Paused"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
