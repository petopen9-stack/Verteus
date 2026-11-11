import { providers } from "near-api-js";

export const NETWORK = process.env.NEXT_PUBLIC_NETWORK || "testnet";
export const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || "";

export const NETWORK_CONFIG = {
  testnet: {
    networkId: "testnet",
    nodeUrl: "https://rpc.testnet.near.org",
    walletUrl: "https://testnet.mynearwallet.com",
    helperUrl: "https://helper.testnet.near.org",
  },
  mainnet: {
    networkId: "mainnet",
    nodeUrl: "https://rpc.mainnet.near.org",
    walletUrl: "https://app.mynearwallet.com",
    helperUrl: "https://helper.mainnet.near.org",
  },
} as const;

export function getProvider() {
  const cfg = NETWORK_CONFIG[NETWORK as keyof typeof NETWORK_CONFIG] || NETWORK_CONFIG.testnet;
  return new providers.JsonRpcProvider({ url: cfg.nodeUrl });
}

export async function viewMethod(method: string, args: object = {}) {
  if (!CONTRACT_ID) {
    console.warn("NEXT_PUBLIC_CONTRACT_ID not set — returning null");
    return null;
  }
  const provider = getProvider();
  const res = await provider.query({
    request_type: "call_function",
    account_id: CONTRACT_ID,
    method_name: method,
    args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
    finality: "optimistic",
  });
  // @ts-ignore
  const result = res.result;
  return JSON.parse(Buffer.from(result).toString());
}

export function parseNear(amount: string): string {
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,24})?$/.test(amount)) {
    throw new Error("Amount must be a non-negative decimal with at most 24 fractional digits");
  }
  const [whole, fraction = ""] = amount.split(".");
  return (BigInt(whole) * BigInt("1000000000000000000000000") + BigInt((fraction + "0".repeat(24)).slice(0, 24))).toString();
}

export function formatNear(yocto: string): string {
  if (!/^\d+$/.test(yocto)) throw new Error("Invalid yoctoNEAR amount");
  const value = BigInt(yocto);
  const whole = value / BigInt("1000000000000000000000000");
  const fraction = (value % BigInt("1000000000000000000000000")).toString().padStart(24, "0");
  if (whole === BigInt(0)) {
    const first = fraction.search(/[1-9]/);
    if (first === -1) return "0.00";
    const significant = fraction.slice(first, first + 2).padEnd(2, "0");
    return `${significant[0]}.${significant[1]}e-${first + 1}`;
  }
  return `${whole}.${fraction.slice(0, 2)}`;
}
