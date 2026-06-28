# Task 3 Brief: Build frontend library interface (src/lib/crowdfund.ts)

## Goal
Create `src/lib/crowdfund.ts` to manage interaction with the deployed Soroban crowdfunding smart contract, including campaign fetching, transaction construction, submission, and error classification.

## Files
- Create: `src/lib/crowdfund.ts`

## Requirements
The helper must export:
- `CONTRACT_ID`, `NETWORK_PASSPHRASE`, `RPC_URL`, `HORIZON_URL`.
- Interfaces: `TopDonor`, `Campaign`, `TxStatus`, `DonateError`.
- Functions:
  - `getCampaign()`: Uses transaction simulation via `soroban-rpc` to read campaign state.
  - `buildDonateXdr(donor, xlmAmount)`: Builds and prepares the transaction for cüzdan signing.
  - `submitSignedXdr(signedXdr)`: Submits the signed transaction to Soroban RPC and polls for finality.
  - `classifyError(err)`: Maps exceptions to one of three specified error types: `wallet_not_found`, `user_rejected`, `insufficient_balance`, or generic `network_error`.

## Verbatim Code
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
    return { type: "user_rejected", message: "Transaction rejected by user." };
  if (/insufficient|balance/i.test(msg))
    return { type: "insufficient_balance", message: "Insufficient balance to make donation." };
  return { type: "network_error", message: msg };
}
```
