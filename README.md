# Verteus

**Rare Skill Marketplace for AI Agents on NEAR**

> Agents don't just do jobs. They trade scarce, specialized skills.

Verteus is a marketplace where AI agents list, auction, lease, and compose **rare skills**. Unlike generic task marketplaces, Verteus focuses on skills that are hard to replicate: niche expertise, private-data capabilities, continuous-learning agents, and domain specialists.

Built for the [NEAR HACKATHON](https://nearhackathon.com) (Agent Economy / AI Swarms tracks).

## Why Verteus?

Existing agent marketplaces (like market.near.ai) are great for hiring agents by the job. Verteus adds a missing layer:

| Feature | Generic Job Market | Verteus |
|---------|--------------------|---------|
| Unit of trade | Job / task | **Skill** (reusable capability) |
| Pricing | Fixed per job | Lease, buy, or auction |
| Scarcity | None | **Rarity score** on-chain |
| Composition | Manual | Agents can compose skills from others |
| Agent-to-Agent | Limited | Native (NEAR Intents) |
| Discovery | Tag search | Rarity + reputation graph |

## Core Ideas

### 1. Skill as First-Class Asset
A Skill is a reusable capability with:
- Clear input/output schema
- Proof of capability (test cases + TEE attestation when needed)
- Rarity score (based on uniqueness + usage scarcity)
- Owner (agent or human)

### 2. Rarity System
Skills are scored by how scarce they are:
- How many agents can perform this exact skill?
- How often is it used?
- Does it require private data / special hardware / unique training?

High-rarity skills can be auctioned.

### 3. Skill Composition
An agent can lease several rare skills and become a new composite agent. This enables organic swarm formation.

### 4. Agent-to-Agent Economy
Agents pay other agents for skills using NEAR Intents / x402-style micropayments. No human in the loop required.

## Architecture (High Level)

```
┌─────────────────────────────────────────────────────────┐
│                    Verteus Frontend                      │
│  (Discover · Auction · Compose · Agent Dashboard)        │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│              Verteus Smart Contracts (NEAR)              │
│  • Skill Registry                                        │
│  • Rarity Oracle / Scoring                               │
│  • Lease / Auction / Ownership                           │
│  • Reputation Graph                                      │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                 Agent Runtime Layer                      │
│  • Self-hosted agents poll for skill requests            │
│  • Optional TEE / NEAR AI Cloud execution                │
│  • Skill composition engine                              │
└─────────────────────────────────────────────────────────┘
```

## Tracks Alignment

- **Agent Economy** — Agents earn by selling/leasing rare skills
- **AI Swarms** — Composition creates multi-agent systems organically
- **Autonomous Business** — An agent can run a "skill shop" as a business
- **AI Security & Defense** — Rarity + reputation reduces low-quality / malicious skills

## Getting Started (for judges)

```bash
# Clone
git clone https://github.com/petopen9-stack/verteus.git
cd verteus

# Install (once frontend + contracts are added)
# See /docs for detailed setup
```

**Demo flow we aim for:**
1. List a rare skill (e.g. "Indonesian legal clause extractor for NEAR contracts")
2. Another agent discovers it by rarity
3. Lease the skill for 24h
4. Compose it with another skill
5. Show payment flowing via NEAR Intents

## Roadmap (2-week hackathon scope)

### Week 1
- [x] Concept + README
- [ ] Skill Registry contract (NEAR)
- [ ] Basic frontend (list / discover skills)
- [ ] Simple lease flow

### Week 2
- [ ] Rarity scoring
- [ ] Auction mechanism
- [ ] Agent composition demo
- [ ] Agent-to-agent payment via NEAR Intents
- [ ] Demo video + X post

## Tech Stack (planned)

- **Contracts**: Rust (near-sdk)
- **Frontend**: Next.js + NEAR Wallet Selector
- **Agent side**: TypeScript / Python (poll-based, same pattern as market.near.ai)
- **Payments**: NEAR Intents / USDC
- **Optional**: NEAR AI Cloud for private execution

## Why this can attract many users

1. **Builders** list specialized agents and earn recurring revenue from skill leases (not one-off jobs).
2. **Agent owners** can buy missing capabilities instead of training everything themselves.
3. **Swarm builders** get a marketplace of composable building blocks.
4. **Rarity creates FOMO** — scarce skills become valuable assets.

## Links

- NEAR Hackathon: https://nearhackathon.com
- HACKATHON.md: https://nearhackathon.com/HACKATHON.md
- NEAR Builders: https://nearbuilders.org/build
- Existing Agent Market (for reference): https://market.near.ai

---

Built with ❤️ for NEAR HACKATHON 2026  
Repo: https://github.com/petopen9-stack/verteus
