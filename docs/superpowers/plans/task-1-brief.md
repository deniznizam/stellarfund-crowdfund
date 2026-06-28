# Task 1 Brief: Write and build the Soroban Smart Contract

## Goal
Implement a Soroban smart contract in Rust that tracks a campaign's name, goal, total funds raised, donor count, and maintains a sorted leaderboard of the Top 3 donors.

## Files
- Modify: `contract/contracts/crowdfund/src/lib.rs`

## Interfaces
- Produces: 
  - `initialize(title: String, goal: i128)`: Sets campaign info.
  - `fund(donor: Address, amount: i128) -> i128`: Accepts donor funds, updates totals, and inserts/updates donor in the top 3 leaderboard.
  - `get_campaign() -> Campaign`: Returns Campaign details (including top_donors list).
  - `get_donor_amount(donor: Address) -> i128`: Returns total contribution by this address.

## Verbatim Code to Write
```rust
#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Vec};

#[contracttype]
#[derive(Clone)]
pub struct TopDonor {
    pub address: Address,
    pub amount: i128,
}

#[contracttype]
#[derive(Clone)]
pub struct Campaign {
    pub title: String,
    pub goal: i128,
    pub total: i128,
    pub donor_count: u32,
    pub top_donors: Vec<TopDonor>,
}

#[contracttype]
pub enum DataKey {
    Campaign,
    Donor(Address),
}

#[contract]
pub struct CrowdfundContract;

#[contractimpl]
impl CrowdfundContract {
    pub fn initialize(env: Env, title: String, goal: i128) {
        if env.storage().instance().has(&DataKey::Campaign) {
            panic!("already initialized");
        }
        let campaign = Campaign {
            title,
            goal,
            total: 0,
            donor_count: 0,
            top_donors: Vec::new(&env),
        };
        env.storage().instance().set(&DataKey::Campaign, &campaign);
        env.storage().instance().extend_ttl(100_000, 100_000);
    }

    pub fn fund(env: Env, donor: Address, amount: i128) -> i128 {
        donor.require_auth();
        if amount <= 0 {
            panic!("amount must be positive");
        }
        let mut campaign: Campaign = env
            .storage()
            .instance()
            .get(&DataKey::Campaign)
            .expect("not initialized");

        let prev: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Donor(donor.clone()))
            .unwrap_or(0);

        if prev == 0 {
            campaign.donor_count += 1;
        }
        let new_total = prev + amount;
        campaign.total += amount;

        // Save individual balance
        env.storage()
            .persistent()
            .set(&DataKey::Donor(donor.clone()), &new_total);

        // Update top donors list
        let mut updated = false;
        let mut new_list = Vec::new(&env);
        
        for donor_entry in campaign.top_donors.iter() {
            if donor_entry.address == donor {
                new_list.push_back(TopDonor {
                    address: donor.clone(),
                    amount: new_total,
                });
                updated = true;
            } else {
                new_list.push_back(donor_entry);
            }
        }

        if !updated {
            new_list.push_back(TopDonor {
                address: donor.clone(),
                amount: new_total,
            });
        }

        // Sort descending
        let mut sorted = Vec::new(&env);
        while new_list.len() > 0 {
            let mut max_idx = 0;
            let mut max_entry = new_list.get(0).unwrap();
            for i in 1..new_list.len() {
                let entry = new_list.get(i).unwrap();
                if entry.amount > max_entry.amount {
                    max_entry = entry;
                    max_idx = i;
                }
            }
            sorted.push_back(max_entry);
            new_list.remove(max_idx);
        }

        // Keep top 3
        while sorted.len() > 3 {
            sorted.pop_back();
        }

        campaign.top_donors = sorted;
        env.storage().instance().set(&DataKey::Campaign, &campaign);
        env.storage().instance().extend_ttl(100_000, 100_000);
        
        campaign.total
    }

    pub fn get_campaign(env: Env) -> Campaign {
        env.storage()
            .instance()
            .get(&DataKey::Campaign)
            .expect("not initialized")
    }

    pub fn get_donor_amount(env: Env, donor: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Donor(donor))
            .unwrap_or(0)
    }
}
```

## Compilation Command
```powershell
$env:PATH += ";$env:USERPROFILE\.cargo\bin"
cargo build --manifest-path contract/Cargo.toml --target wasm32v1-none --release
```
