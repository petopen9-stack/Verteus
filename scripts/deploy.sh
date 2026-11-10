#!/usr/bin/env bash
set -euo pipefail

# Verteus deploy script (testnet)
# Usage:
#   ./scripts/deploy.sh <your-account.testnet>

ACCOUNT=${1:-}
if [ -z "$ACCOUNT" ]; then
  echo "Usage: ./scripts/deploy.sh <account.testnet>"
  exit 1
fi

CONTRACT_DIR="contracts/skill-registry"
NETWORK="testnet"

echo "==> Building contract..."
cd "$CONTRACT_DIR"
cargo near build

WASM="./target/near/skill_registry.wasm"
if [ ! -f "$WASM" ]; then
  # fallback path used by some cargo-near versions
  WASM="./target/wasm32-unknown-unknown/release/skill_registry.wasm"
fi

if [ ! -f "$WASM" ]; then
  echo "WASM not found. Check build output."
  exit 1
fi

echo "==> Deploying to $ACCOUNT on $NETWORK..."
near contract deploy "$ACCOUNT" use-file "$WASM" \
  with-init-call new \
  json-args "{\"owner\": \"$ACCOUNT\", \"platform_fee_bps\": 250}" \
  prepaid-gas '100.0 Tgas' \
  attached-deposit '0 NEAR' \
  network-config "$NETWORK" \
  sign-with-keychain \
  send

echo ""
echo "Deployed. Contract account: $ACCOUNT"
echo "Set NEXT_PUBLIC_CONTRACT_ID=$ACCOUNT in frontend/.env.local"
