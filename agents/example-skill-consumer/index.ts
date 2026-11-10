/**
 * Example Skill Consumer Agent
 *
 * This agent:
 * 1. Discovers a rare skill on Verteus
 * 2. Leases it (pays NEAR)
 * 3. Calls the skill endpoint
 * 4. Uses the result in its own workflow
 *
 * Run: npx tsx index.ts
 */

async function leaseAndUseSkill() {
  // 1. In production: call get_skills_by_rarity on the contract
  const skill = {
    id: 1,
    name: "Indonesian Legal Clause Extractor",
    endpoint: "http://localhost:8787/skill",
    pricePerHour: "0.1",
  };

  console.log(`Found skill: ${skill.name} (id=${skill.id})`);

  // 2. In production: call lease_skill with attached deposit
  console.log(`Leasing skill #${skill.id} for 1 hour...`);
  // await contract.lease_skill({ skill_id: skill.id, hours: 1 }, GAS, deposit);

  // 3. Call the skill
  const response = await fetch(skill.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: "Pasal 1: Pihak pertama wajib menyerahkan aset digital...",
    }),
  });

  const result = await response.json();
  console.log("Skill result:", JSON.stringify(result, null, 2));

  // 4. Use the result in the consumer agent's own logic
  console.log("\nConsumer agent can now map the clauses into a NEAR contract draft.");
}

leaseAndUseSkill().catch(console.error);
