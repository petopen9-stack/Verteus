#!/usr/bin/env node
import { createInterface } from "node:readline";
import { invokeTool, toolDefinitions } from "./verteus.ts";

type RpcRequest = { jsonrpc?: unknown; id?: unknown; method?: unknown; params?: unknown };
function send(value: unknown) { process.stdout.write(`${JSON.stringify(value)}\n`); }
function rpcError(id: unknown, code: number, message: string) { send({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }); }

const input = createInterface({ input: process.stdin, crlfDelay: Infinity, terminal: false });
input.on("line", async (line) => {
  if (!line.trim()) return;
  let request: RpcRequest;
  try { request = JSON.parse(line); }
  catch { rpcError(null, -32700, "Parse error"); return; }
  if (!request || request.jsonrpc !== "2.0" || typeof request.method !== "string") { rpcError(request?.id, -32600, "Invalid Request"); return; }
  const notification = !Object.prototype.hasOwnProperty.call(request, "id");
  try {
    let result: unknown;
    switch (request.method) {
      case "initialize":
        result = { protocolVersion: typeof (request.params as any)?.protocolVersion === "string" ? (request.params as any).protocolVersion : "2024-11-05", capabilities: { tools: { listChanged: false } }, serverInfo: { name: "verteus-near", version: "1.0.0" } };
        break;
      case "notifications/initialized":
        return;
      case "ping": result = {}; break;
      case "tools/list": result = { tools: toolDefinitions }; break;
      case "tools/call": {
        const p = request.params as any;
        if (!p || typeof p.name !== "string") { if (!notification) rpcError(request.id, -32602, "tools/call requires params.name"); return; }
        try {
          const value = await invokeTool(p.name, p.arguments ?? {});
          result = { content: [{ type: "text", text: JSON.stringify(value, null, 2) }], structuredContent: value, isError: false };
        } catch (e) {
          result = { content: [{ type: "text", text: e instanceof Error ? e.message : String(e) }], isError: true };
        }
        break;
      }
      default:
        if (!notification) rpcError(request.id, -32601, `Method not found: ${request.method}`);
        return;
    }
    if (!notification) send({ jsonrpc: "2.0", id: request.id, result });
  } catch (e) { if (!notification) rpcError(request.id, -32603, e instanceof Error ? e.message : "Internal error"); }
});
