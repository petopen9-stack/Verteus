use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::json_types::U128;
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{env, AccountId};

/// Simple Dutch auction for high-rarity skills
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct Auction {
    pub skill_id: u64,
    pub seller: AccountId,
    pub start_price: U128,
    pub end_price: U128,
    pub start_time: u64,
    pub end_time: u64,
    pub winner: Option<AccountId>,
    pub final_price: Option<U128>,
    pub settled: bool,
}

impl Auction {
    /// Current price of a Dutch auction (linear decay), without overflowing diff * elapsed.
    pub fn current_price(&self) -> u128 {
        let now = env::block_timestamp();
        if now >= self.end_time {
            return self.end_price.0;
        }
        if now <= self.start_time {
            return self.start_price.0;
        }
        let total = (self.end_time - self.start_time) as u128;
        let elapsed = (now - self.start_time) as u128;
        let diff = self
            .start_price
            .0
            .checked_sub(self.end_price.0)
            .expect("Invalid auction price bounds");
        let quotient = diff / total;
        let remainder = diff % total;
        let whole_decay = quotient
            .checked_mul(elapsed)
            .expect("Auction price calculation overflow");
        // remainder < total <= u64::MAX and elapsed < total, so this product fits u128.
        let fractional_decay = remainder
            .checked_mul(elapsed)
            .expect("Auction price calculation overflow")
            / total;
        let decay = whole_decay
            .checked_add(fractional_decay)
            .expect("Auction price calculation overflow");
        self.start_price
            .0
            .checked_sub(decay)
            .expect("Auction price calculation underflow")
    }

    pub fn is_active(&self) -> bool {
        let now = env::block_timestamp();
        !self.settled && now >= self.start_time && now < self.end_time
    }
}
