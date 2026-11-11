import { Buffer } from "node:buffer";

const MAX_LIMIT = 100;
const DEFAULT_CONTRACT = "verteus.testnet";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

function contractConfig() {
  const network = process.env.VERTEUS_NETWORK || "testnet";
  if (network !== "testnet" && network !== "mainnet") throw new Error("VERTEUS_NETWORK must be 'testnet' or 'mainnet'.");
  const contractId = process.env.VERTEUS_CONTRACT_ID || DEFAULT_CONTRACT;
  if (!isAccountId(contractId)) throw new Error("VERTEUS_CONTRACT_ID must be a valid NEAR account ID.");
  return { network, contractId, rpc: `https://rpc.${network}.near.org` };
}
function isAccountId(value: unknown): value is string {
  return typeof value === "string" && value.length >= 2 && value.length <= 64 && /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(value);
}
function uint(value: unknown, label: string, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  if (!(typeof value === "number" && Number.isSafeInteger(value)) && !(typeof value === "string" && /^(0|[1-9][0-9]*)$/.test(value))) throw new Error(`${label} must be an unsigned integer.`);
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < min || n > max) throw new Error(`${label} must be between ${min} and ${max}.`);
  return n;
}
function objectArgs(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Arguments must be a JSON object.");
  return input as Record<string, unknown>;
}
function exactKeys(args: Record<string, unknown>, expected: string[]) {
  const extra = Object.keys(args).filter((k) => !expected.includes(k));
  const missing = expected.filter((k) => !(k in args));
  if (extra.length || missing.length) throw new Error(`Expected exactly: ${expected.join(", ")}.${extra.length ? ` Unexpected: ${extra.join(", ")}.` : ""}${missing.length ? ` Missing: ${missing.join(", ")}.` : ""}`);
}
async function view(methodName: string, args: Record<string, unknown>): Promise<Json> {
  const { contractId, rpc } = contractConfig();
  const body = Buffer.from(JSON.stringify(args)).toString("base64");
  const response = await fetch(rpc, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: "verteus-agent", method: "query", params: { request_type: "call_function", finality: "final", account_id: contractId, method_name: methodName, args_base64: body } }) });
  if (!response.ok) throw new Error(`NEAR RPC HTTP ${response.status}: ${response.statusText}`);
  const payload = await response.json() as { error?: { message?: string; data?: string }; result?: { result?: number[] } };
  if (payload.error) {
    const detail = payload.error.data ? ` ${payload.error.data}` : "";
    throw new Error(`NEAR view ${methodName} failed: ${payload.error.message || "RPC error"}.${detail}`);
  }
  if (!Array.isArray(payload.result?.result)) throw new Error(`NEAR RPC returned an invalid result for ${methodName}.`);
  try { return JSON.parse(Buffer.from(payload.result.result).toString("utf8")) as Json; }
  catch { throw new Error(`Contract returned invalid JSON for ${methodName}.`); }
}

export const toolDefinitions = [
  { name: "search_skills", description: "Find active skills by minimum rarity (read-only).", inputSchema: { type: "object", properties: { min_rarity: { type: "integer", minimum: 0, maximum: 100 }, limit: { type: "integer", minimum: 1, maximum: MAX_LIMIT } }, required: ["min_rarity", "limit"], additionalProperties: false } },
  { name: "get_skill", description: "Read one skill by numeric ID (read-only).", inputSchema: { type: "object", properties: { skill_id: { type: "integer", minimum: 0 } }, required: ["skill_id"], additionalProperties: false } },
  { name: "list_active_auctions", description: "List active Dutch auctions (read-only).", inputSchema: { type: "object", properties: { limit: { type: "integer", minimum: 1, maximum: MAX_LIMIT } }, required: ["limit"], additionalProperties: false } },
  { name: "get_auction_price", description: "Read current price for an auction (read-only).", inputSchema: { type: "object", properties: { auction_id: { type: "integer", minimum: 0 } }, required: ["auction_id"], additionalProperties: false } },
  { name: "has_valid_lease", description: "Check whether an account has an unexpired lease (read-only).", inputSchema: { type: "object", properties: { skill_id: { type: "integer", minimum: 0 }, account: { type: "string", minLength: 2, maxLength: 64 } }, required: ["skill_id", "account"], additionalProperties: false } },
  { name: "prepare_lease", description: "Get the on-chain quote and wallet transaction instructions; never submits a transaction.", inputSchema: { type: "object", properties: { skill_id: { type: "integer", minimum: 0 }, hours: { type: "integer", minimum: 1, maximum: 720 } }, required: ["skill_id", "hours"], additionalProperties: false } },
] as const;

