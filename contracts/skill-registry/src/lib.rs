use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, UnorderedMap, Vector};
use near_sdk::json_types::U128;
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{
    env, near, AccountId, NearToken, PanicOnDefault, Promise,
};

/// Pricing model for a skill
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct Pricing {
    /// Price to lease for 1 hour (in yoctoNEAR). 0 = not available
    pub lease_per_hour: U128,
    /// Price to lease for 24 hours
    pub lease_per_day: U128,
    /// One-time buy-out price (permanent ownership transfer). 0 = not for sale
    pub buy_out: U128,
}

/// On-chain representation of a rare skill
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct Skill {
    pub id: u64,
    pub name: String,
    pub description: String,
    pub owner: AccountId,
    pub tags: Vec<String>,
    pub input_schema: String,   // JSON Schema as string
    pub output_schema: String,
    pub pricing: Pricing,
    /// 0-100. Higher = rarer / more valuable
    pub rarity_score: u8,
    pub usage_count: u64,
    pub created_at: u64,
    pub endpoint: String,       // off-chain endpoint the agent listens on
    pub active: bool,
}

/// Active lease of a skill
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct Lease {
    pub skill_id: u64,
    pub lessee: AccountId,
    pub expires_at: u64,        // timestamp in ns
    pub paid: U128,
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Contract {
    pub owner: AccountId,
    pub skills: UnorderedMap<u64, Skill>,
    pub next_skill_id: u64,
    /// skill_id -> list of active leases
    pub leases: LookupMap<u64, Vector<Lease>>,
    /// Platform fee in basis points (e.g. 250 = 2.5%)
    pub platform_fee_bps: u16,
}

#[near]
impl Contract {
    #[init]
    pub fn new(owner: AccountId, platform_fee_bps: u16) -> Self {
        assert!(platform_fee_bps <= 1000, "Fee too high");
        Self {
            owner,
            skills: UnorderedMap::new(b"s"),
            next_skill_id: 1,
            leases: LookupMap::new(b"l"),
            platform_fee_bps,
        }
    }

    // ─────────────────────────────────────────────
    // Skill management
    // ─────────────────────────────────────────────

    /// Register a new skill. Returns the skill id.
    pub fn register_skill(
        &mut self,
        name: String,
        description: String,
        tags: Vec<String>,
        input_schema: String,
        output_schema: String,
        pricing: Pricing,
        rarity_score: u8,
        endpoint: String,
    ) -> u64 {
        assert!(rarity_score <= 100, "Rarity must be 0-100");
        assert!(!name.is_empty(), "Name required");

        let id = self.next_skill_id;
        self.next_skill_id += 1;

        let skill = Skill {
            id,
            name,
            description,
            owner: env::predecessor_account_id(),
            tags,
            input_schema,
            output_schema,
            pricing,
            rarity_score,
            usage_count: 0,
            created_at: env::block_timestamp(),
            endpoint,
            active: true,
        };

        self.skills.insert(&id, &skill);
        env::log_str(&format!("Skill #{} registered by {}", id, env::predecessor_account_id()));
        id
    }

    /// Update pricing / rarity / endpoint (owner only)
    pub fn update_skill(
        &mut self,
        skill_id: u64,
        pricing: Option<Pricing>,
        rarity_score: Option<u8>,
        endpoint: Option<String>,
        active: Option<bool>,
    ) {
        let mut skill = self.skills.get(&skill_id).expect("Skill not found");
        assert_eq!(skill.owner, env::predecessor_account_id(), "Only owner");

        if let Some(p) = pricing {
            skill.pricing = p;
        }
        if let Some(r) = rarity_score {
            assert!(r <= 100);
            skill.rarity_score = r;
        }
        if let Some(e) = endpoint {
            skill.endpoint = e;
        }
        if let Some(a) = active {
            skill.active = a;
        }
        self.skills.insert(&skill_id, &skill);
    }

    // ─────────────────────────────────────────────
    // Leasing
    // ─────────────────────────────────────────────

    /// Lease a skill for a number of hours. Attached deposit must cover the price.
    #[payable]
    pub fn lease_skill(&mut self, skill_id: u64, hours: u64) -> Lease {
        let mut skill = self.skills.get(&skill_id).expect("Skill not found");
        assert!(skill.active, "Skill inactive");
        assert!(hours > 0 && hours <= 720, "Hours must be 1-720");

        let price_per_hour = skill.pricing.lease_per_hour.0;
        assert!(price_per_hour > 0, "Hourly lease not available");

        let total = price_per_hour.saturating_mul(hours as u128);
        let attached = env::attached_deposit().as_yoctonear();
        assert!(attached >= total, "Insufficient deposit");

        // Platform fee
        let fee = total * self.platform_fee_bps as u128 / 10_000;
        let to_owner = total - fee;

        // Pay the skill owner
        Promise::new(skill.owner.clone()).transfer(NearToken::from_yoctonear(to_owner));

        // Fee stays in contract (can be withdrawn by platform owner later)

        let expires_at = env::block_timestamp() + hours * 3_600_000_000_000; // ns

        let lease = Lease {
            skill_id,
            lessee: env::predecessor_account_id(),
            expires_at,
            paid: U128(total),
        };

        // Store lease
        let mut leases = self.leases.get(&skill_id).unwrap_or_else(|| {
            Vector::new(format!("leases-{}", skill_id).as_bytes())
        });
        leases.push(&lease);
        self.leases.insert(&skill_id, &leases);

        // Update usage
        skill.usage_count += 1;
        self.skills.insert(&skill_id, &skill);

        env::log_str(&format!(
            "Lease created: skill #{} for {} hours, expires {}",
            skill_id, hours, expires_at
        ));

        lease
    }

    /// Check whether an account currently holds a valid lease on a skill
    pub fn has_valid_lease(&self, skill_id: u64, account: AccountId) -> bool {
        let Some(leases) = self.leases.get(&skill_id) else {
            return false;
        };
        let now = env::block_timestamp();
        for i in 0..leases.len() {
            if let Some(l) = leases.get(i) {
                if l.lessee == account && l.expires_at > now {
                    return true;
                }
            }
        }
        false
    }

    // ─────────────────────────────────────────────
    // Views
    // ─────────────────────────────────────────────

    pub fn get_skill(&self, skill_id: u64) -> Option<Skill> {
        self.skills.get(&skill_id)
    }

    pub fn get_skills_by_rarity(&self, min_rarity: u8, limit: u64) -> Vec<Skill> {
        let mut result = Vec::new();
        for (_, skill) in self.skills.iter() {
            if skill.active && skill.rarity_score >= min_rarity {
                result.push(skill);
                if result.len() as u64 >= limit {
                    break;
                }
            }
        }
        // Sort by rarity descending (simple bubble for small sets)
        result.sort_by(|a, b| b.rarity_score.cmp(&a.rarity_score));
        result
    }

    pub fn get_all_skills(&self, from_index: u64, limit: u64) -> Vec<Skill> {
        self.skills
            .iter()
            .skip(from_index as usize)
            .take(limit as usize)
            .map(|(_, s)| s)
            .collect()
    }

    pub fn skill_count(&self) -> u64 {
        self.skills.len()
    }
}
