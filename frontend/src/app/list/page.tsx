"use client";

import { useState } from "react";
import { useWallet } from "@/lib/wallet";
import { parseNear, CONTRACT_ID } from "@/lib/near";

const REGISTRATION_STORAGE_BUFFER = "1000000000000000000000000";

export default function ListSkillPage() {
  const { isConnected, connect, callMethod } = useWallet();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    tags: "",
    rarity: 70,
    pricePerHour: "0.1",
    pricePerDay: "1.0",
    endpoint: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      connect();
      return;
    }
    if (!CONTRACT_ID) {
      alert("Contract not configured. Set NEXT_PUBLIC_CONTRACT_ID.");
      return;
    }

    setSubmitting(true);
    try {
      const tags = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await callMethod("register_skill", {
        name: form.name,
        description: form.description,
        tags,
        input_schema: JSON.stringify({ type: "object" }),
        output_schema: JSON.stringify({ type: "object" }),
        pricing: {
          lease_per_hour: parseNear(form.pricePerHour),
          lease_per_day: parseNear(form.pricePerDay),
          buy_out: "0",
        },
        rarity_score: form.rarity,
        endpoint: form.endpoint,
      }, REGISTRATION_STORAGE_BUFFER);

      alert(`Skill "${form.name}" registered on-chain!`);
      setForm({
        name: "",
        description: "",
        tags: "",
        rarity: 70,
        pricePerHour: "0.1",
        pricePerDay: "1.0",
        endpoint: "",
      });
    } catch (err: any) {
      alert(err?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-bold mb-2">List a Rare Skill</h1>
      <p className="text-gray-400 mb-8">
        Make your specialized capability available for other agents (and humans) to lease.
      </p>
      <p className="text-xs text-gray-500 mb-6">
        Registration attaches a 1 NEAR storage buffer. The contract retains the actual storage cost and refunds any excess.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Skill name</label>
          <input
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-verteus-500"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Indonesian Legal Clause Extractor"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Description</label>
          <textarea
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 h-28 focus:outline-none focus:border-verteus-500"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What makes this skill rare and valuable?"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Tags (comma separated)</label>
          <input
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-verteus-500"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="legal, indonesia, near"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Rarity score: <span className="text-white font-mono">{form.rarity}</span>
          </label>
          <input
            type="range"
            min={1}
            max={100}
            value={form.rarity}
            onChange={(e) => setForm({ ...form, rarity: Number(e.target.value) })}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Owner-provided score; it is not independently verified. Auctions are available for scores ≥ 80.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Price / hour (NEAR)</label>
            <input
              type="number"
              step="0.01"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2"
              value={form.pricePerHour}
              onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Price / day (NEAR)</label>
            <input
              type="number"
              step="0.01"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2"
              value={form.pricePerDay}
              onChange={(e) => setForm({ ...form, pricePerDay: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Agent endpoint URL</label>
          <input
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-verteus-500"
            value={form.endpoint}
            onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
            placeholder="https://your-agent.example.com/skill"
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-verteus-600 hover:bg-verteus-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition"
        >
          {submitting
            ? "Registering…"
            : isConnected
            ? "Register Skill on NEAR"
            : "Connect Wallet to Register"}
        </button>
      </form>
    </div>
  );
}
