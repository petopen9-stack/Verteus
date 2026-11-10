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
  // Convert human NEAR to yocto string
  const [whole, frac = ""] = amount.split(".");
  const fracPadded = (frac + "000000000000000000000000").slice(0, 24);
  return BigInt(whole + fracPadded).toString();
}
