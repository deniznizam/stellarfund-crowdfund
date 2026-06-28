# Task 2 Completion Report: Deploy and Initialize Campaign

## Overview
The Soroban crowdfund smart contract has been successfully deployed to the Stellar Testnet and initialized with the campaign parameters specified in the task brief.

## Deployment Details
- **WASM Hash:** `814a3f507271e8432f0e17688860de84a0870c85b4199f051127fd3ebdbc45e3`
- **Contract ID:** `CB7XVTKGOV6R3YG3C4J47Q6H4FHNOVO7MKNGW4HM3RHVDHQGZCCAITT3`
- **Source/Deployer Account:** `GBT5ZYMJIHL3D4XGIWQ2LUNF5J637BXAQUEI72UW7AAFP7N3IPMNCWAP`
- **Network:** Stellar Testnet

## Transactions
1. **WASM Upload Transaction:**
   - **Transaction Hash:** `3e83f57adda7fa90d1ad8231bb066dd7d53259c6f67287b750cd63fd576d84ea`
   - **Explorer Link:** [stellar.expert/tx/3e83f57adda7fa90d1ad8231bb066dd7d53259c6f67287b750cd63fd576d84ea](https://stellar.expert/explorer/testnet/tx/3e83f57adda7fa90d1ad8231bb066dd7d53259c6f67287b750cd63fd576d84ea)
2. **Contract Deployment Transaction:**
   - **Transaction Hash:** `d5191177537686bdbc171453e9ad73ebb403d4e71da73664aa72c8cb00a66308`
   - **Explorer Link:** [stellar.expert/tx/d5191177537686bdbc171453e9ad73ebb403d4e71da73664aa72c8cb00a66308](https://stellar.expert/explorer/testnet/tx/d5191177537686bdbc171453e9ad73ebb403d4e71da73664aa72c8cb00a66308)
   - **Stellar Lab Link:** [Stellar Lab Contract CB7XVTKGOV...](https://lab.stellar.org/r/testnet/contract/CB7XVTKGOV6R3YG3C4J47Q6H4FHNOVO7MKNGW4HM3RHVDHQGZCCAITT3)

## Initialization Details
The `initialize` function was invoked successfully on the contract with the following parameters:
- **Title:** `"StellarFund Campaign"`
- **Goal:** `1000000000` Stroops (equivalent to 100 XLM)
- **Initialize Transaction:**
  - **Transaction Hash:** `3c10ebaec1b4592c1cbe99fc719430de5e5d43da455f01a78c3558054096d963`
  - **Explorer Link:** [stellar.expert/tx/3c10ebaec1b4592c1cbe99fc719430de5e5d43da455f01a78c3558054096d963](https://stellar.expert/explorer/testnet/tx/3c10ebaec1b4592c1cbe99fc719430de5e5d43da455f01a78c3558054096d963)

## Verification & Environment Config
- The contract ID is saved in:
  - [contract-id.txt](file:///C:/Users/Monster/Projects/stellarfund-crowdfund/contract/contract-id.txt)
  - [.env.local](file:///C:/Users/Monster/Projects/stellarfund-crowdfund/.env.local) as `NEXT_PUBLIC_CROWDFUND_CONTRACT_ID=CB7XVTKGOV6R3YG3C4J47Q6H4FHNOVO7MKNGW4HM3RHVDHQGZCCAITT3`
