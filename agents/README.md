# Verteus agents: CLI & MCP

A dependency-light TypeScript CLI and MCP stdio server for querying the Verteus NEAR skill registry. Uses Node's built-in `fetch`; the only runtime tooling is the repository's existing `tsx` package. All chain queries use NEAR read-only `call_function` RPC requests. `prepare_lease` only obtains a quote and prepares wallet-call details; it **never signs or submits transactions**.

## Requirements and configuration

Run from `agents/` after installing its existing development dependencies (`npm install`). Environment:

- `VERTEUS_NETWORK`: `testnet` (default) or `mainnet`.
- `VERTEUS_CONTRACT_ID`: deployed contract account; defaults to `verteus.testnet` (override this if your contract has another ID).

Examples:

```sh
cd agents
VERTEUS_CONTRACT_ID=skill-registry.testnet npm run cli -- search_skills 80 10
npm run cli -- get_skill 1
npm run cli -- list_active_auctions 10
npm run cli -- get_auction_price 2
npm run cli -- has_valid_lease 1 alice.testnet
npm run cli -- prepare_lease 1 4
```

The CLI prints formatted JSON. IDs must be unsigned decimal integers (no exponent, signs or decimals); account IDs are checked before RPC use. Skill rarity is 0–100; result limits are 1–100; lease duration is 1–720 hours. Invalid command syntax/configuration and RPC errors are reported to stderr with a non-zero exit status.

## MCP stdio server

Start `npm run mcp` from `agents/` or invoke `npx tsx /absolute/path/to/Verteus/agents/mcp.ts`. The server reads one JSON-RPC message per stdin line and writes protocol messages to stdout; diagnostics must not be written to stdout. It supports `initialize`, `notifications/initialized`, `ping`, `tools/list`, and `tools/call`.

Configure your MCP client with an absolute path to the checkout. Example configurations follow; replace `/absolute/path/to/Verteus` with the actual repository path and set your deployed contract ID:

**Claude Desktop** (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "verteus": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/Verteus/agents/mcp.ts"],
      "cwd": "/absolute/path/to/Verteus/agents",
      "env": { "VERTEUS_NETWORK": "testnet", "VERTEUS_CONTRACT_ID": "skill-registry.testnet" }
    }
  }
}
```

**Codex** (MCP config, e.g. `~/.codex/config.toml`):

```toml
[mcp_servers.verteus]
command = "npx"
args = ["tsx", "/absolute/path/to/Verteus/agents/mcp.ts"]
cwd = "/absolute/path/to/Verteus/agents"

[mcp_servers.verteus.env]
VERTEUS_NETWORK = "testnet"
VERTEUS_CONTRACT_ID = "skill-registry.testnet"
```

**Other MCP Desktop clients**: add a stdio server with command `npx`, arguments `tsx` and `/absolute/path/to/Verteus/agents/mcp.ts`, working directory `/absolute/path/to/Verteus/agents`, and the two environment variables above. Ensure `npx`/Node is available in the client's process environment.

## Tools

- `search_skills(min_rarity, limit)` — maps to `get_skills_by_rarity`.
- `get_skill(skill_id)` — maps to `get_skill`.
- `list_active_auctions(limit)` — maps to `get_active_auctions`.
- `get_auction_price(auction_id)` — maps to `get_auction_price`.
- `has_valid_lease(skill_id, account)` — maps to `has_valid_lease`.
- `prepare_lease(skill_id, hours)` — calls `quote_lease_cost(skill_id, hours)`, returns the `lease_skill` method/arguments, attached deposit in yoctoNEAR, and instructions for manually reviewing and signing in a wallet.

## Safety and limitations

The server has no wallet integration, private-key access, signing, or transaction-submission path. Even `prepare_lease` returns only transaction arguments and the quoted yoctoNEAR deposit; inspect these in a trusted wallet before manually submitting. It does not recommend or execute auction purchases. Read-only tools return current/finalized RPC view data and depend on the configured public NEAR RPC endpoint.

`prepare_lease` requires the deployed contract to implement `quote_lease_cost(skill_id, hours)`. This repository version provides that view. A deployment running an older contract may not support quoting and must be replaced or migrated before using this tool; the MCP server reports the failure and sends no transaction. The quote is not a guarantee that a later transaction will succeed or that state/price will remain unchanged. Always verify contract ID, network, arguments and deposit before signing.
