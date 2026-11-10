use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, UnorderedMap, Vector};
use near_sdk::json_types::U128;
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{
    env, near, AccountId, NearToken, PanicOnDefault, Promise,
};

mod auction;
use auction::Auction;

/// Pricing model for a skill
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct Pricing {
    pub lease_per_hour: U128,
    pub lease_per_day: U128,
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
    pub input_schema: String,
    pub output_schema: String,
    pub pricing: Pricing,
    pub rarity_score: u8,
    pub usage_count: u64,
    pub created_at: u64,
    pub endpoint: String,
    pub active: bool,
}

/// Active lease of a skill
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct Lease {
    pub skill_id: u64,
    pub lessee: AccountId,
    pub expires_at: u64,
    pub paid: U128,
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Contract {
    pub owner: AccountId,
    pub skills: UnorderedMap<u64, Skill>,
    pub next_skill_id: u64,
    pub leases: LookupMap<u64, Vector<Lease>>,
    pub platform_fee_bps: u16,
    /// Dutch auctions for high-rarity skills
    pub auctions: UnorderedMap<u64, Auction>,
    pub next_auction_id: u64,
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
            auctions: UnorderedMap::new(b"a"),
            next_auction_id: 1,
        }
    }

    // ─────────────────────────────────────────────
    // Skill management
    // ─────────────────────────────────────────────

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

        let fee = total * self.platform_fee_bps as u128 / 10_000;
        let to_owner = total - fee;

        Promise::new(skill.owner.clone()).transfer(NearToken::from_yoctonear(to_owner));

        let expires_at = env::block_timestamp() + hours * 3_600_000_000_000;

        let lease = Lease {
            skill_id,
            lessee: env::predecessor_account_id(),
            expires_at,
            paid: U128(total),
        };

        let mut leases = self.leases.get(&skill_id).unwrap_or_else(|| {
            Vector::new(format!("leases-{}", skill_id).as_bytes())
        });
        leases.push(&lease);
        self.leases.insert(&skill_id, &leases);

        skill.usage_count += 1;
        self.skills.insert(&skill_id, &skill);

        env::log_str(&format!(
            "Lease created: skill #{} for {} hours, expires {}",
            skill_id, hours, expires_at
        ));

        lease
    }

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
    // Dutch Auction (for rarity >= 80 skills)
    // ─────────────────────────────────────────────

    /// Start a Dutch auction for a skill you own
    pub fn start_auction(
        &mut self,
        skill_id: u64,
        start_price: U128,
        end_price: U128,
        duration_hours: u64,
    ) -> u64 {
        let skill = self.skills.get(&skill_id).expect("Skill not found");
        assert_eq!(skill.owner, env::predecessor_account_id(), "Only owner");
        assert!(skill.rarity_score >= 80, "Auction only for rarity >= 80");
        assert!(start_price.0 > end_price.0, "Start must be > end");
        assert!(duration_hours >= 1 && duration_hours <= 168, "1-168 hours");

        let id = self.next_auction_id;
        self.next_auction_id += 1;

        let now = env::block_timestamp();
        let auction = Auction {
            skill_id,
            seller: env::predecessor_account_id(),
            start_price,
            end_price,
            start_time: now,
            end_time: now + duration_hours * 3_600_000_000_000,
            winner: None,
            final_price: None,
            settled: false,
        };

        self.auctions.insert(&id, &auction);
        env::log_str(&format!("Auction #{} started for skill #{}", id, skill_id));
        id
    }

    /// Buy now at the current Dutch price
    #[payable]
    pub fn buy_auction(&mut self, auction_id: u64) {
        let mut auction = self.auctions.get(&auction_id).expect("Auction not found");
        assert!(auction.is_active(), "Auction not active");

        let price = auction.current_price();
        let attached = env::attached_deposit().as_yoctonear();
        assert!(attached >= price, "Insufficient deposit");

        let fee = price * self.platform_fee_bps as u128 / 10_000;
        let to_seller = price - fee;

        Promise::new(auction.seller.clone()).transfer(NearToken::from_yoctonear(to_seller));

        // Transfer skill ownership
        let mut skill = self.skills.get(&auction.skill_id).expect("Skill missing");
        skill.owner = env::predecessor_account_id();
        self.skills.insert(&auction.skill_id, &skill);

        auction.winner = Some(env::predecessor_account_id());
        auction.final_price = Some(U128(price));
        auction.settled = true;
        self.auctions.insert(&auction_id, &auction);

        env::log_str(&format!(
            "Auction #{} won by {} at {}",
            auction_id,
            env::predecessor_account_id(),
            price
        ));
    }

    pub fn get_auction(&self, auction_id: u64) -> Option<Auction> {
        self.auctions.get(&auction_id)
    }

    pub fn get_auction_price(&self, auction_id: u64) -> Option<U128> {
        self.auctions.get(&auction_id).map(|a| U128(a.current_price()))
    }

    pub fn get_active_auctions(&self, limit: u64) -> Vec<(u64, Auction)> {
        let mut result = Vec::new();
        for (id, auction) in self.auctions.iter() {
            if auction.is_active() {
                result.push((id, auction));
                if result.len() as u64 >= limit {
                    break;
                }
            }
        }
        result
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

    pub fn get_skills_by_owner(&self, owner: AccountId) -> Vec<Skill> {
        self.skills
            .iter()
            .filter(|(_, s)| s.owner == owner)
            .map(|(_, s)| s)
            .collect()
    }
}
