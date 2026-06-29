// Advanced Crowdfunding Contract with Owner Milestone Claims
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
    pub owner: Address,
    pub m1_claimed: bool, // %25 claimed
    pub m2_claimed: bool, // %50 claimed
    pub m3_claimed: bool, // %100 claimed
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
    /// Kampanyayı başlatır. Çağıran adres kampanya sahibi (owner) olarak kaydedilir.
    pub fn initialize(env: Env, owner: Address, title: String, goal: i128) {
        if env.storage().instance().has(&DataKey::Campaign) {
            panic!("already initialized");
        }
        let campaign = Campaign {
            title,
            goal,
            total: 0,
            donor_count: 0,
            top_donors: Vec::new(&env),
            owner,
            m1_claimed: false,
            m2_claimed: false,
            m3_claimed: false,
        };
        env.storage().instance().set(&DataKey::Campaign, &campaign);
        env.storage().instance().extend_ttl(100_000, 100_000);
    }

    /// Bağış yapma fonksiyonu
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

        // Bireysel bağış miktarını kaydet
        env.storage()
            .persistent()
            .set(&DataKey::Donor(donor.clone()), &new_total);

        // Liderlik tablosunu güncelle
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

        // Liderlik tablosunu sırala (Azalan sırada)
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

        // İlk 3 bağışçıyı koru
        while sorted.len() > 3 {
            sorted.pop_back();
        }

        campaign.top_donors = sorted;
        env.storage().instance().set(&DataKey::Campaign, &campaign);
        env.storage().instance().extend_ttl(100_000, 100_000);
        
        campaign.total
    }

    /// Kampanya sahibinin (owner) aşama fonunu talep etmesini sağlar
    pub fn claim_milestone(env: Env, milestone_num: u32) {
        let mut campaign: Campaign = env
            .storage()
            .instance()
            .get(&DataKey::Campaign)
            .expect("not initialized");

        // İmza kontrolü (Sadece kampanya sahibi çekebilir)
        campaign.owner.require_auth();

        if milestone_num == 1 {
            if campaign.m1_claimed { panic!("already claimed"); }
            if campaign.total < (campaign.goal * 25 / 100) { panic!("goal target not met"); }
            campaign.m1_claimed = true;
        } else if milestone_num == 2 {
            if campaign.m2_claimed { panic!("already claimed"); }
            if campaign.total < (campaign.goal * 50 / 100) { panic!("goal target not met"); }
            campaign.m2_claimed = true;
        } else if milestone_num == 3 {
            if campaign.m3_claimed { panic!("already claimed"); }
            if campaign.total < campaign.goal { panic!("goal target not met"); }
            campaign.m3_claimed = true;
        } else {
            panic!("invalid milestone number");
        }

        env.storage().instance().set(&DataKey::Campaign, &campaign);
    }

    /// Kampanya durumunu okur
    pub fn get_campaign(env: Env) -> Campaign {
        env.storage()
            .instance()
            .get(&DataKey::Campaign)
            .expect("not initialized")
    }

    /// Bir bağışçının toplam bağış miktarını okur
    pub fn get_donor_amount(env: Env, donor: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Donor(donor))
            .unwrap_or(0)
    }
}

#[cfg(test)]
mod test;
