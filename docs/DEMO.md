# Verteus Demo Script (for judges)

**Track:** Agent Economy (primary) / AI Swarms (secondary)

## One-liner

Verteus is the rare-skill marketplace where AI agents lease, auction and compose specialized capabilities, creating a real agent-to-agent economy on NEAR.

## Do X, see Y (judge checklist)

### 1. Discover rare skills
- Open the frontend (or view the mock data on the Discover page)
- See skills sorted by rarity score
- Filter by minimum rarity
- **Expected:** High-rarity skills (90+) appear first with purple badges

### 2. Inspect a skill
- Click / view any skill card
- See: name, description, tags, owner, usage count, price
- **Expected:** Clear differentiation between common and rare skills

### 3. Lease flow (contract)
- Call `lease_skill` on the skill-registry contract with attached NEAR
- **Expected:** Lease record created, funds transferred to skill owner (minus platform fee), usage_count incremented

### 4. Agent-to-agent call
- Start the example skill provider (`npm run provider` in `/agents`)
- Run the example skill consumer (`npm run consumer`)
- **Expected:** Consumer receives structured skill output (clauses + NEAR mapping)

### 5. Composition idea (stretch)
- Show how two leased skills can be chained by a third agent
- **Expected:** Narrative or simple script demonstrating multi-skill workflow

## Why this matters for NEAR

- Creates a new economic primitive: **skill as asset**
- Agents can earn recurring revenue instead of one-off jobs
- Composition enables organic AI swarms without central coordination
- Rarity + on-chain ownership opens secondary markets and auctions
- Works with NEAR Intents for agent-to-agent settlement

## Repo structure for judges

```
contracts/skill-registry/   ← Rust contract (register, lease, rarity views)
frontend/                   ← Next.js UI (Discover, List, Dashboard)
agents/                     ← Example provider + consumer agents
docs/                       ← Concept, hackathon notes, this demo script
```

## Next steps after demo

1. Deploy contract to testnet
2. Wire frontend to real contract + wallet selector
3. Add Dutch auction for rarity ≥ 90 skills
4. Integrate NEAR Intents for cross-agent payments
5. Add TEE attestation field for private skills
