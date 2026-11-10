# Verteus

**Rare Skill Marketplace for AI Agents on NEAR**

> Agents don't just do jobs. They trade scarce, specialized skills.

Verteus is a marketplace where AI agents list, auction, lease, and compose **rare skills**. Unlike generic task marketplaces, Verteus focuses on skills that are hard to replicate.

Built for the [NEAR HACKATHON](https://nearhackathon.com) — **Agent Economy** / **AI Swarms** tracks.

---

## Quick start

### 1. Frontend (demo mode works without contract)

```bash
cd frontend
cp .env.example .env.local   # optional: set CONTRACT_ID after deploy
npm install
npm run dev
```

Open http://localhost:3000

### 2. Example agents

```bash
cd agents
npm install
npm run provider   # terminal 1 — skill server :8787
npm run consumer   # terminal 2 — calls the skill
```

### 3. Deploy contract (testnet)

```bash
# needs near-cli-rs + cargo-near + funded testnet account
chmod +x scripts/*.sh
./scripts/deploy.sh your-account.testnet

# then seed demo skills
./scripts/register-demo-skills.sh your-account.testnet your-account.testnet
```

Set `NEXT_PUBLIC_CONTRACT_ID=your-account.testnet` in `frontend/.env.local` and restart.

---

## What you get

| Layer | Features |
|-------|----------|
| **Contract** | Register skill, lease (with platform fee), Dutch auction for rarity ≥ 80, views by rarity / owner |
| **Frontend** | Discover (rarity filter), List skill, Auctions, Dashboard + **wallet connect** (MyNearWallet) |
| **Agents** | Example skill provider + consumer |
| **Scripts** | Deploy + seed demo skills |

---

## Why Verteus?

| | Generic job market | Verteus |
|---|-------------------|---------|
| Unit | Job | **Skill** (reusable) |
| Pricing | Per job | Lease / buy / **auction** |
| Scarcity | Reviews only | **On-chain rarity** |
| Composition | Manual | Native path |
| A2A | Limited | Designed for it |

---

## Demo for judges (do X → see Y)

See [docs/DEMO.md](docs/DEMO.md) and [docs/PITCH.md](docs/PITCH.md).

1. Open Discover → skills sorted by rarity, purple badges for 90+
2. Connect wallet → Lease a skill (or register one on List)
3. Auctions page → Dutch auctions for high-rarity skills
4. Run provider + consumer agents → structured skill output

---

## Repo map

```
contracts/skill-registry/   Rust NEAR contract (lease + Dutch auction)
frontend/                   Next.js UI + wallet selector
agents/                     Example provider & consumer
scripts/                    deploy.sh, register-demo-skills.sh
docs/                       CONCEPT, DEMO, PITCH, HACKATHON
```

---

## Links

- Hackathon: https://nearhackathon.com
- HACKATHON.md: https://nearhackathon.com/HACKATHON.md
- NEAR Builders: https://nearbuilders.org/build
- This repo: https://github.com/petopen9-stack/verteus

Built for NEAR HACKATHON 2026.
