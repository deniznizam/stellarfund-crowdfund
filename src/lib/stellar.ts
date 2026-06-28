import {
  isConnected,
  getAddress,
  requestAccess,
  signTransaction,
} from "@stellar/freighter-api";
import {
  Asset,
  BASE_FEE,
  Horizon,
  Memo,
  Networks,
  Operation,
  StrKey,
  TransactionBuilder,
} from "@stellar/stellar-sdk";

export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const EXPLORER_BASE = "https://stellar.expert/explorer/testnet";

const server = new Horizon.Server(HORIZON_URL);

export function isValidPublicKey(address: string): boolean {
  return StrKey.isValidEd25519PublicKey(address);
}

export function formatAddress(address: string, start = 4, end = 4): string {
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}…${address.slice(-end)}`;
}

export function getExplorerLink(hash: string, type: "tx" | "account" = "tx"): string {
  return `${EXPLORER_BASE}/${type}/${hash}`;
}

// ── Wallet ──────────────────────────────────────────────────────────

export async function connectWallet(): Promise<string> {
  const connectionCheck = await isConnected();
  if (!connectionCheck.isConnected) {
    throw new Error(
      "Freighter wallet is not installed. Please install it from freighter.app and refresh the page."
    );
  }
  const accessResult = await requestAccess();
  if (accessResult.error) {
    throw new Error(
      accessResult.error.message ?? "Wallet connection was rejected. Please approve Freighter."
    );
  }
  const address = accessResult.address;
  if (!address) throw new Error("Could not read a Stellar address from Freighter.");
  return address;
}

export async function checkWalletConnection(): Promise<string | null> {
  try {
    const connectionCheck = await isConnected();
    if (!connectionCheck.isConnected) return null;
    const { address, error } = await getAddress();
    if (error || !address) return null;
    return address;
  } catch {
    return null;
  }
}

// ── Balance ─────────────────────────────────────────────────────────

export async function getXlmBalance(publicKey: string): Promise<string> {
  const account = await server.loadAccount(publicKey);
  const native = account.balances.find((b) => b.asset_type === "native");
  return native?.balance ?? "0";
}

export async function fundTestnetAccount(publicKey: string): Promise<void> {
  const response = await fetch(
    `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
  );
  if (!response.ok) {
    throw new Error("Friendbot funding failed. Try again from Stellar Laboratory.");
  }
}

// ── Feature 6: Account existence check ──────────────────────────────

export async function checkAccountExists(address: string): Promise<boolean> {
  if (!isValidPublicKey(address)) return false;
  try {
    await server.loadAccount(address);
    return true;
  } catch {
    return false;
  }
}

// ── Feature 5: XLM → USD price ──────────────────────────────────────

export async function fetchXlmPrice(): Promise<number | null> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd",
      { next: { revalidate: 60 } } as RequestInit
    );
    if (!res.ok) return null;
    const data = await res.json() as { stellar?: { usd?: number } };
    return data?.stellar?.usd ?? null;
  } catch {
    return null;
  }
}

// ── Single payment ───────────────────────────────────────────────────

export type SendPaymentInput = {
  from: string;
  to: string;
  amount: string;
  memo?: string;
};

export type SendPaymentResult = {
  hash: string;
  explorerUrl: string;
};

export async function sendXlmPayment(input: SendPaymentInput): Promise<SendPaymentResult> {
  const { from, to, amount, memo } = input;

  if (!isValidPublicKey(to)) throw new Error("Recipient address is not a valid Stellar public key.");

  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) throw new Error("Amount must be greater than zero.");

  const sourceAccount = await server.loadAccount(from);
  const builder = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  }).addOperation(
    Operation.payment({ destination: to, asset: Asset.native(), amount: parsedAmount.toFixed(7) })
  );

  if (memo?.trim()) builder.addMemo(Memo.text(memo.trim().slice(0, 28)));

  const transaction = builder.setTimeout(30).build();
  const signed = await signTransaction(transaction.toXDR(), { networkPassphrase: NETWORK_PASSPHRASE });

  if ("error" in signed && signed.error) {
    throw new Error(signed.error.message ?? "Transaction signing was rejected in Freighter.");
  }

  const result = await server.submitTransaction(
    TransactionBuilder.fromXDR(signed.signedTxXdr, NETWORK_PASSPHRASE)
  );

  return { hash: result.hash, explorerUrl: getExplorerLink(result.hash) };
}

// ── Feature 7: Multi-op payment ─────────────────────────────────────

export type MultiPayEntry = {
  to: string;
  amount: string;
};

export async function sendMultiXlmPayment(input: {
  from: string;
  entries: MultiPayEntry[];
  memo?: string;
}): Promise<SendPaymentResult> {
  const { from, entries, memo } = input;

  if (entries.length === 0) throw new Error("No payment entries provided.");

  for (const entry of entries) {
    if (!isValidPublicKey(entry.to))
      throw new Error(`Invalid recipient address: ${formatAddress(entry.to, 4, 4)}`);
    const amt = Number(entry.amount);
    if (!Number.isFinite(amt) || amt <= 0)
      throw new Error("All amounts must be greater than zero.");
  }

  const sourceAccount = await server.loadAccount(from);
  // Fee scales linearly with operation count
  const totalFee = (BigInt(BASE_FEE) * BigInt(entries.length)).toString();

  const builder = new TransactionBuilder(sourceAccount, {
    fee: totalFee,
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  for (const entry of entries) {
    builder.addOperation(
      Operation.payment({
        destination: entry.to,
        asset: Asset.native(),
        amount: Number(entry.amount).toFixed(7),
      })
    );
  }

  if (memo?.trim()) builder.addMemo(Memo.text(memo.trim().slice(0, 28)));

  const transaction = builder.setTimeout(30).build();
  const signed = await signTransaction(transaction.toXDR(), { networkPassphrase: NETWORK_PASSPHRASE });

  if ("error" in signed && signed.error) {
    throw new Error(signed.error.message ?? "Transaction signing was rejected.");
  }

  const result = await server.submitTransaction(
    TransactionBuilder.fromXDR(signed.signedTxXdr, NETWORK_PASSPHRASE)
  );

  return { hash: result.hash, explorerUrl: getExplorerLink(result.hash) };
}
