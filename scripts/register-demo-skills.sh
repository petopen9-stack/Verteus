#!/usr/bin/env bash
set -euo pipefail

# Register a few demo skills on testnet
# Usage: ./scripts/register-demo-skills.sh <contract-account.testnet> <signer-account.testnet>

CONTRACT=${1:-}
SIGNER=${2:-}

if [ -z "$CONTRACT" ] || [ -z "$SIGNER" ]; then
  echo "Usage: ./scripts/register-demo-skills.sh <contract> <signer>"
  exit 1
fi

NETWORK=testnet

register() {
  local name=$1
  local desc=$2
  local tags=$3
  local rarity=$4
  local hour=$5
  local day=$6
  local endpoint=$7

  near contract call-function as-transaction "$CONTRACT" register_skill \
    json-args "{
      \"name\": \"$name\",
      \"description\": \"$desc\",
      \"tags\": $tags,
      \"input_schema\": \"{\\\"type\\\":\\\"object\\\"}\",
      \"output_schema\": \"{\\\"type\\\":\\\"object\\\"}\",
      \"pricing\": {
        \"lease_per_hour\": \"$hour\",
        \"lease_per_day\": \"$day\",
        \"buy_out\": \"0\"
      },
      \"rarity_score\": $rarity,
      \"endpoint\": \"$endpoint\"
    }" \
    prepaid-gas '30.0 Tgas' \
    attached-deposit '0 NEAR' \
    network-config "$NETWORK" \
    sign-as "$SIGNER" \
    sign-with-keychain \
    send
}

echo "Registering demo skills..."

# 1 NEAR = 10^24 yocto
register \
  "Indonesian Legal Clause Extractor" \
  "Extracts and maps Indonesian legal clauses to NEAR smart contract patterns" \
  '["legal","indonesia","near"]' \
  92 \
  "1000000000000000000000000" \
  "20000000000000000000000000" \
  "http://localhost:8787/skill"

register \
  "On-chain Risk Scorer (TEE)" \
  "Scores wallet and contract risk using private heuristics inside a TEE" \
  '["security","tee","risk"]' \
  88 \
  "1500000000000000000000000" \
  "30000000000000000000000000" \
  "https://risk-agent.example.com/skill"

register \
  "Cultural Context Translator ID-EN" \
  "Translates with deep Indonesian cultural and regional slang context" \
  '["translation","culture","indonesia"]' \
  79 \
  "500000000000000000000000" \
  "10000000000000000000000000" \
  "https://bahasa-agent.example.com/skill"

register \
  "NEAR Intent Strategy Composer" \
  "Composes multi-step NEAR Intent strategies for complex cross-chain outcomes" \
  '["intents","defi","strategy"]' \
  95 \
  "2000000000000000000000000" \
  "40000000000000000000000000" \
  "https://intent-master.example.com/skill"

echo "Done."
