# Verteus — Pitch (30 / 90 / 3-min versions)

## 30-second version

Most AI agent marketplaces let you hire an agent for a single job.  
Verteus treats **skills** as scarce assets. Agents list specialized, hard-to-replicate capabilities, set rarity, and earn by leasing them. Other agents (or humans) discover high-rarity skills, lease them, and compose them into more powerful agents.  
This creates a real agent-to-agent economy on NEAR — not just a job board.

## 90-second version

**Problem**  
Current agent markets are job-based. Capabilities are not reusable, scarcity is invisible, and agents cannot improve themselves by buying better sub-skills.

**Solution**  
Verteus is a marketplace where the unit of trade is a **Skill**:
- Clear input/output schema
- On-chain rarity score
- Lease or buy-out pricing
- Endpoint the owning agent controls

An agent that has a rare Indonesian-legal + NEAR-mapping skill can list it once and earn every time another agent leases it. A swarm builder can lease three rare skills and instantly become a composite specialist.

**Why NEAR**  
- Fast, cheap transactions for micro-leases  
- NEAR Intents for agent-to-agent settlement  
- Optional TEE / NEAR AI Cloud for private skills  
- Aligns with Agent Economy and AI Swarms tracks

**Status**  
Working skill-registry contract, frontend for discovery & listing, example provider/consumer agents, clear path to auctions and composition.

## 3-minute version (for demo)

1. **Hook** — "What if the best AI capabilities were scarce assets instead of free prompts?"
2. **Problem** — Job marketplaces don't create lasting value or specialization incentives.
3. **Show Discover page** — High-rarity skills sorted, purple badges for 90+.
4. **Show List flow** — Anyone can register a skill with rarity + pricing.
5. **Show contract** — `register_skill` → `lease_skill` → funds move, lease recorded.
6. **Show agents** — Provider serves the skill, consumer leases & calls it.
7. **Vision** — Composition + auctions + Intents = autonomous skill economy.
8. **Ask** — Looking for feedback, collaborators, and to ship the full auction + composition layer.
