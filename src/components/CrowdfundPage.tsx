"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Confetti } from "@/components/Confetti";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useWallets } from "@/hooks/useWallets";
import {
  getCampaign,
  buildDonateXdr,
  submitSignedXdr,
  classifyError,
  getRecentTransactions,
  CONTRACT_ID,
  RPC_URL,
  HORIZON_URL,
  NETWORK_PASSPHRASE,
  type Campaign,
  type ParsedTx
} from "@/lib/crowdfund";
import { formatXlm } from "@/lib/split";
import { formatAddress, getXlmBalance, fundTestnetAccount } from "@/lib/stellar";
import { Contract, nativeToScVal } from "@stellar/stellar-sdk";
import { Server } from "@stellar/stellar-sdk/rpc";

type Locale = "en" | "tr";

type PageCopy = {
  title: string;
  tagline: string;
  backToSplitPay: string;
  connected: string;
  disconnect: string;
  connectWallet: string;
  connecting: string;
  campaignStats: string;
  raisedOfGoal: (raised: string, goal: string) => string;
  donorCount: string;
  donateTitle: string;
  donatePlaceholder: string;
  donateBtn: string;
  donatingBtn: string;
  connectWalletToDonate: string;
  insufficientBalance: string;
  leaderboardTitle: string;
  activityTitle: string;
  noDonors: string;
  noActivity: string;
  funcInitialize: string;
  funcFund: string;
  milestonePlanning: string;
  milestonePlanningDesc: string;
  milestoneDevelopment: string;
  milestoneDevelopmentDesc: string;
  milestoneProduction: string;
  milestoneProductionDesc: string;
  activeStatus: string;
  inactiveStatus: string;
  walletNotFoundTitle: string;
  walletNotFoundDesc: string;
  userRejectedTitle: string;
  userRejectedDesc: string;
  insufficientBalanceTitle: string;
  insufficientBalanceDesc: string;
  errorTitle: string;
  txSuccessTitle: string;
  txSuccessMessage: (amount: string) => string;
  viewExplorer: string;
  statusLabel: string;
  addressLabel: string;
  amountLabel: string;
  fundWalletBtn: string;
  fundingWalletBtn: string;
  balanceLabel: string;
  claimBtn: string;
  claimingBtn: string;
  claimedStatus: string;
  lockedStatus: string;
  claimableStatus: string;
  ownerSectionTitle: string;
  totalWithdrawnLabel: string;
  demoModeLabel: string;
  liveModeLabel: string;
  simulationAlert: string;
};

