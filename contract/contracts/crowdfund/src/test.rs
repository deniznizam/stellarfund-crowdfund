#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_crowdfund_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, CrowdfundContract);
    let client = CrowdfundContractClient::new(&env, &contract_id);

    let title = String::from_str(&env, "Test Campaign");
    let goal = 1000;

    // 1. Initialize
    client.initialize(&title, &goal);

    // Verify initialization state
    let campaign = client.get_campaign();
    assert_eq!(campaign.title, title);
    assert_eq!(campaign.goal, goal);
    assert_eq!(campaign.total, 0);
    assert_eq!(campaign.donor_count, 0);
    assert_eq!(campaign.top_donors.len(), 0);

    // 2. Fund from donor 1
    let donor1 = Address::generate(&env);
    let total_raised = client.fund(&donor1, &200);
    assert_eq!(total_raised, 200);
    assert_eq!(client.get_donor_amount(&donor1), 200);

    // Verify campaign state updated
    let campaign = client.get_campaign();
    assert_eq!(campaign.total, 200);
    assert_eq!(campaign.donor_count, 1);
    assert_eq!(campaign.top_donors.len(), 1);
    assert_eq!(campaign.top_donors.get(0).unwrap().address, donor1);
    assert_eq!(campaign.top_donors.get(0).unwrap().amount, 200);

    // 3. Fund from donor 2 (larger amount)
    let donor2 = Address::generate(&env);
    client.fund(&donor2, &500);

    // Verify donor 2 is top donor
    let campaign = client.get_campaign();
    assert_eq!(campaign.total, 700);
    assert_eq!(campaign.donor_count, 2);
    assert_eq!(campaign.top_donors.len(), 2);
    assert_eq!(campaign.top_donors.get(0).unwrap().address, donor2);
    assert_eq!(campaign.top_donors.get(0).unwrap().amount, 500);
    assert_eq!(campaign.top_donors.get(1).unwrap().address, donor1);

    // 4. Fund from donor 3
    let donor3 = Address::generate(&env);
    client.fund(&donor3, &100);

    // 5. Fund from donor 4 (should kick donor 3 out of top 3)
    let donor4 = Address::generate(&env);
    client.fund(&donor4, &300);

    let campaign = client.get_campaign();
    assert_eq!(campaign.donor_count, 4);
    assert_eq!(campaign.top_donors.len(), 3); // Capped at top 3
    
    // Top 3 should be: donor2 (500), donor4 (300), donor1 (200)
    assert_eq!(campaign.top_donors.get(0).unwrap().address, donor2);
    assert_eq!(campaign.top_donors.get(0).unwrap().amount, 500);
    assert_eq!(campaign.top_donors.get(1).unwrap().address, donor4);
    assert_eq!(campaign.top_donors.get(1).unwrap().amount, 300);
    assert_eq!(campaign.top_donors.get(2).unwrap().address, donor1);
    assert_eq!(campaign.top_donors.get(2).unwrap().amount, 200);
}
