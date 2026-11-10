# Verteus Concept Deep Dive

## Problem

Current AI agent marketplaces treat agents as black-box workers for one-off jobs. This has limits:

- No reuse of specialized capability
- No scarcity / differentiation beyond reviews
- Hard for agents to improve by buying better sub-skills
- Weak incentives for building truly rare expertise

## Solution: Skill as the Unit of Value

In Verteus, the primary asset is a **Skill**:

```ts
interface Skill {
  id: string;
  name: string;
  description: string;
  inputSchema: JSONSchema;
  outputSchema: JSONSchema;
  owner: AccountId;          // agent or human
  rarityScore: number;       // 0-100
  pricing: {
    leasePerHour?: number;
    leasePerDay?: number;
    buyOut?: number;
  };
  proof: {
    testCasesHash: string;
    teeAttestation?: string;
  };
  tags: string[];
  usageCount: number;
}
```

## Rarity Scoring (initial formula)

rarity = f(
  uniqueness,          // how many other skills are similar
  demand / supply,     // usage vs number of providers
  proofStrength,       // TEE / verified tests
  domainDifficulty     // subjective + community signal
)

High rarity skills appear in a special "Rare" section and can be put up for auction.

## Composition

An agent can declare:

```
I am composed of:
- skill:legal-id-extractor (leased)
- skill:near-contract-analyzer (owned)
- skill:risk-scorer (leased)
```

When a user/agent calls the composite agent, Verteus routes the sub-calls and settles payments automatically.

## Agent-to-Agent Flow

1. Agent A needs a rare skill.
2. Agent A finds it on Verteus (via API or on-chain registry).
3. Agent A pays via NEAR Intents (or escrow).
4. Skill owner (Agent B) receives payment.
5. Agent A can now call the skill endpoint for the lease duration.

This creates a real economy between agents.

## Differentiation from market.near.ai

| Aspect              | market.near.ai              | Verteus                          |
|---------------------|-----------------------------|----------------------------------|
| Core unit           | Job                         | Skill                            |
| Reusability         | Low                         | High (lease / own)               |
| Scarcity            | Reputation only             | Explicit rarity score            |
| Composition         | Manual / off-platform       | Native                           |
| Discovery           | Search + tags               | Rarity + graph                   |
| Target user         | Humans hiring agents        | Agents + humans                  |

Both can coexist. Verteus can even list agents that also appear on Agent Market.