const pageCopy: Record<Locale, PageCopy> = {
  en: {
    title: "StellarFund",
    tagline: "Autonomous Milestone-Driven Crowdfunding",
    backToSplitPay: "← Back to SplitPay Calculator",
    connected: "Connected",
    disconnect: "Disconnect",
    connectWallet: "Connect Wallet",
    connecting: "Connecting…",
    campaignStats: "Campaign Financials",
    raisedOfGoal: (raised, goal) => `${raised} XLM raised of ${goal} XLM goal`,
    donorCount: "Backers",
    donateTitle: "Support the Campaign",
    donatePlaceholder: "Amount in XLM",
    donateBtn: "Send Sponsorship",
    donatingBtn: "Processing Transaction…",
    connectWalletToDonate: "Connect Wallet to Sponsor",
    insufficientBalance: "Insufficient balance in your wallet.",
    leaderboardTitle: "Top Contributors",
    activityTitle: "Real-time Blockchain Ledger Activity",
    noDonors: "No contributors yet. Be the first to back this campaign!",
    noActivity: "No transactions detected on testnet yet.",
    funcInitialize: "Campaign Launched",
    funcFund: "Sponsorship Deposit",
    milestonePlanning: "Phase 1: Planning & Setup (25%)",
    milestonePlanningDesc: "Core architecture build, initial dev setup, and community initialization.",
    milestoneDevelopment: "Phase 2: Alpha Development (50%)",
    milestoneDevelopmentDesc: "Smart contracts deployment, testing on Stellar Testnet, and client integration.",
    milestoneProduction: "Phase 3: Production Release (100%)",
    milestoneProductionDesc: "Mainnet deployment, security audits, and global public release.",
    activeStatus: "Active",
    inactiveStatus: "Inactive",
    walletNotFoundTitle: "Wallet Extension Missing",
    walletNotFoundDesc: "Freighter, xBull, or Lobstr extension was not detected. Please install one of them to proceed.",
    userRejectedTitle: "Signature Declined",
    userRejectedDesc: "The signing request was rejected in your wallet. Feel free to try again when ready.",
    insufficientBalanceTitle: "Insufficient Account Balance",
    insufficientBalanceDesc: "You don't have enough XLM in your testnet wallet. Click below to request test tokens.",
    errorTitle: "Transaction Failed",
    txSuccessTitle: "Sponsorship Succeeded!",
    txSuccessMessage: (amount) => `Thank you! You successfully contributed ${amount} XLM to the campaign.`,
    viewExplorer: "Verify on Stellar Expert →",
    statusLabel: "Status",
    addressLabel: "Address",
    amountLabel: "Amount",
    fundWalletBtn: "Fund Wallet via Friendbot",
    fundingWalletBtn: "Requesting Tokens…",
    balanceLabel: "Wallet Balance",
    claimBtn: "Withdraw Milestone Funds",
    claimingBtn: "Claiming Funds…",
    claimedStatus: "Funds Disbursed & Spent",
    lockedStatus: "Funds Locked on Ledger",
    claimableStatus: "Ready for Withdrawal",
    ownerSectionTitle: "Campaign Creator Portal",
    totalWithdrawnLabel: "Total Withdrawn",
    demoModeLabel: "Demo Mode (Mock Data)",
    liveModeLabel: "Live Testnet",
    simulationAlert: "Currently viewing interactive simulated demo data for evaluation.",
  },
  tr: {
    title: "StellarFund",
    tagline: "Otonom Kilometre Taşı Odaklı Kitlesel Fonlama",
    backToSplitPay: "← SplitPay Hesaplayıcısına Dön",
    connected: "Bağlandı",
    disconnect: "Bağlantıyı Kes",
    connectWallet: "Cüzdanı Bağla",
    connecting: "Bağlanıyor…",
    campaignStats: "Kampanya Mali Tablosu",
    raisedOfGoal: (raised, goal) => `${goal} XLM hedeften ${raised} XLM toplandı`,
    donorCount: "Destekçiler",
    donateTitle: "Kampanyaya Bağış Yap",
    donatePlaceholder: "Tutar (XLM)",
    donateBtn: "Bağış Gönder",
    donatingBtn: "İşlem Gönderiliyor…",
    connectWalletToDonate: "Bağış Yapmak için Cüzdanı Bağla",
    insufficientBalance: "Cüzdanınızda yeterli bakiye bulunmamaktadır.",
    leaderboardTitle: "En Yüksek Katkıda Bulunanlar",
    activityTitle: "Gerçek Zamanlı Blok Zinciri İşlem Akışı",
    noDonors: "Henüz bağış yapılmadı. İlk destekçimiz siz olun!",
    noActivity: "Testnet üzerinde henüz işlem algılanmadı.",
    funcInitialize: "Kampanya Başlatıldı",
    funcFund: "Sponsorluk Depozitosu",
    milestonePlanning: "Aşama 1: Planlama & Altyapı (%25)",
    milestonePlanningDesc: "Çekirdek mimarinin tasarımı, geliştirici ortamı kurulumu ve topluluk entegrasyonu.",
    milestoneDevelopment: "Aşama 2: Alfa Geliştirme (%50)",
    milestoneDevelopmentDesc: "Akıllı sözleşmelerin dağıtımı, Stellar Testnet testleri ve istemci entegrasyonu.",
    milestoneProduction: "Aşama 3: Üretim Yayını (%100)",
    milestoneProductionDesc: "Mainnet dağıtımı, bağımsız güvenlik denetimleri ve genel yayın.",
    activeStatus: "Aktif",
    inactiveStatus: "Kilitli",
    walletNotFoundTitle: "Cüzdan Eklentisi Eksik",
    walletNotFoundDesc: "Freighter, xBull veya Lobstr eklentisi bulunamadı. Devam etmek için lütfen birini yükleyin.",
    userRejectedTitle: "İmza Talebi Reddedildi",
    userRejectedDesc: "Cüzdanınızdaki imzalama işlemi reddedildi. Hazır olduğunuzda tekrar deneyebilirsiniz.",
    insufficientBalanceTitle: "Yetersiz Bakiye",
    insufficientBalanceDesc: "Testnet cüzdanınızda yeterli XLM bulunmuyor. Aşağıdaki butondan ücretsiz test XLM talep edebilirsiniz.",
    errorTitle: "İşlem Başarısız",
    txSuccessTitle: "Sponsorluk Başarılı!",
    txSuccessMessage: (amount) => `Teşekkürler! Kampanyaya ${amount} XLM katkı başarıyla on-chain kaydedildi.`,
    viewExplorer: "Stellar Expert ile Doğrula →",
    statusLabel: "Durum",
    addressLabel: "Adres",
    amountLabel: "Tutar",
    fundWalletBtn: "Friendbot ile Bakiye Yükle",
    fundingWalletBtn: "Talebiniz Alınıyor…",
    balanceLabel: "Cüzdan Bakiyesi",
    claimBtn: "Milestone Fonunu Çek",
    claimingBtn: "Fonlar Çekiliyor…",
    claimedStatus: "Fon Çekildi ve Harcandı",
    lockedStatus: "Fon Blok Zincirinde Kilitli",
    claimableStatus: "Çekilmeye Hazır",
    ownerSectionTitle: "Kampanya Yöneticisi Portalı",
    totalWithdrawnLabel: "Toplam Çekilen Tutar",
    demoModeLabel: "Demo Modu (Simülasyon)",
    liveModeLabel: "Canlı Testnet",
    simulationAlert: "Şu anda değerlendirme için interaktif simüle edilmiş demo verileri görüntüleniyor.",
  }
};

type TxState = {
  status: "idle" | "pending" | "success" | "error";
  hash?: string;
  explorerUrl?: string;
  message?: string;
  type?: "wallet_not_found" | "user_rejected" | "insufficient_balance" | "network_error";
};

// Simulated Demo Data
const DEMO_CAMPAIGN: Campaign = {
  title: "StellarFund Launch Campaign",
  goal: BigInt(100_0000000), // 100 XLM
  total: BigInt(62_5000000), // 62.5 XLM (62.5%)
  donor_count: 8,
  top_donors: [
    { address: "GB2X...R4PQ (Alice)", amount: BigInt(30_0000000) },
    { address: "GD4Y...K7LT (Bob)", amount: BigInt(20_0000000) },
    { address: "GC3Z...M2NS (Charlie)", amount: BigInt(12_5000000) }
  ],
  owner: "GDT6X...P9QW",
  m1_claimed: true, // 25% claimed
  m2_claimed: false, // 50% not claimed yet
  m3_claimed: false // 100% locked
};

