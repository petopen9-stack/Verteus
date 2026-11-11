use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, UnorderedMap};
use near_sdk::json_types::U128;
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{env, near, AccountId, NearToken, PanicOnDefault, Promise};

mod auction;
use auction::Auction;

const MAX_NAME_BYTES: usize = 128;
const MAX_DESCRIPTION_BYTES: usize = 4_096;
const MAX_TAGS: usize = 16;
const MAX_TAG_BYTES: usize = 64;
const MAX_SCHEMA_BYTES: usize = 8_192;
const MAX_ENDPOINT_BYTES: usize = 2_048;
const NANOS_PER_HOUR: u64 = 3_600_000_000_000;

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
    /// Latest valid expiry per (skill, lessee); avoids scanning lease history.
    pub active_lease_expiry: LookupMap<(u64, AccountId), u64>,
    pub platform_fee_bps: u16,
    /// Dutch auctions for high-rarity skills
    pub auctions: UnorderedMap<u64, Auction>,
    pub next_auction_id: u64,
    /// Current active auction id by skill. Expired entries are replaceable.
    pub active_auction_by_skill: LookupMap<u64, u64>,
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
            active_lease_expiry: LookupMap::new(&b"le"[..]),
            platform_fee_bps,
            auctions: UnorderedMap::new(b"a"),
            next_auction_id: 1,
            active_auction_by_skill: LookupMap::new(&b"as"[..]),
        }
    }

    // ─────────────────────────────────────────────
    // Skill management
    // ─────────────────────────────────────────────

    #[payable]
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
        Self::validate_metadata(
            &name,
            &description,
            &tags,
            &input_schema,
            &output_schema,
            &endpoint,
        );
        let storage_before = env::storage_usage();
        let attached_deposit = env::attached_deposit().as_yoctonear();

        let id = self.next_skill_id;
        self.next_skill_id = id.checked_add(1).expect("Skill id overflow");

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
        let storage_bytes = env::storage_usage()
            .checked_sub(storage_before)
            .expect("Storage usage underflow");
        let required_deposit = (storage_bytes as u128)
            .checked_mul(env::storage_byte_cost().as_yoctonear())
            .expect("Storage deposit overflow");
        assert!(
            attached_deposit >= required_deposit,
            "Insufficient storage deposit: required {} yoctoNEAR",
            required_deposit
        );
        let refund = attached_deposit - required_deposit;
        if refund > 0 {
            Promise::new(env::predecessor_account_id())
                .transfer(NearToken::from_yoctonear(refund))
                .detach();
        }
        env::log_str(&format!(
            "Skill #{} registered by {}",
            id,
            env::predecessor_account_id()
        ));
        id
    }

    fn validate_metadata(
        name: &str,
        description: &str,
        tags: &[String],
        input_schema: &str,
        output_schema: &str,
        endpoint: &str,
    ) {
        assert!(
            !name.is_empty() && name.len() <= MAX_NAME_BYTES,
            "Name length invalid"
        );
        assert!(
            description.len() <= MAX_DESCRIPTION_BYTES,
            "Description too long"
        );
        assert!(tags.len() <= MAX_TAGS, "Too many tags");
        assert!(
            tags.iter()
                .all(|tag| !tag.is_empty() && tag.len() <= MAX_TAG_BYTES),
            "Tag length invalid"
        );
        assert!(
            input_schema.len() <= MAX_SCHEMA_BYTES && output_schema.len() <= MAX_SCHEMA_BYTES,
            "Schema too long"
        );
        assert!(endpoint.len() <= MAX_ENDPOINT_BYTES, "Endpoint too long");
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
            assert!(r <= 100, "Rarity must be 0-100");
            skill.rarity_score = r;
        }
        if let Some(e) = endpoint {
            assert!(e.len() <= MAX_ENDPOINT_BYTES, "Endpoint too long");
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

    fn lease_cost(skill: &Skill, hours: u64) -> u128 {
        assert!(hours > 0 && hours <= 720, "Hours must be 1-720");
        let days = hours / 24;
        let remaining = hours % 24;
        let effective_day_rate = if skill.pricing.lease_per_day.0 > 0 {
            skill.pricing.lease_per_day.0
        } else {
            skill
                .pricing
                .lease_per_hour
                .0
                .checked_mul(24)
                .expect("Lease price overflow")
        };
        let day_cost = effective_day_rate
            .checked_mul(days as u128)
            .expect("Lease price overflow");
        let hour_cost = skill
            .pricing
            .lease_per_hour
            .0
            .checked_mul(remaining as u128)
            .expect("Lease price overflow");
        day_cost
            .checked_add(hour_cost)
            .expect("Lease price overflow")
    }

    fn calculate_fee(amount: u128, fee_bps: u16) -> u128 {
        let bps = fee_bps as u128;
        let whole = (amount / 10_000).checked_mul(bps).expect("Fee overflow");
        let fractional = (amount % 10_000).checked_mul(bps).expect("Fee overflow") / 10_000;
        whole.checked_add(fractional).expect("Fee overflow")
    }

    pub fn quote_lease_cost(&self, skill_id: u64, hours: u64) -> U128 {
        let skill = self.skills.get(&skill_id).expect("Skill not found");
        U128(Self::lease_cost(&skill, hours))
    }

    #[payable]
    pub fn lease_skill(&mut self, skill_id: u64, hours: u64) -> Lease {
        let mut skill = self.skills.get(&skill_id).expect("Skill not found");
        assert!(skill.active, "Skill inactive");
        let total = Self::lease_cost(&skill, hours);
        assert!(total > 0, "Lease not available");
        assert_eq!(
            env::attached_deposit().as_yoctonear(),
            total,
            "Deposit must equal lease price"
        );

        let fee = Self::calculate_fee(total, self.platform_fee_bps);
        let to_owner = total.checked_sub(fee).expect("Fee exceeds payment");
        if to_owner > 0 {
            Promise::new(skill.owner.clone())
                .transfer(NearToken::from_yoctonear(to_owner))
                .detach();
        }
        if fee > 0 {
            Promise::new(self.owner.clone())
                .transfer(NearToken::from_yoctonear(fee))
                .detach();
        }

        let duration = hours
            .checked_mul(NANOS_PER_HOUR)
            .expect("Lease duration overflow");
        let lessee = env::predecessor_account_id();
        let key = (skill_id, lessee.clone());
        let now = env::block_timestamp();
        let lease_start = self.active_lease_expiry.get(&key).unwrap_or(now).max(now);
        let expires_at = lease_start
            .checked_add(duration)
            .expect("Lease expiry overflow");
        let lease = Lease {
            skill_id,
            lessee: lessee.clone(),
            expires_at,
            paid: U128(total),
        };
        self.active_lease_expiry.insert(&key, &expires_at);

        skill.usage_count = skill
            .usage_count
            .checked_add(1)
            .expect("Usage count overflow");
        self.skills.insert(&skill_id, &skill);
        env::log_str(&format!(
            "Lease created: skill #{} for {} hours, expires {}",
            skill_id, hours, expires_at
        ));
        lease
    }

    pub fn has_valid_lease(&self, skill_id: u64, account: AccountId) -> bool {
        self.active_lease_expiry
            .get(&(skill_id, account))
            .map(|expiry| expiry > env::block_timestamp())
            .unwrap_or(false)
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
        if let Some(existing_id) = self.active_auction_by_skill.get(&skill_id) {
            let existing = self
                .auctions
                .get(&existing_id)
                .expect("Auction index corrupt");
            assert!(
                !existing.is_active(),
                "Active auction already exists for skill"
            );
        }

        let id = self.next_auction_id;
        self.next_auction_id = id.checked_add(1).expect("Auction id overflow");
        let now = env::block_timestamp();
        let duration = duration_hours
            .checked_mul(NANOS_PER_HOUR)
            .expect("Auction duration overflow");
        let end_time = now
            .checked_add(duration)
            .expect("Auction end time overflow");
        let auction = Auction {
            skill_id,
            seller: env::predecessor_account_id(),
            start_price,
            end_price,
            start_time: now,
            end_time,
            winner: None,
            final_price: None,
            settled: false,
        };
        self.auctions.insert(&id, &auction);
        self.active_auction_by_skill.insert(&skill_id, &id);
        env::log_str(&format!("Auction #{} started for skill #{}", id, skill_id));
        id
    }

    /// Buy now at the current Dutch price
    #[payable]
    pub fn buy_auction(&mut self, auction_id: u64) {
        let mut auction = self.auctions.get(&auction_id).expect("Auction not found");
        assert!(auction.is_active(), "Auction not active");
        let mut skill = self.skills.get(&auction.skill_id).expect("Skill missing");
        assert_eq!(
            skill.owner, auction.seller,
            "Auction seller no longer owns skill"
        );
        let price = auction.current_price();
        assert_eq!(
            env::attached_deposit().as_yoctonear(),
            price,
            "Deposit must equal auction price"
        );

        let fee = Self::calculate_fee(price, self.platform_fee_bps);
        let to_seller = price.checked_sub(fee).expect("Fee exceeds payment");
        if to_seller > 0 {
            Promise::new(auction.seller.clone())
                .transfer(NearToken::from_yoctonear(to_seller))
                .detach();
        }
        if fee > 0 {
            Promise::new(self.owner.clone())
                .transfer(NearToken::from_yoctonear(fee))
                .detach();
        }

        skill.owner = env::predecessor_account_id();
        self.skills.insert(&auction.skill_id, &skill);
        auction.winner = Some(env::predecessor_account_id());
        auction.final_price = Some(U128(price));
        auction.settled = true;
        self.auctions.insert(&auction_id, &auction);
        self.clear_active_auction(auction.skill_id, auction_id);
        env::log_str(&format!(
            "Auction #{} won by {} at {}",
            auction_id,
            env::predecessor_account_id(),
            price
        ));
    }

    /// Seller may cancel an unsettled auction; no payment is accepted.
    pub fn cancel_auction(&mut self, auction_id: u64) {
        let mut auction = self.auctions.get(&auction_id).expect("Auction not found");
        assert!(auction.is_active(), "Auction not active");
        assert_eq!(
            auction.seller,
            env::predecessor_account_id(),
            "Only seller may cancel"
        );
        auction.settled = true;
        self.auctions.insert(&auction_id, &auction);
        self.clear_active_auction(auction.skill_id, auction_id);
    }

    fn clear_active_auction(&mut self, skill_id: u64, auction_id: u64) {
        if self.active_auction_by_skill.get(&skill_id) == Some(auction_id) {
            self.active_auction_by_skill.remove(&skill_id);
        }
    }

    pub fn get_auction(&self, auction_id: u64) -> Option<Auction> {
        self.auctions.get(&auction_id)
    }
    pub fn get_auction_price(&self, auction_id: u64) -> Option<U128> {
        self.auctions
            .get(&auction_id)
            .map(|a| U128(a.current_price()))
    }

    pub fn get_active_auctions(&self, limit: u64) -> Vec<(u64, Auction)> {
        let mut result = Vec::new();
        let bounded_limit = limit.min(100);
        if bounded_limit == 0 {
            return result;
        }
        for (id, auction) in self.auctions.iter() {
            if auction.is_active() {
                result.push((id, auction));
                if result.len() as u64 >= bounded_limit {
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
        let bounded_limit = limit.min(100);
        if bounded_limit == 0 {
            return result;
        }
        for (_, skill) in self.skills.iter() {
            if skill.active && skill.rarity_score >= min_rarity {
                let insertion = result
                    .iter()
                    .position(|existing: &Skill| existing.rarity_score < skill.rarity_score)
                    .unwrap_or(result.len());
                result.insert(insertion, skill);
                if result.len() > bounded_limit as usize {
                    result.pop();
                }
            }
        }
        result
    }

    pub fn get_all_skills(&self, from_index: u64, limit: u64) -> Vec<Skill> {
        let bounded_limit = limit.min(100);
        if from_index >= self.skills.len() || bounded_limit == 0 {
            return Vec::new();
        }
        let offset = usize::try_from(from_index).unwrap_or(usize::MAX);
        self.skills
            .iter()
            .skip(offset)
            .take(bounded_limit as usize)
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

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_skill(hourly: u128, daily: u128) -> Skill {
        Skill {
            id: 1,
            name: "test".to_string(),
            description: String::new(),
            owner: "owner.testnet".parse().unwrap(),
            tags: Vec::new(),
            input_schema: String::new(),
            output_schema: String::new(),
            pricing: Pricing {
                lease_per_hour: U128(hourly),
                lease_per_day: U128(daily),
                buy_out: U128(0),
            },
            rarity_score: 0,
            usage_count: 0,
            created_at: 0,
            endpoint: String::new(),
            active: true,
        }
    }

    #[test]
    fn lease_quote_uses_full_days_and_hourly_remainder() {
        let skill = sample_skill(4, 100);
        assert_eq!(Contract::lease_cost(&skill, 25), 104);
        assert_eq!(Contract::lease_cost(&skill, 48), 200);
    }

    #[test]
    fn lease_quote_falls_back_to_hourly_rate_for_full_days() {
        let skill = sample_skill(5, 0);
        assert_eq!(Contract::lease_cost(&skill, 36), 180);
    }

    #[test]
    #[should_panic(expected = "Hours must be 1-720")]
    fn lease_quote_rejects_zero_hours() {
        Contract::lease_cost(&sample_skill(1, 24), 0);
    }

    #[test]
    fn fee_calculation_handles_u128_max_without_overflow() {
        assert_eq!(
            Contract::calculate_fee(u128::MAX, 250),
            8_507_059_173_023_461_586_584_365_185_794_205_286
        );
        assert_eq!(
            Contract::calculate_fee(u128::MAX, 1_000),
            34_028_236_692_093_846_346_337_460_743_176_821_145
        );
        assert_eq!(Contract::calculate_fee(9_999, 250), 249);
    }

    fn register_with_storage_deposit(deposit: u128) -> Contract {
        let mut context = near_sdk::test_utils::VMContextBuilder::new();
        context
            .predecessor_account_id("alice.testnet".parse().unwrap())
            .attached_deposit(NearToken::from_yoctonear(deposit));
        near_sdk::testing_env!(context.build());

        let mut contract = Contract::new("owner.testnet".parse().unwrap(), 250);
        contract.register_skill(
            "Demo skill".to_string(),
            "Test description".to_string(),
            vec!["demo".to_string()],
            "{}".to_string(),
            "{}".to_string(),
            Pricing {
                lease_per_hour: U128(1),
                lease_per_day: U128(24),
                buy_out: U128(0),
            },
            50,
            "https://example.com/skill".to_string(),
        );
        contract
    }

    #[test]
    fn registration_accepts_storage_buffer_and_records_skill() {
        let contract = register_with_storage_deposit(1_000_000_000_000_000_000_000_000);
        assert_eq!(contract.skill_count(), 1);
    }

    #[test]
    #[should_panic(expected = "Insufficient storage deposit")]
    fn registration_rejects_zero_storage_deposit() {
        register_with_storage_deposit(0);
    }
}
