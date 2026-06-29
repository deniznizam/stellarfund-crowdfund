#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_crowdfund_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, CrowdfundContract);
    let client = CrowdfundContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let title = String::from_str(&env, "Test Campaign");
    let goal = 1000;

    // 1. Initialize with owner
    client.initialize(&owner, &title, &goal);

    // Verify initial states
    let campaign = client.get_campaign();
    assert_eq!(campaign.title, title);
    assert_eq!(campaign.goal, goal);
    assert_eq!(campaign.owner, owner);
    assert_eq!(campaign.m1_claimed, false);
    assert_eq!(campaign.m2_claimed, false);
    assert_eq!(campaign.m3_claimed, false);

    // 2. Fund from donor 1 (20% of goal, 200 stroops)
    let donor1 = Address::generate(&env);
    client.fund(&donor1, &200);

    // Try claiming milestone 1 (Should fail since it's only 20%, target is 25%)
    let result = client.try_claim_milestone(&1);
    assert!(result.is_err());

    // 3. Fund another 100 stroops (total 300, 30% of goal)
    client.fund(&donor1, &100);

    // Claim milestone 1 (Should pass since total 300 >= 25% of 1000)
    client.claim_milestone(&1);
    let campaign = client.get_campaign();
    assert_eq!(campaign.m1_claimed, true);
    assert_eq!(campaign.m2_claimed, false);

    // Try claiming milestone 1 again (Should fail - already claimed)
    let result = client.try_claim_milestone(&1);
    assert!(result.is_err());
}
