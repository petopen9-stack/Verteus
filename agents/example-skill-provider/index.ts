/**
 * Example Skill Provider Agent
 *
 * Local mock only. It neither registers a skill nor checks on-chain leases;
 * its fixed sample response is not a production skill execution service.
 *
 * Run: npx tsx index.ts
 */

const SKILL_ENDPOINT = process.env.SKILL_ENDPOINT || "http://127.0.0.1:8787";
const MAX_BODY_BYTES = 1_000_000;
const MAX_TEXT_CHARS = 100_000;

// Simulated rare skill: Indonesian legal clause extractor
async function runSkill(input: { text: string }) {
  // In production this would call an LLM / specialized model
  const clauses = [
    {
      type: "kewajiban",
      text: "Pihak pertama wajib melakukan...",
      nearMapping: "assert_eq!(env::predecessor_account_id(), owner)",
    },
    {
      type: "sanksi",
      text: "Apabila terjadi wanprestasi...",
      nearMapping: "Promise::new(account).transfer(penalty)",
    },
  ];

  return {
    skill: "indonesian-legal-clause-extractor",
    inputLength: input.text.length,
    clauses,
    confidence: 0.91,
    processedAt: new Date().toISOString(),
  };
}

// Simple HTTP server that the marketplace / lessee can call
import { createServer } from "http";

const server = createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/skill") {
    let body = "";
    let bodyBytes = 0;
    for await (const chunk of req) {
      const part = typeof chunk === "string" ? chunk : chunk.toString("utf8");
      bodyBytes += Buffer.byteLength(part, "utf8");
      if (bodyBytes > MAX_BODY_BYTES) {
        res.writeHead(413, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Request body too large" }));
        req.resume();
        return;
      }
      body += part;
    }

    try {
      const input: unknown = JSON.parse(body);
      if (!input || typeof input !== "object" || Array.isArray(input) || typeof (input as { text?: unknown }).text !== "string") {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Expected JSON object with a text string" }));
        return;
      }
      if ((input as { text: string }).text.length > MAX_TEXT_CHARS) {
        res.writeHead(413, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Text input too large" }));
        return;
      }
      // TODO: verify the caller has a valid on-chain lease
      // by calling has_valid_lease on the skill-registry contract

      const result = await runSkill(input as { text: string });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON request" }));
    }
  } else if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200);
    res.end("ok");
  } else {
    res.writeHead(404);
    res.end();
  }
});

const PORT = Number(process.env.PORT) || 8787;
const HOST = process.env.HOST || "127.0.0.1";
server.listen(PORT, HOST, () => {
  console.log(`Local demo provider listening on ${HOST}:${PORT}`);
  console.log(`Endpoint: ${SKILL_ENDPOINT}/skill`);
  console.log("Local demonstration only: lease authorization is not enforced; do not expose this server publicly.");
});
