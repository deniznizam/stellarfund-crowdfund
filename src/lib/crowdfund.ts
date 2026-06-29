import { Contract, nativeToScVal, scValToNative, Networks, TransactionBuilder, BASE_FEE, Account, Horizon, xdr } from "@stellar/stellar-sdk";
import { Server, Api } from "@stellar/stellar-sdk/rpc";

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
  owner: string;
  m1_claimed: boolean;
  m2_claimed: boolean;
  m3_claimed: boolean;
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
  const account = new Account(DUMMY, "0");
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(new Contract(CONTRACT_ID).call("get_campaign"))
    .setTimeout(30).build();
  
  const sim = await server.simulateTransaction(tx);
  if (Api.isSimulationError(sim)) throw new Error(sim.error);
  if (!Api.isSimulationSuccess(sim) || !sim.result) throw new Error("Simulation failed or no result");
  const raw = scValToNative(sim.result.retval);
  return {
    title: raw.title,
    goal: BigInt(raw.goal),
    total: BigInt(raw.total),
    donor_count: Number(raw.donor_count),
    top_donors: (raw.top_donors || []).map((d: { address: string; amount: string | number | bigint }) => ({
      address: d.address,
      amount: BigInt(d.amount),
    })),
    owner: raw.owner,
    m1_claimed: Boolean(raw.m1_claimed),
    m2_claimed: Boolean(raw.m2_claimed),
    m3_claimed: Boolean(raw.m3_claimed),
  };
}

export async function buildDonateXdr(donor: string, xlmAmount: number): Promise<string> {
  const account = await new Horizon.Server(HORIZON_URL).loadAccount(donor);
  const stroops = BigInt(Math.round(xlmAmount * 10_000_000));
  const tx = new TransactionBuilder(account, { fee: String(Number(BASE_FEE) * 10), networkPassphrase: NETWORK_PASSPHRASE })
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
  const server = new Server(RPC_URL);
  const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const result = await server.sendTransaction(tx);
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
  if (/freighter|xbull|lobstr|wallet|extension|not installed/i.test(msg))
    return { type: "wallet_not_found", message: "Selected wallet extension is not installed." };
  if (/reject|decline|cancel/i.test(msg))
    return { type: "user_rejected", message: "Transaction rejected by user." };
  if (/insufficient|balance/i.test(msg))
    return { type: "insufficient_balance", message: "Insufficient balance to make donation." };
  return { type: "network_error", message: msg };
}

export type ParsedTx = {
  id: string;
  hash: string;
  createdAt: string;
  functionName: string;
  donor: string;
  amount: number | null;
};

export async function getRecentTransactions(contractId: string): Promise<ParsedTx[]> {
  try {
    const res = await fetch(`${HORIZON_URL}/operations?order=desc&limit=100`);
    if (!res.ok) return [];
    const data = await res.json();
    const records = data._embedded?.records || [];
    
    const parsed: ParsedTx[] = [];
    for (const op of records) {
      if (op.type === "invoke_host_function" && op.parameters && op.parameters.length > 0) {
        try {
          const val = xdr.ScVal.fromXDR(op.parameters[0].value, "base64");
          const targetContract = scValToNative(val);
          if (targetContract === contractId) {
            const funcVal = xdr.ScVal.fromXDR(op.parameters[1].value, "base64");
            const functionName = scValToNative(funcVal);
            
            let donor = op.source_account;
            let amount: number | null = null;
            
            if (functionName === "fund" && op.parameters.length >= 4) {
              const donorVal = xdr.ScVal.fromXDR(op.parameters[2].value, "base64");
              donor = scValToNative(donorVal);
              
              const amtVal = xdr.ScVal.fromXDR(op.parameters[3].value, "base64");
              const amtStroops = scValToNative(amtVal);
              amount = Number(amtStroops) / 10_000_000;
            } else if (functionName === "initialize" && op.parameters.length >= 4) {
              const amtVal = xdr.ScVal.fromXDR(op.parameters[3].value, "base64");
              const amtStroops = scValToNative(amtVal);
              amount = Number(amtStroops) / 10_000_000;
            }
            
            parsed.push({
              id: op.id,
              hash: op.transaction_hash,
              createdAt: op.created_at,
              functionName,
              donor,
              amount,
            });
          }
        } catch {
          // Ignore invalid XDR
        }
      }
    }
    return parsed.slice(0, 5);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    return [];
  }
}
