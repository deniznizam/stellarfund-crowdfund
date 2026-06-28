# Task 2 Brief: Deploy and Initialize Campaign

## Goal
Deploy the compiled `crowdfund.wasm` contract to Stellar Testnet and initialize it with campaign parameters.

## Deployment Details
- Source account: `deployer`
- Network: `testnet`
- Initial parameters:
  - Title: "StellarFund Campaign"
  - Goal: `1000000000` (Stroops, equivalent to 100 XLM)

## Outputs
- Deployed Contract ID saved to `contract/contract-id.txt`.
- Contract ID added to `.env.local` as `NEXT_PUBLIC_CROWDFUND_CONTRACT_ID`.