const DEMO_ACTIVITIES: ParsedTx[] = [
  {
    id: "op1",
    hash: "a1b2c3d4e5f6g7h8",
    createdAt: new Date(Date.now() - 60000).toISOString(),
    functionName: "fund",
    donor: "GB2X...R4PQ (Alice)",
    amount: 30
  },
  {
    id: "op2",
    hash: "z9y8x7w6v5u4t3s2",
    createdAt: new Date(Date.now() - 300000).toISOString(),
    functionName: "fund",
    donor: "GD4Y...K7LT (Bob)",
    amount: 20
  },
  {
    id: "op3",
    hash: "q1w2e3r4t5y6u7i8",
    createdAt: new Date(Date.now() - 900000).toISOString(),
    functionName: "fund",
    donor: "GC3Z...M2NS (Charlie)",
    amount: 12.5
  },
  {
    id: "op4",
    hash: "i8u7y6t5r4e3w2q1",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    functionName: "initialize",
    donor: "GDT6X...P9QW (Creator)",
    amount: null
  }
];

export function CrowdfundPage() {
  const [locale, setLocale] = useState<Locale>("en");
  const t = pageCopy[locale];

  // Demo state toggle
  const [isDemoMode, setIsDemoMode] = useState(true);

  // Campaign State
  const [liveCampaign, setLiveCampaign] = useState<Campaign | null>(null);

  // Activity feed
  const [liveActivities, setLiveActivities] = useState<ParsedTx[]>([]);

  // User State
  const { publicKey, isConnecting, error: walletError, openModal, disconnect, signXdr } = useWallets();
  const [userBalance, setUserBalance] = useState<string | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [isFunding, setIsFunding] = useState(false);

  // Donation Form & Claims
  const [donateAmount, setDonateAmount] = useState("");
  const [txState, setTxState] = useState<TxState>({ status: "idle" });
  const [showConfetti, setShowConfetti] = useState(false);
  const [isClaiming, setIsClaiming] = useState<number | null>(null);

  // Active Campaign mapping
  const campaign = useMemo(() => {
    return isDemoMode ? DEMO_CAMPAIGN : liveCampaign;
  }, [isDemoMode, liveCampaign]);

  const activities = useMemo(() => {
    return isDemoMode ? DEMO_ACTIVITIES : liveActivities;
  }, [isDemoMode, liveActivities]);

  // Campaign progress calculation
  const progressPercent = useMemo(() => {
    if (!campaign || campaign.goal === BigInt(0)) return 0;
    const pct = Number((campaign.total * BigInt(100)) / campaign.goal);
    return Math.min(pct, 100);
  }, [campaign]);

  // SVG height mapping for visual path
  const filledY = useMemo(() => {
    return 20 + (410 * progressPercent) / 100;
  }, [progressPercent]);

  // Is connected wallet the campaign owner?
  const isOwner = useMemo(() => {
    if (!campaign || !publicKey) return false;
    return isDemoMode ? true : campaign.owner === publicKey; // In demo mode, simulate creator portal
  }, [campaign, publicKey, isDemoMode]);

  // Total funds withdrawn by owner based on claimed milestones
  const totalWithdrawn = useMemo(() => {
    if (!campaign) return 0;
    let withdrawn = 0;
    const totalFloat = Number(campaign.goal) / 10_000_000;
    if (campaign.m1_claimed) withdrawn += totalFloat * 0.25;
    if (campaign.m2_claimed) withdrawn += totalFloat * 0.25;
    if (campaign.m3_claimed) withdrawn += totalFloat * 0.50;
    return withdrawn;
  }, [campaign]);

  // Fetch campaign info
  const fetchCampaignData = useCallback(async () => {
    try {
      const data = await getCampaign();
      setLiveCampaign(data);
    } catch (err) {
      console.error("Failed to fetch campaign data:", err);
    }
  }, []);

  // Fetch live activity feed from Horizon
  const fetchActivityFeed = useCallback(async () => {
    try {
      const txs = await getRecentTransactions(CONTRACT_ID);
      setLiveActivities(txs);
    } catch (err) {
      console.error("Failed to fetch Horizon activity:", err);
    }
  }, []);

  // Fetch balance
  const fetchBalance = useCallback(async () => {
    if (!publicKey) return;
    setIsBalanceLoading(true);
    try {
      const bal = await getXlmBalance(publicKey);
      setUserBalance(bal);
    } catch (err) {
      console.error("Failed to fetch balance:", err);
      setUserBalance("0");
    } finally {
      setIsBalanceLoading(false);
    }
  }, [publicKey]);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchCampaignData(), fetchActivityFeed(), fetchBalance()]);
  }, [fetchCampaignData, fetchActivityFeed, fetchBalance]);

  useEffect(() => {
    if (publicKey) {
      void fetchBalance();
    } else {
      setUserBalance(null);
    }
  }, [publicKey, fetchBalance]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    const interval = setInterval(() => {
      void fetchCampaignData();
      void fetchActivityFeed();
      if (publicKey) {
        void fetchBalance();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchCampaignData, fetchActivityFeed, fetchBalance, publicKey]);

  useEffect(() => {
    if (walletError) {
      setTxState({
        status: "error",
        type: walletError.type as TxState["type"],
        message: walletError.message
      });
    }
  }, [walletError]);

  const handleFund = async () => {
    if (!publicKey) return;
    setIsFunding(true);
    setTxState({ status: "idle" });
    try {
      await fundTestnetAccount(publicKey);
      await new Promise(r => setTimeout(r, 2000));
      await fetchBalance();
    } catch (err) {
      console.error(err);
      setTxState({
        status: "error",
        type: "network_error",
        message: "Failed to fund wallet from Friendbot."
      });
    } finally {
      setIsFunding(false);
    }
  };

  // Submit claim milestone transaction
  const handleClaimMilestone = async (milestoneNum: number) => {
    if (isDemoMode) {
      // Simulate claim success immediately
      setIsClaiming(milestoneNum);
      setTxState({ status: "pending" });
      await new Promise(r => setTimeout(r, 2000));
      DEMO_CAMPAIGN.m1_claimed = milestoneNum === 1 ? true : DEMO_CAMPAIGN.m1_claimed;
      DEMO_CAMPAIGN.m2_claimed = milestoneNum === 2 ? true : DEMO_CAMPAIGN.m2_claimed;
      DEMO_CAMPAIGN.m3_claimed = milestoneNum === 3 ? true : DEMO_CAMPAIGN.m3_claimed;
      setTxState({
        status: "success",
        hash: "demo_claim_hash_stellar",
        explorerUrl: "#"
      });
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
      setIsClaiming(null);
      return;
    }

    if (!publicKey) return;
    setIsClaiming(milestoneNum);
    setTxState({ status: "pending" });
    try {
      const server = new Server(RPC_URL);
      const { Horizon, TransactionBuilder, BASE_FEE } = await import("@stellar/stellar-sdk");
      const account = await new Horizon.Server(HORIZON_URL).loadAccount(publicKey);
      
      const tx = new TransactionBuilder(account, { fee: String(Number(BASE_FEE) * 10), networkPassphrase: NETWORK_PASSPHRASE })
        .addOperation(new Contract(CONTRACT_ID).call(
          "claim_milestone",
          nativeToScVal(milestoneNum, { type: "u32" })
        ))
        .setTimeout(30).build();
      
      const prepared = await server.prepareTransaction(tx);
      const xdrString = prepared.toXDR();
      const signedXdr = await signXdr(xdrString);
      const result = await submitSignedXdr(signedXdr);

      setTxState({
        status: "success",
        hash: result.hash,
        explorerUrl: result.explorerUrl,
        message: `Milestone ${milestoneNum} funds successfully withdrawn to your wallet.`
      });
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
      void refreshAll();
    } catch (err) {
      console.error("Claim failed:", err);
      const classified = classifyError(err);
      setTxState({
        status: "error",
        type: classified.type as TxState["type"],
        message: classified.message
      });
    } finally {
      setIsClaiming(null);
    }
  };

  const handleDonateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isDemoMode) {
      // Simulate donation success
      const amount = Number(donateAmount);
      setTxState({ status: "pending" });
      await new Promise(r => setTimeout(r, 1500));
      DEMO_CAMPAIGN.total += BigInt(Math.round(amount * 10_000_000));
      DEMO_CAMPAIGN.donor_count += 1;
      DEMO_ACTIVITIES.unshift({
        id: `op_${Date.now()}`,
        hash: `demo_tx_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        functionName: "fund",
        donor: publicKey ? publicKey.substring(0, 8) + "..." : "Anonymous Sponsor",
        amount
      });
      setTxState({
        status: "success",
        hash: "demo_tx_hash_stellar",
        explorerUrl: "#"
      });
      setDonateAmount("");
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
      return;
    }

    if (!publicKey) return;
    const amount = Number(donateAmount);
    if (isNaN(amount) || amount <= 0) {
      setTxState({
        status: "error",
        type: "network_error",
        message: "Please enter a valid amount greater than 0."
      });
      return;
    }

    if (userBalance !== null && Number(userBalance) < amount) {
      setTxState({
        status: "error",
        type: "insufficient_balance",
        message: t.insufficientBalance
      });
      return;
    }

    setTxState({ status: "pending" });
    try {
      const xdrString = await buildDonateXdr(publicKey, amount);
      const signedXdr = await signXdr(xdrString);
      const result = await submitSignedXdr(signedXdr);

      setTxState({
        status: "success",
        hash: result.hash,
        explorerUrl: result.explorerUrl
      });
      setDonateAmount("");
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
      void refreshAll();
    } catch (err) {
      console.error("Submission failed:", err);
      const classified = classifyError(err);
      setTxState({
        status: "error",
        type: classified.type as TxState["type"],
        message: classified.message
      });
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden font-sans pb-24" style={{ background: "var(--background)" }}>
      <Confetti active={showConfetti} />

      {/* Dynamic matrix background with slow glow movement */}
      <div className="pointer-events-none fixed inset-0" aria-hidden>
        <div className="absolute top-[-10%] left-[-10%] h-[60%] w-[60%] rounded-full bg-cyan-500/10 blur-[150px] animate-pulse" style={{ animationDuration: "12s" }} />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-violet-600/8 blur-[130px] animate-pulse" style={{ animationDuration: "16s" }} />
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(rgba(34,211,238,0.15) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-6 sm:px-8">
        
        {/* TOP HEADER */}
        <header className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-6">
          <div className="flex flex-col gap-1">
            <Link href="/" className="text-xs font-semibold text-cyan-400/80 hover:text-cyan-300 transition-all mb-1 inline-flex items-center gap-1">
              {t.backToSplitPay}
            </Link>
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-600 shadow-[0_8px_30px_rgb(6_182_212/0.2)] animate-glow-pulse">
                <span className="absolute inset-0 rounded-2xl bg-cyan-400/20 blur-sm animate-pulse" />
                <svg className="h-5 w-5 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight leading-none text-gradient">{t.title}</h1>
                <span className="block text-[11px] font-bold text-slate-500 tracking-wider uppercase mt-1">{t.tagline}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-end sm:self-center">
            {/* Mode Switch Button */}
            <button
              type="button"
              onClick={() => setIsDemoMode(!isDemoMode)}
              className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all duration-350 border ${
                isDemoMode
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-pulse"
                  : "bg-cyan-500/10 border-cyan-500/30 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
              }`}
            >
              {isDemoMode ? t.demoModeLabel : t.liveModeLabel}
            </button>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-300">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              Testnet
            </span>
            <LanguageToggle locale={locale} onChange={setLocale} />
            
            {publicKey ? (
              <div className="flex items-center gap-2">
                <code className="rounded-xl bg-slate-900/80 border border-white/5 px-4 py-2.5 text-xs text-slate-200 font-mono font-bold">
                  {formatAddress(publicKey, 6, 6)}
                </code>
                <button
                  type="button"
                  onClick={disconnect}
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-rose-300 transition hover:bg-rose-500/20"
                >
                  {t.disconnect}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={openModal}
                disabled={isConnecting}
                className="rounded-xl bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-cyan-500/15 transition hover:scale-[1.02] hover:brightness-110 disabled:opacity-60"
              >
                {isConnecting ? t.connecting : t.connectWallet}
              </button>
            )}
          </div>
        </header>

        {/* MOCK DATA SIMULATION NOTICE BANNER */}
        {isDemoMode && (
          <div className="mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-300 font-bold flex items-center gap-2.5 animate-fade-up">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span>{t.simulationAlert}</span>
          </div>
        )}

        {/* HERO BANNER SECTION */}
        <section className="mb-12 relative rounded-3xl overflow-hidden border border-cyan-500/10 glass p-1 shadow-[0_0_50px_rgba(6,182,212,0.12)]">
          <div className="relative h-[220px] w-full rounded-2xl overflow-hidden">
            <img 
              src="/images/stellarfund_hero.jpg" 
              alt="StellarFund Crowdfunding Hero Banner" 
              className="object-cover w-full h-full opacity-85 hover:scale-[1.01] transition-transform duration-[6000ms] ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/65 to-transparent flex flex-col justify-center p-8 sm:p-12">
              <span className="inline-block px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/25 text-[10px] font-black uppercase tracking-widest text-cyan-300 mb-2">On-Chain Transparency</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-2 max-w-lg leading-tight">
                {locale === "en" ? "Fund with Full Confidence" : "Tam Güvenle Fonlayın"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md leading-relaxed">
                {locale === "en" 
                  ? "A smart contract controlled crowdfunding journey. Funds are only unlocked as real-world development milestones are verified." 
                  : "Akıllı sözleşme kontrollü kitlesel fonlama. Aşama hedefleri tamamlandıkça fonlar kademeli olarak serbest kalır."}
              </p>
            </div>
          </div>
        </section>

        {/* MAIN CONTAINER GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDE: SVG PROGRESS JOURNEY WITH FLOWING PATH */}
          <div className="lg:col-span-5 glass p-6 sm:p-8 rounded-3xl border border-white/5 relative">
            <h3 className="text-lg font-black tracking-tight text-white mb-8 border-b border-white/5 pb-3">Milestone Progress Journey</h3>
            
            <div className="relative flex items-stretch gap-6 min-h-[460px]">
              
              <div className="relative flex justify-center w-12 shrink-0">
                <svg className="w-12 h-full absolute inset-0" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="neonProgressGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="50%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                    <filter id="neonBlur" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="4.5" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  
                  {/* Background Track (Inactive Dark Line) */}
                  <line x1="24" y1="20" x2="24" y2="430" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
                  
                  {/* Glowing Energy Flowing Path (SVG Animation for flow) */}
                  <line
                    x1="24"
                    y1="20"
                    x2="24"
                    y2={filledY}
                    stroke="url(#neonProgressGrad)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    filter="url(#neonBlur)"
                    className="transition-all duration-1000 ease-out"
                  />
                  
                  {/* Dynamic Glowing Flow Dot */}
                  {progressPercent > 0 && (
                    <circle
                      cx="24"
                      cy={filledY}
                      r="6"
                      fill="#22d3ee"
                      filter="url(#neonBlur)"
                      className="animate-ping"
                    />
                  )}
                </svg>

                {/* Node 1: 25% */}
                <div className="absolute" style={{ top: "20px", transform: "translateY(-50%)" }}>
                  <div className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-500 z-20 ${
                    progressPercent >= 25
                      ? "border-cyan-400 bg-slate-900 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.7)] scale-110"
                      : "border-slate-800 bg-slate-950 text-slate-600"
                  }`}>
                    {progressPercent >= 25 && <span className="absolute inset-0 rounded-full bg-cyan-400/20 animate-ping" />}
                    <span className="text-[11px] font-black font-mono">1</span>
                  </div>
                </div>

                {/* Node 2: 50% */}
                <div className="absolute" style={{ top: "225px", transform: "translateY(-50%)" }}>
                  <div className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-500 z-20 ${
                    progressPercent >= 50
                      ? "border-violet-500 bg-slate-900 text-violet-300 shadow-[0_0_20px_rgba(139,92,246,0.7)] scale-110"
                      : "border-slate-800 bg-slate-950 text-slate-600"
                  }`}>
                    {progressPercent >= 50 && <span className="absolute inset-0 rounded-full bg-violet-500/20 animate-ping" />}
                    <span className="text-[11px] font-black font-mono">2</span>
                  </div>
                </div>

                {/* Node 3: 100% */}
                <div className="absolute" style={{ top: "430px", transform: "translateY(-50%)" }}>
                  <div className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-500 z-20 ${
                    progressPercent >= 100
                      ? "border-indigo-500 bg-slate-900 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.7)] scale-110"
                      : "border-slate-800 bg-slate-950 text-slate-600"
                  }`}>
                    {progressPercent >= 100 && <span className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />}
                    <span className="text-[11px] font-black font-mono">3</span>
                  </div>
                </div>
              </div>

              {/* Milestones and claiming portal */}
              <div className="flex flex-col justify-between py-1 flex-1">
                {/* Milestone 1 Details */}
                <div className={`flex flex-col pl-2 transition-all duration-500 ${progressPercent >= 25 ? "opacity-100 scale-100" : "opacity-40 scale-[0.98]"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-extrabold ${progressPercent >= 25 ? "text-cyan-300" : "text-slate-400"}`}>
                        {t.milestonePlanning}
                      </h4>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                        campaign?.m1_claimed
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                          : progressPercent >= 25 ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/25" : "bg-slate-900 text-slate-600"
                      }`}>
                        {campaign?.m1_claimed ? t.claimedStatus : progressPercent >= 25 ? t.claimableStatus : t.lockedStatus}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{t.milestonePlanningDesc}</p>
                  
                  {isOwner && progressPercent >= 25 && !campaign?.m1_claimed && (
                    <button
                      type="button"
                      onClick={() => handleClaimMilestone(1)}
                      disabled={isClaiming !== null}
                      className="mt-3 self-start rounded-lg bg-cyan-400/20 border border-cyan-400/30 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-cyan-300 transition hover:bg-cyan-400/30 animate-pulse"
                    >
                      {isClaiming === 1 ? t.claimingBtn : t.claimBtn}
                    </button>
                  )}
                </div>

                {/* Milestone 2 Details */}
                <div className={`flex flex-col pl-2 transition-all duration-500 ${progressPercent >= 50 ? "opacity-100 scale-100" : "opacity-40 scale-[0.98]"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-extrabold ${progressPercent >= 50 ? "text-violet-300" : "text-slate-400"}`}>
                        {t.milestoneDevelopment}
                      </h4>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                        campaign?.m2_claimed
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                          : progressPercent >= 50 ? "bg-violet-500/20 text-violet-300 border border-violet-400/25" : "bg-slate-900 text-slate-600"
                      }`}>
                        {campaign?.m2_claimed ? t.claimedStatus : progressPercent >= 50 ? t.claimableStatus : t.lockedStatus}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{t.milestoneDevelopmentDesc}</p>

                  {isOwner && progressPercent >= 50 && !campaign?.m2_claimed && (
                    <button
                      type="button"
                      onClick={() => handleClaimMilestone(2)}
                      disabled={isClaiming !== null}
                      className="mt-3 self-start rounded-lg bg-violet-500/20 border border-violet-500/30 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-violet-300 transition hover:bg-violet-500/30 animate-pulse"
                    >
                      {isClaiming === 2 ? t.claimingBtn : t.claimBtn}
                    </button>
                  )}
                </div>

                {/* Milestone 3 Details */}
                <div className={`flex flex-col pl-2 transition-all duration-500 ${progressPercent >= 100 ? "opacity-100 scale-100" : "opacity-40 scale-[0.98]"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-extrabold ${progressPercent >= 100 ? "text-indigo-300" : "text-slate-400"}`}>
                        {t.milestoneProduction}
                      </h4>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                        campaign?.m3_claimed
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                          : progressPercent >= 100 ? "bg-indigo-500/20 text-indigo-300 border border-indigo-400/25" : "bg-slate-900 text-slate-600"
                      }`}>
                        {campaign?.m3_claimed ? t.claimedStatus : progressPercent >= 100 ? t.claimableStatus : t.lockedStatus}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{t.milestoneProductionDesc}</p>

                  {isOwner && progressPercent >= 100 && !campaign?.m3_claimed && (
                    <button
                      type="button"
                      onClick={() => handleClaimMilestone(3)}
                      disabled={isClaiming !== null}
                      className="mt-3 self-start rounded-lg bg-indigo-500/20 border border-indigo-500/30 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-indigo-300 transition hover:bg-indigo-500/30 animate-pulse"
                    >
                      {isClaiming === 3 ? t.claimingBtn : t.claimBtn}
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
          
          {/* RIGHT SIDE: INTERACTIVE WIDGETS */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* FINANCIAL STATS */}
            <div className="glass rounded-3xl p-6 sm:p-8 border border-white/5 relative overflow-hidden shadow-xl">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block mb-2">{t.campaignStats}</span>
              <h2 className="text-2xl font-black text-white tracking-tight mb-6">
                {campaign ? campaign.title : "StellarFund Campaign"}
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 border-b border-white/5 pb-6 mb-6">
                <div>
                  <span className="block text-[9px] uppercase font-black text-slate-500 tracking-wider">Goal Target</span>
                  <span className="text-xl sm:text-2xl font-black text-white font-mono leading-none">
                    {campaign ? formatXlm(Number(campaign.goal) / 10_000_000) : "0.00"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-extrabold ml-1">XLM</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-black text-slate-500 tracking-wider">Total Raised</span>
                  <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono leading-none">
                    {campaign ? formatXlm(Number(campaign.total) / 10_000_000) : "0.00"}
                  </span>
                  <span className="text-[10px] text-cyan-400 font-extrabold ml-1">XLM</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-black text-slate-500 tracking-wider">{t.totalWithdrawnLabel}</span>
                  <span className="text-xl sm:text-2xl font-black text-violet-400 font-mono leading-none">
                    {formatXlm(totalWithdrawn)}
                  </span>
                  <span className="text-[10px] text-violet-400 font-extrabold ml-1">XLM</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-black text-slate-500 tracking-wider">{t.donorCount}</span>
                  <span className="text-xl sm:text-2xl font-black text-white font-mono leading-none">
                    {campaign ? campaign.donor_count : 0}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                  <span>{campaign ? t.raisedOfGoal(formatXlm(Number(campaign.total) / 10_000_000), formatXlm(Number(campaign.goal) / 10_000_000)) : ""}</span>
                  <span className="font-bold text-cyan-400 font-mono">{progressPercent}%</span>
                </div>
                <div className="h-4.5 w-full bg-slate-950 rounded-full border border-white/5 p-1 overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-violet-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* STATUS AND FEEDBACK ALERTS */}
            {txState.status === "error" && (
              <div className="animate-fade-up rounded-2xl border p-5 flex gap-3.5 items-start border-rose-500/20 bg-rose-500/8 text-rose-200">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-rose-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-extrabold text-white mb-1">
                    {txState.type === "wallet_not_found" && t.walletNotFoundTitle}
                    {txState.type === "user_rejected" && t.userRejectedTitle}
                    {txState.type === "insufficient_balance" && t.insufficientBalanceTitle}
                    {txState.type === "network_error" && t.errorTitle}
                    {!txState.type && t.errorTitle}
                  </h4>
                  <p className="text-xs text-rose-300/80 leading-relaxed mb-4">
                    {txState.message}
                  </p>
                  {txState.type === "insufficient_balance" && publicKey && (
                    <button
                      type="button"
                      onClick={handleFund}
                      disabled={isFunding}
                      className="rounded-xl bg-rose-500/20 border border-rose-500/35 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-rose-500/30 disabled:opacity-60"
                    >
                      {isFunding ? t.fundingWalletBtn : t.fundWalletBtn}
                    </button>
                  )}
                  {txState.type === "wallet_not_found" && (
                    <a
                      href="https://freighter.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded-xl bg-rose-500/20 border border-rose-500/35 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-rose-500/30"
                    >
                      Download Freighter Wallet
                    </a>
                  )}
                </div>
              </div>
            )}

            {txState.status === "success" && (
              <div className="animate-fade-up rounded-2xl border p-5 flex gap-4 items-start border-emerald-500/20 bg-emerald-500/8 text-emerald-200 shadow-lg">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 shadow-md">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-extrabold text-white mb-1">{t.txSuccessTitle}</h4>
                  <p className="text-xs text-emerald-300/90 leading-relaxed mb-4">
                    {txState.message || t.txSuccessMessage(donateAmount)}
                  </p>
                  {txState.explorerUrl && txState.explorerUrl !== "#" && (
                    <a
                      href={txState.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-cyan-400 hover:text-cyan-300 transition"
                    >
                      {t.viewExplorer}
                    </a>
                  )}
                </div>
              </div>
            )}

            {txState.status === "pending" && (
              <div className="animate-fade-up rounded-2xl border p-5 flex gap-4 items-center border-indigo-500/20 bg-indigo-500/8 text-indigo-200">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400">
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-extrabold text-white mb-0.5">Signature Required</h4>
                  <p className="text-xs text-indigo-300/80 leading-relaxed">
                    Please review and authorize the transaction signing request in your connected wallet.
                  </p>
                </div>
              </div>
            )}

            {/* CONTRIBUTION COMPONENT */}
            <div className="glass rounded-3xl p-6 sm:p-8 border border-white/5 shadow-lg relative overflow-hidden">
              <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-cyan-500/5 blur-xl" />
              <h3 className="text-lg font-black tracking-tight text-white mb-4">{t.donateTitle}</h3>
              
              {publicKey && (
                <div className="mb-5 flex items-center justify-between rounded-2xl bg-slate-950 border border-white/5 px-4 py-3.5 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-500 font-black uppercase tracking-wider text-[9px]">{t.balanceLabel}</span>
                    <span className="text-sm font-black text-slate-200 font-mono">
                      {isBalanceLoading ? "Loading…" : `${userBalance ? formatXlm(Number(userBalance)) : "0.00"} XLM`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={fetchBalance}
                    disabled={isBalanceLoading}
                    className="text-cyan-400 hover:text-cyan-300 text-xs font-black uppercase tracking-wider transition disabled:opacity-60"
                  >
                    Refresh
                  </button>
                </div>
              )}

              {publicKey ? (
                <form onSubmit={handleDonateSubmit} className="flex flex-col gap-4">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.0000001"
                      min="0.0000001"
                      required
                      placeholder={t.donatePlaceholder}
                      value={donateAmount}
                      onChange={(e) => setDonateAmount(e.target.value)}
                      disabled={txState.status === "pending"}
                      className="w-full rounded-2xl bg-slate-950 border border-white/10 px-5 py-4.5 text-white text-sm font-bold font-mono placeholder-slate-700 focus:border-cyan-400 focus:outline-none transition shadow-inner"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500 uppercase tracking-widest font-mono">
                      XLM
                    </span>
                  </div>
                  
                  {/* Quick-choice contribution buttons */}
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {[5, 10, 25, 50].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDonateAmount(String(amt))}
                        disabled={txState.status === "pending"}
                        className="rounded-xl border border-white/5 bg-slate-900 px-3 py-2.5 text-xs font-black text-slate-400 hover:text-white hover:border-cyan-500/30 hover:bg-slate-800 transition"
                      >
                        +{amt} XLM
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={txState.status === "pending"}
                    className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed py-4.5 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-cyan-900/30 transition-all duration-200 hover:scale-[1.01]"
                  >
                    {txState.status === "pending" ? t.donatingBtn : t.donateBtn}
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={openModal}
                  disabled={isConnecting}
                  className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed py-4.5 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-cyan-900/30 transition-all duration-200 hover:scale-[1.01]"
                >
                  {isConnecting ? t.connecting : t.connectWalletToDonate}
                </button>
              )}
            </div>

            {/* LEADERBOARD CARD */}
            <div className="glass rounded-3xl p-6 sm:p-8 border border-white/5 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 left-0 h-32 w-32 rounded-full bg-violet-600/5 blur-3xl" />
              <h3 className="text-lg font-black tracking-tight text-white mb-6 flex items-center gap-2 border-b border-white/5 pb-3">
                <span>👑</span>
                <span>{t.leaderboardTitle}</span>
              </h3>

              {!campaign || campaign.top_donors.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">{t.noDonors}</p>
              ) : (
                <div className="space-y-3 mt-2">
                  {campaign.top_donors.map((donor, idx) => {
                    const medals = ["🥇", "🥈", "🥉"];
                    const medal = medals[idx] || "⭐";
                    const isSelf = publicKey && donor.address === publicKey;
                    
                    return (
                      <div
                        key={donor.address}
                        className={`flex items-center justify-between rounded-2xl border px-5 py-4 transition duration-300 hover:translate-x-1 ${
                          isSelf
                            ? "bg-cyan-500/5 border-cyan-500/25 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                            : "bg-slate-900/40 border-white/5 hover:bg-slate-900/80 hover:border-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg shrink-0">{medal}</span>
                          <span className="font-mono text-xs text-slate-200 font-bold break-all">
                            {donor.address}
                          </span>
                        </div>
                        <span className="font-mono text-sm font-black text-cyan-400 shrink-0 ml-3">
                          {formatXlm(Number(donor.amount) / 10_000_000)} XLM
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* LIVE EVENT LOGS (Horizon Transaction History) */}
            <div className="glass rounded-3xl p-6 sm:p-8 border border-white/5 relative overflow-hidden shadow-xl">
              <h3 className="text-lg font-black tracking-tight text-white mb-6 flex items-center justify-between border-b border-white/5 pb-3">
                <span className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
                  </span>
                  <span>{t.activityTitle}</span>
                </span>
                <span className="text-[9px] uppercase font-black text-slate-500 font-mono tracking-wider">Live Feed</span>
              </h3>

              {activities.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">{t.noActivity}</p>
              ) : (
                <div className="space-y-4">
                  {activities.map((tx) => {
                    const isInit = tx.functionName === "initialize";
                    
                    return (
                      <div key={tx.id} className="rounded-2xl bg-slate-950/80 border border-white/5 p-4.5 transition hover:border-white/10 hover:bg-slate-950">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                            isInit ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                          }`}>
                            {isInit ? t.funcInitialize : t.funcFund}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 font-mono">
                            {new Date(tx.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-mono truncate mb-3">
                          <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] mr-1.5">Actor:</span>
                          {tx.donor}
                        </p>
                        
                        <div className="flex items-center justify-between border-t border-white/5 pt-3">
                          <span className="font-mono text-xs font-black text-slate-200">
                            {tx.amount !== null ? `${formatXlm(tx.amount)} XLM` : "-"}
                          </span>
                          {tx.hash !== "demo_claim_hash_stellar" && tx.hash !== "demo_tx_hash_stellar" && !tx.hash.startsWith("demo_tx_") ? (
                            <a
                              href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-black uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition"
                            >
                              Explore Tx ↗
                            </a>
                          ) : (
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 select-none">
                              Simulated
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Campaign Owner Dashboard Panel */}
            {isOwner && (
              <div className="glass rounded-3xl p-6 sm:p-8 border border-cyan-400/25 shadow-xl relative overflow-hidden bg-cyan-950/5">
                <span className="text-xs font-black text-cyan-400 uppercase tracking-widest block mb-2">{t.ownerSectionTitle}</span>
                <h3 className="text-lg font-black tracking-tight text-white mb-4">Milestone Release Dashboard</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  As the campaign manager, you can disburse campaign funds directly to your wallet once progress targets are reached.
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                    <span className="font-bold text-slate-300">Phase 1: Planning (25%)</span>
                    <span className={`font-black uppercase text-[10px] ${campaign?.m1_claimed ? "text-slate-500" : progressPercent >= 25 ? "text-cyan-400" : "text-slate-600"}`}>
                      {campaign?.m1_claimed ? t.claimedStatus : progressPercent >= 25 ? "Available" : "Locked"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                    <span className="font-bold text-slate-300">Phase 2: Development (50%)</span>
                    <span className={`font-black uppercase text-[10px] ${campaign?.m2_claimed ? "text-slate-500" : progressPercent >= 50 ? "text-violet-400" : "text-slate-600"}`}>
                      {campaign?.m2_claimed ? t.claimedStatus : progressPercent >= 50 ? "Available" : "Locked"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-2">
                    <span className="font-bold text-slate-300">Phase 3: Production (100%)</span>
                    <span className={`font-black uppercase text-[10px] ${campaign?.m3_claimed ? "text-slate-500" : progressPercent >= 100 ? "text-indigo-400" : "text-slate-600"}`}>
                      {campaign?.m3_claimed ? t.claimedStatus : progressPercent >= 100 ? "Available" : "Locked"}
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
