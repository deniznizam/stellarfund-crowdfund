# StellarFund Crowdfunding Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a design-first crowdfunding page on Stellar Testnet (route `/fund`) with 3 milestones (25%, 50%, 100%), a Top 3 on-chain Leaderboard, a live Horizon Transaction Feed, and StellarWalletsKit multi-wallet integration.

**Architecture:** A Rust Soroban contract tracks campaign metadata, release milestones, and dynamically updates a top-3 donor vector on-chain. Next.js connects via StellarWalletsKit and updates its fluid SVG journey line by polling the contract and Horizon.

**Tech Stack:** Next.js 14, Tailwind CSS, Soroban SDK (v26), Stellar CLI (v27), `@creit-tech/stellar-wallets-kit`, `@stellar/stellar-sdk`

---

## Global Constraints
- Target network: Stellar Testnet
- Active workspace: `C:\Users\Monster\Projects\stellarfund-crowdfund`
- Word targets: `wasm32v1-none` for cargo builds (Rust 1.84+ compatible)
- Keep routing clean: SplitPay remains at `/`, Crowdfund page at `/fund`

---

## Tasks

### Task 1: Write and build the Soroban Smart Contract

**Files:**
- Create/Modify: `contract/contracts/crowdfund/src/lib.rs`
- Create/Modify: `contract/contracts/crowdfund/Cargo.toml`

**Interfaces:**
- Produces: `initialize(title: String, goal: i128)`, `fund(donor: Address, amount: i128) -> i128`, `get_campaign() -> Campaign`, `get_donor_amount(donor: Address) -> i128`

- [ ] **Step 1: Write smart contract code**
Replace the content of `contract/contracts/crowdfund/src/lib.rs` with:
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

- [ ] **Step 2: Build contract with wasm32v1-none**
Run:
```powershell
$env:PATH += ";$env:USERPROFILE\.cargo\bin"
cargo build --manifest-path contract/Cargo.toml --target wasm32v1-none --release
```
Expected: successful compilation and creation of `contract/target/wasm32v1-none/release/crowdfund.wasm`.

---

### Task 2: Deploy and Initialize Campaign

**Files:**
- Create: `contract/contract-id.txt`
- Modify: `.env.local`

- [ ] **Step 1: Deploy contract**
Run:
```powershell
$env:PATH += ";C:\stellar-cli"
stellar contract deploy --wasm contract/target/wasm32v1-none/release/crowdfund.wasm --source deployer --network testnet
```
Expected: `CDNOGV...` type contract ID is generated. Save it to `contract/contract-id.txt`.

- [ ] **Step 2: Initialize campaign**
Run:
```powershell
stellar contract invoke --id [CONTRACT_ID] --source deployer --network testnet -- initialize --title "StellarFund Campaign" --goal 1000000000
```
(Goal of 100 XLM = 1,000,000,000 Stroops)

- [ ] **Step 3: Save to env variables**
Update `.env.local` with the new ID:
```
NEXT_PUBLIC_CROWDFUND_CONTRACT_ID=[CONTRACT_ID]
```

- [ ] **Step 4: Commit**
```powershell
git add contract/ .env.local
git commit -m "feat: deploy and initialize crowdfund contract with leaderboard tracking"
```

---

### Task 3: Build frontend library interface (`src/lib/crowdfund.ts`)

**Files:**
- Create: `src/lib/crowdfund.ts`

- [ ] **Step 1: Write `src/lib/crowdfund.ts`**
Add helper methods for simulating `get_campaign`, preparing donation XDR, submitting to Soroban RPC, and classifying the 3 error types:
```typescript
import { Contract, nativeToScVal, scValToNative, Networks, TransactionBuilder, BASE_FEE } from "@stellar/stellar-sdk";
import { Server } from "@stellar/stellar-sdk/rpc";

export const CONTRACT_ID = process.env.NEXT_PUBLIC_CROWDFUND_CONTRACT_ID!;
export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const RPC_URL = "https://soroban-testnet.stellar.org";
export const HORIZON_URL = "https://horizon-testnet.stellar.org";

export type TopDonor = { address: string; amount: bigint };
export type Campaign = {
  title: string;
  goal: bigint;
  total: bigint;
  donor_count: number;
  top_donors: TopDonor[];
};
export type TxStatus = "idle" | "pending" | "success" | "error";
export type DonateError =
  | { type: "wallet_not_found"; message: string }
  | { type: "user_rejected"; message: string }
  | { type: "insufficient_balance"; message: string }
  | { type: "network_error"; message: string };

const DUMMY = "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M96VKTA365PFB";

export async function getCampaign(): Promise<Campaign> {
  const server = new Server(RPC_URL);
  const { Horizon } = await import("@stellar/stellar-sdk");
  const h = new Horizon.Server(HORIZON_URL);
  const account = await h.loadAccount(DUMMY);
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(new Contract(CONTRACT_ID).call("get_campaign"))
    .setTimeout(30).build();
  const sim = await server.simulateTransaction(tx);
  if ("error" in sim) throw new Error(String(sim.error));
  const raw = scValToNative((sim as any).result.retval);
  return {
    title: raw.title,
    goal: BigInt(raw.goal),
    total: BigInt(raw.total),
    donor_count: Number(raw.donor_count),
    top_donors: (raw.top_donors || []).map((d: any) => ({
      address: d.address,
      amount: BigInt(d.amount),
    })),
  };
}

export async function buildDonateXdr(donor: string, xlmAmount: number): Promise<string> {
  const { Horizon } = await import("@stellar/stellar-sdk");
  const account = await new Horizon.Server(HORIZON_URL).loadAccount(donor);
  const stroops = BigInt(Math.round(xlmAmount * 10_000_000));
  const tx = new TransactionBuilder(account, { fee: String(BASE_FEE * 10), networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(new Contract(CONTRACT_ID).call(
      "fund",
      nativeToScVal(donor, { type: "address" }),
      nativeToScVal(stroops, { type: "i128" })
    ))
    .setTimeout(30).build();
  const prepared = await new Server(RPC_URL).prepareTransaction(tx);
  return prepared.toXDR();
}

export async function submitSignedXdr(signedXdr: string): Promise<{ hash: string; explorerUrl: string }> {
  const { Transaction } = await import("@stellar/stellar-sdk");
  const server = new Server(RPC_URL);
  const result = await server.sendTransaction(new Transaction(signedXdr, NETWORK_PASSPHRASE));
  if (result.status === "ERROR") throw new Error("Transaction failed");
  const hash = result.hash;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 1500));
    const s = await server.getTransaction(hash);
    if (s.status === "SUCCESS") return { hash, explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}` };
    if (s.status === "FAILED") throw new Error("Transaction failed on chain");
  }
  throw new Error("Transaction timed out");
}

