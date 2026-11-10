"use client";

import { useEffect, useState } from "react";
import { viewMethod, parseNear, CONTRACT_ID } from "@/lib/near";
import { useWallet } from "@/lib/wallet";

interface Skill {
  id: number;
  name: string;
  description: string;
  owner: string;
  tags: string[];
  rarity_score: number;
  usage_count: number;
  pricing: {
    lease_per_hour: string;
    lease_per_day: string;
    buy_out: string;
  };
  endpoint: string;
  active: boolean;
}

const MOCK_SKILLS: Skill[] = [
  {
    id: 1,
    name: "Indonesian Legal Clause Extractor",
    description:
      "Extracts and maps Indonesian legal clauses to NEAR smart-contract patterns. Trained on UU ITE, KUHP, and NEAR legal docs.",
    rarity_score: 92,
    tags: ["legal", "indonesia", "near"],
    pricing: {
      lease_per_hour: "1000000000000000000000000",
      lease_per_day: "20000000000000000000000000",
      buy_out: "0",
    },
    owner: "legal-agent.testnet",
    usage_count: 14,
    endpoint: "",
    active: true,
  },
  {
    id: 2,
    name: "On-chain Risk Scorer (TEE)",
    description:
      "Scores wallet / contract risk using private on-chain heuristics inside a TEE. Never exposes the model weights.",
    rarity_score: 88,
    tags: ["security", "tee", "risk"],
    pricing: {
      lease_per_hour: "1500000000000000000000000",
      lease_per_day: "30000000000000000000000000",
      buy_out: "0",
    },
    owner: "risk.near",
    usage_count: 31,
    endpoint: "",
    active: true,
  },
  {
    id: 3,
    name: "Cultural Context Translator (ID ↔ EN)",
    description:
      "Translates with deep Indonesian cultural & regional slang context. Far beyond generic LLM translation.",
    rarity_score: 79,
    tags: ["translation", "culture", "indonesia"],
    pricing: {
      lease_per_hour: "500000000000000000000000",
      lease_per_day: "10000000000000000000000000",
      buy_out: "0",
    },
    owner: "bahasa-agent.testnet",
    usage_count: 67,
    endpoint: "",
    active: true,
  },
  {
    id: 4,
    name: "NEAR Intent Strategy Composer",
    description:
      "Composes multi-step NEAR Intent strategies for complex cross-chain outcomes. Continuous learning from successful intents.",
    rarity_score: 95,
    tags: ["intents", "defi", "strategy"],
    pricing: {
      lease_per_hour: "2000000000000000000000000",
      lease_per_day: "40000000000000000000000000",
      buy_out: "0",
    },
    owner: "intent-master.near",
    usage_count: 8,
    endpoint: "",
    active: true,
  },
];

function formatNear(yocto: string) {
  const n = BigInt(yocto || "0");
  const near = Number(n) / 1e24;
  return near < 0.01 ? near.toExponential(2) : near.toFixed(2);
}

function RarityBadge({ score }: { score: number }) {
  const color =
    score >= 90
      ? "bg-purple-600 text-purple-100"
      : score >= 80
      ? "bg-blue-600 text-blue-100"
      : "bg-gray-600 text-gray-100";
  return (
    <span className={`text-xs font-bold px-2 py-1 rounded-full ${color}`}>
      Rarity {score}
    </span>
  );
}

export default function DiscoverPage() {
  const [minRarity, setMinRarity] = useState(0);
  const [skills, setSkills] = useState<Skill[]>(MOCK_SKILLS);
  const [loading, setLoading] = useState(false);
  const [leasing, setLeasing] = useState<number | null>(null);
  const { isConnected, connect, callMethod } = useWallet();

  useEffect(() => {
    if (!CONTRACT_ID) return;
    setLoading(true);
    viewMethod("get_skills_by_rarity", { min_rarity: 0, limit: 50 })
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setSkills(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = skills
    .filter((s) => s.rarity_score >= minRarity && s.active)
    .sort((a, b) => b.rarity_score - a.rarity_score);

  const handleLease = async (skill: Skill) => {
    if (!isConnected) {
      connect();
      return;
    }
    setLeasing(skill.id);
    try {
      // Lease for 24 hours = 1 day price
      const deposit = skill.pricing.lease_per_day;
      await callMethod("lease_skill", { skill_id: skill.id, hours: 24 }, deposit);
      alert(`Leased skill #${skill.id} for 24h!`);
    } catch (e: any) {
      alert(e?.message || "Lease failed");
    } finally {
      setLeasing(null);
    }
  };

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-3">
          Discover <span className="text-verteus-500">Rare Skills</span>
        </h1>
        <p className="text-gray-400 max-w-2xl">
          Lease specialized AI capabilities that are hard to replicate. Agents and humans can buy
          scarce expertise and compose it into new agents.
        </p>
        {!CONTRACT_ID && (
          <p className="mt-3 text-xs text-amber-500">
            Demo mode — set NEXT_PUBLIC_CONTRACT_ID to load live skills from the contract.
          </p>
        )}
      </div>

      <div className="flex gap-4 mb-8 items-center">
        <label className="text-sm text-gray-400">Min rarity:</label>
        <input
          type="range"
          min={0}
          max={100}
          value={minRarity}
          onChange={(e) => setMinRarity(Number(e.target.value))}
          className="w-40"
        />
        <span className="text-sm font-mono">{minRarity}</span>
        {loading && <span className="text-xs text-gray-500">Loading…</span>}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {filtered.map((skill) => (
          <div
            key={skill.id}
            className="border border-gray-800 rounded-xl p-6 hover:border-verteus-600 transition-colors bg-gray-900/50"
          >
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-xl font-semibold">{skill.name}</h2>
              <RarityBadge score={skill.rarity_score} />
            </div>
            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{skill.description}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {skill.tags.map((t) => (
                <span key={t} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
                  {t}
                </span>
              ))}
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="text-gray-500">
                by <span className="text-gray-300">{skill.owner}</span> · {skill.usage_count} leases
              </div>
              <div className="font-medium text-verteus-500">
                {formatNear(skill.pricing.lease_per_day)} NEAR/day
              </div>
            </div>
            <button
              onClick={() => handleLease(skill)}
              disabled={leasing === skill.id}
              className="mt-4 w-full bg-verteus-600 hover:bg-verteus-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition"
            >
              {leasing === skill.id
                ? "Leasing…"
                : isConnected
                ? "Lease 24h"
                : "Connect to Lease"}
            </button>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-500 py-20">No skills match this rarity filter.</p>
      )}
    </div>
  );
}
