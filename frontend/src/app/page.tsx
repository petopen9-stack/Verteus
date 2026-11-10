"use client";

import { useState } from "react";

// Mock data for demo (will be replaced by contract calls)
const MOCK_SKILLS = [
  {
    id: 1,
    name: "Indonesian Legal Clause Extractor",
    description: "Extracts and maps Indonesian legal clauses to NEAR smart-contract patterns. Trained on UU ITE, KUHP, and NEAR legal docs.",
    rarity: 92,
    tags: ["legal", "indonesia", "near"],
    pricePerDay: "0.5 NEAR",
    owner: "legal-agent.testnet",
    usage: 14,
  },
  {
    id: 2,
    name: "On-chain Risk Scorer (TEE)",
    description: "Scores wallet / contract risk using private on-chain heuristics inside a TEE. Never exposes the model weights.",
    rarity: 88,
    tags: ["security", "tee", "risk"],
    pricePerDay: "1.2 NEAR",
    owner: "risk.near",
    usage: 31,
  },
  {
    id: 3,
    name: "Cultural Context Translator (ID ↔ EN)",
    description: "Translates with deep Indonesian cultural & regional slang context. Far beyond generic LLM translation.",
    rarity: 79,
    tags: ["translation", "culture", "indonesia"],
    pricePerDay: "0.3 NEAR",
    owner: "bahasa-agent.testnet",
    usage: 67,
  },
  {
    id: 4,
    name: "NEAR Intent Strategy Composer",
    description: "Composes multi-step NEAR Intent strategies for complex cross-chain outcomes. Continuous learning from successful intents.",
    rarity: 95,
    tags: ["intents", "defi", "strategy"],
    pricePerDay: "2.0 NEAR",
    owner: "intent-master.near",
    usage: 8,
  },
];

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

  const filtered = MOCK_SKILLS.filter((s) => s.rarity >= minRarity).sort(
    (a, b) => b.rarity - a.rarity
  );

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-3">
          Discover <span className="text-verteus-500">Rare Skills</span>
        </h1>
        <p className="text-gray-400 max-w-2xl">
          Lease specialized AI capabilities that are hard to replicate.
          Agents and humans can buy scarce expertise and compose it into new agents.
        </p>
      </div>

      {/* Filters */}
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
      </div>

      {/* Skill grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {filtered.map((skill) => (
          <div
            key={skill.id}
            className="border border-gray-800 rounded-xl p-6 hover:border-verteus-600 transition-colors bg-gray-900/50"
          >
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-xl font-semibold">{skill.name}</h2>
              <RarityBadge score={skill.rarity} />
            </div>
            <p className="text-gray-400 text-sm mb-4 line-clamp-2">
              {skill.description}
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {skill.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="text-gray-500">
                by <span className="text-gray-300">{skill.owner}</span> · {skill.usage} leases
              </div>
              <div className="font-medium text-verteus-500">{skill.pricePerDay}/day</div>
            </div>
            <button className="mt-4 w-full bg-verteus-600 hover:bg-verteus-700 text-white py-2 rounded-lg text-sm font-medium transition">
              Lease Skill
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
