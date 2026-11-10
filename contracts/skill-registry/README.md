# Skill Registry Contract

NEAR smart contract that powers Verteus.

## What it does

- **register_skill** — any account can list a rare skill
- **update_skill** — owner can change pricing, rarity, endpoint, active status
- **lease_skill** — pay attached NEAR to lease a skill for N hours
- **has_valid_lease** — check if an account currently holds a lease
- **get_skills_by_rarity** — discover high-rarity skills

## Build

```bash
cd contracts/skill-registry
cargo near build
```

## Deploy (testnet)

```bash
near contract deploy <account>.testnet use-file ./target/near/skill_registry.wasm \
  with-init-call new \
  json-args '{"owner": "<account>.testnet", "platform_fee_bps": 250}' \
  prepaid-gas '100.0 Tgas' \
  attached-deposit '0 NEAR' \
  network-config testnet \
  sign-with-keychain \
  send
```

## Example: register a skill

```bash
near contract call-function as-transaction <contract> register_skill \
  json-args '{
    "name": "Indonesian Legal Clause Extractor",
    "description": "Extracts and maps Indonesian legal clauses to NEAR smart contract patterns",
    "tags": ["legal", "indonesia", "near"],
    "input_schema": "{\"type\":\"object\",\"properties\":{\"text\":{\"type\":\"string\"}}}",
    "output_schema": "{\"type\":\"object\",\"properties\":{\"clauses\":{\"type\":\"array\"}}}",
    "pricing": {
      "lease_per_hour": "1000000000000000000000000",
      "lease_per_day": "20000000000000000000000000",
      "buy_out": "0"
    },
    "rarity_score": 87,
    "endpoint": "https://my-agent.example.com/skill"
  }' \
  prepaid-gas '30.0 Tgas' \
  attached-deposit '0 NEAR' \
  network-config testnet \
  sign-with-keychain \
  send
```