export async function invokeTool(name: string, input: unknown): Promise<Json> {
  const a = objectArgs(input);
  switch (name) {
    case "search_skills": {
      exactKeys(a, ["min_rarity", "limit"]);
      return view("get_skills_by_rarity", { min_rarity: uint(a.min_rarity, "min_rarity", 0, 100), limit: uint(a.limit, "limit", 1, MAX_LIMIT) });
    }
    case "get_skill": exactKeys(a, ["skill_id"]); return view("get_skill", { skill_id: uint(a.skill_id, "skill_id") });
    case "list_active_auctions": exactKeys(a, ["limit"]); return view("get_active_auctions", { limit: uint(a.limit, "limit", 1, MAX_LIMIT) });
    case "get_auction_price": exactKeys(a, ["auction_id"]); return view("get_auction_price", { auction_id: uint(a.auction_id, "auction_id") });
    case "has_valid_lease": {
      exactKeys(a, ["skill_id", "account"]);
      if (!isAccountId(a.account)) throw new Error("account must be a valid NEAR account ID.");
      return view("has_valid_lease", { skill_id: uint(a.skill_id, "skill_id"), account: a.account });
    }
    case "prepare_lease": {
      exactKeys(a, ["skill_id", "hours"]);
      const skillId = uint(a.skill_id, "skill_id");
      const hours = uint(a.hours, "hours", 1, 720);
      let quote: Json;
      try { quote = await view("quote_lease_cost", { skill_id: skillId, hours }); }
      catch (error) { throw new Error(`Lease quote unavailable. The contract must implement view quote_lease_cost(skill_id, hours) first; no transaction was sent. ${error instanceof Error ? error.message : String(error)}`); }
      let deposit: string;
      if (typeof quote === "string" && /^(0|[1-9][0-9]*)$/.test(quote)) deposit = quote;
      else if (typeof quote === "number" && Number.isSafeInteger(quote) && quote >= 0) deposit = String(quote);
      else if (quote && typeof quote === "object" && !Array.isArray(quote) && typeof quote.total === "string" && /^(0|[1-9][0-9]*)$/.test(quote.total)) deposit = quote.total;
      else throw new Error("quote_lease_cost returned an unsupported format; expected yoctoNEAR as a decimal string (or {total: string}).");
      const { contractId, network } = contractConfig();
      return { network, contract_id: contractId, method_name: "lease_skill", args: { skill_id: skillId, hours }, attached_deposit_yocto: deposit, quote_yocto: deposit, instruction: "Review the contract, skill ID, hours, and deposit in your NEAR wallet, then sign and submit manually if you approve. This tool never submits transactions or handles keys." };
    }
    default: throw new Error(`Unknown tool '${name}'. Available tools: ${toolDefinitions.map((t) => t.name).join(", " )}.`);
  }
}

export const cliUsage = `Usage: npx tsx cli.ts <command> [arguments]\nCommands:\n  search_skills <min_rarity 0-100> <limit 1-${MAX_LIMIT}>\n  get_skill <skill_id>\n  list_active_auctions <limit 1-${MAX_LIMIT}>\n  get_auction_price <auction_id>\n  has_valid_lease <skill_id> <account>\n  prepare_lease <skill_id> <hours 1-720>\nEnvironment: VERTEUS_CONTRACT_ID (default ${DEFAULT_CONTRACT}), VERTEUS_NETWORK (testnet|mainnet; default testnet)`;
export async function runCli(argv: string[]) {
  const [name, ...parts] = argv;
  const map: Record<string, string[]> = { search_skills: ["min_rarity", "limit"], get_skill: ["skill_id"], list_active_auctions: ["limit"], get_auction_price: ["auction_id"], has_valid_lease: ["skill_id", "account"], prepare_lease: ["skill_id", "hours"] };
  if (!name || !map[name] || parts.length !== map[name].length) throw new Error(cliUsage);
  const args = Object.fromEntries(map[name].map((key, i) => [key, parts[i]]));
  const result = await invokeTool(name, args);
  console.log(JSON.stringify(result, null, 2));
}
