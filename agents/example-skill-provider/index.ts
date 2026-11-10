/**
 * Example Skill Provider Agent
 *
 * This agent:
 * 1. Registers a rare skill on the Verteus skill-registry contract
 * 2. Listens for lease-authorized requests
 * 3. Executes the skill and returns the result
 *
 * Run: npx tsx index.ts
 */

const SKILL_ENDPOINT = process.env.SKILL_ENDPOINT || "http://localhost:8787";

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
    for await (const chunk of req) body += chunk;

    try {
      const input = JSON.parse(body);
      // TODO: verify the caller has a valid on-chain lease
      // by calling has_valid_lease on the skill-registry contract

      const result = await runSkill(input);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
    } catch (e: any) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: e.message }));
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
server.listen(PORT, () => {
  console.log(`Skill provider listening on :${PORT}`);
  console.log(`Endpoint: ${SKILL_ENDPOINT}/skill`);
  console.log(`Register this endpoint when calling register_skill on the contract.`);
});
