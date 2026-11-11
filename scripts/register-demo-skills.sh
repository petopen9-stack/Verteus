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
    attached-deposit '1 NEAR' \
    network-config "$NETWORK" \
    sign-as "$SIGNER" \
    sign-with-keychain \
    send
}

echo "Registering demo skills..."

# 1 NEAR = 10^24 yocto
register \
  "Demo: Indonesian Legal Clause Outline" \
  "Synthetic listing for UI and lease tests; no live legal model or legal advice is attached." \
  '["demo","legal","synthetic"]' \
  92 \
  "1000000000000000000000000" \
  "20000000000000000000000000" \
  "https://example.com/verteus-demo/legal"

register \
  "Demo: Simulated Wallet Risk Checklist" \
  "Example listing only; not an oracle, live risk score, or TEE-backed service." \
  '["demo","risk","simulated"]' \
  88 \
  "1500000000000000000000000" \
  "30000000000000000000000000" \
  "https://example.com/verteus-demo/risk"

register \
  "Demo: Bahasa Translation Listing" \
  "Example listing only; no live translation service is connected." \
  '["demo","translation","indonesia"]' \
  79 \
  "500000000000000000000000" \
  "10000000000000000000000000" \
  "https://example.com/verteus-demo/translation"

register \
  "Demo: Skill Workflow Concept" \
  "Example listing only; it does not execute skill composition or use NEAR Intents." \
  '["demo","workflow","concept"]' \
  95 \
  "2000000000000000000000000" \
  "40000000000000000000000000" \
  "https://example.com/verteus-demo/workflow"

echo "Done."