export function classifyError(err: unknown): DonateError {
  const msg = err instanceof Error ? err.message : String(err);
  if (/not installed|not found/i.test(msg))
    return { type: "wallet_not_found", message: "Selected wallet extension is not installed." };
  if (/reject|decline|cancel/i.test(msg))
    return { type: "user_rejected", message: "Transaction rejected." };
  if (/insufficient|balance/i.test(msg))
    return { type: "insufficient_balance", message: "Insufficient balance to make donation." };
  return { type: "network_error", message: msg };
}
```

---

### Task 4: Hook integration & wallets context (`src/hooks/useWallets.ts`)

**Files:**
- Create: `src/hooks/useWallets.ts`

- [ ] **Step 1: Write `src/hooks/useWallets.ts`**
Implement cüzdan modal logic with `StellarWalletsKit`:
```typescript
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  StellarWalletsKit, WalletNetwork,
  FREIGHTER_ID, XBULL_ID, LOBSTR_ID,
  FreighterModule, xBullModule, LobstrModule,
} from "@creit-tech/stellar-wallets-kit";
import { classifyError, type DonateError } from "@/lib/crowdfund";

export type WalletState = { publicKey: string | null; isConnecting: boolean; error: DonateError | null };

export function useWallets() {
  const kitRef = useRef<StellarWalletsKit | null>(null);
  const [state, setState] = useState<WalletState>({ publicKey: null, isConnecting: false, error: null });

  useEffect(() => {
    kitRef.current = new StellarWalletsKit({
      network: WalletNetwork.TESTNET,
      selectedWalletId: FREIGHTER_ID,
      modules: [new FreighterModule(), new xBullModule(), new LobstrModule()],
    });
  }, []);

  const openModal = useCallback(() => {
    setState(s => ({ ...s, error: null, isConnecting: true }));
    kitRef.current?.openModal({
      onWalletSelected: async (option) => {
        try {
          kitRef.current!.setWallet(option.id);
          const { address } = await kitRef.current!.getAddress();
          setState({ publicKey: address, isConnecting: false, error: null });
        } catch (err) {
          setState(s => ({ ...s, isConnecting: false, error: classifyError(err) }));
        }
      },
      onClosed: () => setState(s => ({ ...s, isConnecting: false })),
    });
  }, []);

  const disconnect = useCallback(() => setState({ publicKey: null, isConnecting: false, error: null }), []);

  const signXdr = useCallback(async (xdr: string): Promise<string> => {
    const { signedTxXdr } = await kitRef.current!.signTransaction(xdr, {
      networkPassphrase: WalletNetwork.TESTNET,
    });
    return signedTxXdr;
  }, []);

  return { ...state, openModal, disconnect, signXdr };
}
```

---

### Task 5: Build page structure with Fluid Milestone Journey UX

**Files:**
- Create: `src/components/CrowdfundPage.tsx`
- Create: `src/app/fund/page.tsx`

- [ ] **Step 1: Write `src/components/CrowdfundPage.tsx`**
Includes:
- Background neon grid & glowing paths.
- Progress visualization: SVG neon energy path connecting Milestone Portals:
  - Portal 1: %25 (Planlama)
  - Portal 2: %50 (Geliştirme)
  - Portal 3: %100 (Üretim)
- Dynamic Leaderboard table with Altın/Gümüş/Bronz tags.
- Dynamic Activity list updated by fetching transaction registry every 5 seconds.
- Multi-wallet connection button using `openModal` from `useWallets`.
- Action buttons & error feedback with 3 custom alert states.

- [ ] **Step 2: Create page route**
Link the component to `/fund` in `src/app/fund/page.tsx`.

- [ ] **Step 3: Commit**
```powershell
git add src/
git commit -m "feat: implement fluid milestone page, real-time activity feed, and multi-wallet UI"
```

---

### Task 6: Verify build & push to GitHub

- [ ] Check local build: `npm run build`
- [ ] Create remote repo and push to GitHub.
- [ ] Deploy to Vercel and write URL, deployed contract address, and transaction hash in README.md.
