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
  type Campaign,
  type ParsedTx
} from "@/lib/crowdfund";
import { formatXlm } from "@/lib/split";
import { formatAddress, getXlmBalance, fundTestnetAccount } from "@/lib/stellar";

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
};

const pageCopy: Record<Locale, PageCopy> = {
  en: {
    title: "StellarFund",
    tagline: "Fluid Milestone-Driven Crowdfunding",
    backToSplitPay: "← Back to SplitPay Calculator",
    connected: "Connected",
    disconnect: "Disconnect",
    connectWallet: "Connect Wallet",
    connecting: "Connecting…",
    campaignStats: "Campaign Stats",
    raisedOfGoal: (raised, goal) => `${raised} XLM raised of ${goal} XLM goal`,
    donorCount: "Backers",
    donateTitle: "Sponsor Project",
    donatePlaceholder: "Amount in XLM",
    donateBtn: "Sponsor Campaign",
    donatingBtn: "Processing Sponsorship…",
    connectWalletToDonate: "Connect Wallet to Sponsor",
    insufficientBalance: "Insufficient balance in your wallet.",
    leaderboardTitle: "Top Sponsors",
    activityTitle: "Live Horizon Activity Feed",
    noDonors: "No sponsors yet. Be the first to back this project!",
    noActivity: "No network transactions found yet.",
    funcInitialize: "Campaign Created",
    funcFund: "Sponsorship Contribution",
    milestonePlanning: "Planning (25%)",
    milestonePlanningDesc: "Core architecture design, initial developer setup, and community alignment.",
    milestoneDevelopment: "Development (50%)",
    milestoneDevelopmentDesc: "Smart contract implementation, testing on Testnet, and client integration.",
    milestoneProduction: "Production (100%)",
    milestoneProductionDesc: "Mainnet deployment, security audits, and public release.",
    activeStatus: "Active",
    inactiveStatus: "Inactive",
    walletNotFoundTitle: "Wallet Extension Not Found",
    walletNotFoundDesc: "Freighter, xBull, or Lobstr extension was not detected. Please install one of them to proceed.",
    userRejectedTitle: "Transaction Cancelled",
    userRejectedDesc: "The signing request was rejected in your wallet. You can try again when ready.",
    insufficientBalanceTitle: "Insufficient Account Balance",
    insufficientBalanceDesc: "You don't have enough XLM in your testnet wallet. You can fund it using Friendbot.",
    errorTitle: "Transaction Error",
    txSuccessTitle: "Sponsorship Succeeded!",
    txSuccessMessage: (amount) => `Thank you! You successfully donated ${amount} XLM to the crowdfunding campaign.`,
    viewExplorer: "View on Stellar Expert →",
    statusLabel: "Status",
    addressLabel: "Address",
    amountLabel: "Amount",
    fundWalletBtn: "Get Free Test XLM",
    fundingWalletBtn: "Funding Account…",
    balanceLabel: "Wallet Balance",
  },
  tr: {
    title: "StellarFund",
    tagline: "Akıcı Kilometre Taşı Odaklı Kitlesel Fonlama",
    backToSplitPay: "← SplitPay Hesaplayıcısına Dön",
    connected: "Bağlandı",
    disconnect: "Bağlantıyı Kes",
    connectWallet: "Cüzdanı Bağla",
    connecting: "Bağlanıyor…",
    campaignStats: "Kampanya İstatistikleri",
    raisedOfGoal: (raised, goal) => `${goal} XLM hedeften ${raised} XLM toplandı`,
    donorCount: "Destekçiler",
    donateTitle: "Projeye Destek Ol",
    donatePlaceholder: "Tutar (XLM)",
    donateBtn: "Kampanyayı Destekle",
    donatingBtn: "Destek İşleniyor…",
    connectWalletToDonate: "Destek Olmak için Cüzdanı Bağla",
    insufficientBalance: "Cüzdanınızda yetersiz bakiye var.",
    leaderboardTitle: "En İyi Destekçiler",
    activityTitle: "Canlı Horizon Aktivite Akışı",
    noDonors: "Henüz destekçi yok. Bu projeye ilk destek olan siz olun!",
    noActivity: "Henüz ağ işlemi bulunamadı.",
    funcInitialize: "Kampanya Oluşturuldu",
    funcFund: "Sponsorluk Katkısı",
    milestonePlanning: "Planlama (%25)",
    milestonePlanningDesc: "Temel mimari tasarımı, ilk geliştirici kurulumu ve topluluk uyumu.",
    milestoneDevelopment: "Geliştirme (%50)",
    milestoneDevelopmentDesc: "Akıllı sözleşme uygulaması, Testnet testleri ve istemci entegrasyonu.",
    milestoneProduction: "Üretim (%100)",
    milestoneProductionDesc: "Mainnet dağıtımı, güvenlik denetimleri ve genel yayın.",
    activeStatus: "Aktif",
    inactiveStatus: "Aktif Değil",
    walletNotFoundTitle: "Cüzdan Eklentisi Bulunamadı",
    walletNotFoundDesc: "Freighter, xBull veya Lobstr eklentisi tespit edilemedi. Devam etmek için lütfen birini yükleyin.",
    userRejectedTitle: "İşlem İptal Edildi",
    userRejectedDesc: "Cüzdanınızdaki imzalama talebi reddedildi. Hazır olduğunuzda tekrar deneyebilirsiniz.",
    insufficientBalanceTitle: "Yetersiz Hesap Bakiyesi",
    insufficientBalanceDesc: "Testnet cüzdanınızda yeterli XLM bulunmuyor. Friendbot ile bakiye yükleyebilirsiniz.",
    errorTitle: "İşlem Hatası",
    txSuccessTitle: "Sponsorluk Başarılı!",
    txSuccessMessage: (amount) => `Teşekkürler! Kitlesel fonlama kampanyasına ${amount} XLM başarıyla bağışladınız.`,
    viewExplorer: "Stellar Expert'te Görüntüle →",
    statusLabel: "Durum",
    addressLabel: "Adres",
    amountLabel: "Tutar",
    fundWalletBtn: "Bedava Test XLM Al",
    fundingWalletBtn: "Bakiye Yükleniyor…",
    balanceLabel: "Cüzdan Bakiyesi",
  }
};

type TxState = {
  status: "idle" | "pending" | "success" | "error";
  hash?: string;
  explorerUrl?: string;
  message?: string;
  type?: "wallet_not_found" | "user_rejected" | "insufficient_balance" | "network_error";
};

export function CrowdfundPage() {
  const [locale, setLocale] = useState<Locale>("en");
  const t = pageCopy[locale];

  // Campaign State
  const [campaign, setCampaign] = useState<Campaign | null>(null);

  // Activity feed
  const [activities, setActivities] = useState<ParsedTx[]>([]);

  // User State
  const { publicKey, isConnecting, error: walletError, openModal, disconnect, signXdr } = useWallets();
  const [userBalance, setUserBalance] = useState<string | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [isFunding, setIsFunding] = useState(false);

  // Donation Form
  const [donateAmount, setDonateAmount] = useState("");
  const [txState, setTxState] = useState<TxState>({ status: "idle" });
  const [showConfetti, setShowConfetti] = useState(false);

  // Campaign progress calculation
  const progressPercent = useMemo(() => {
    if (!campaign || campaign.goal === BigInt(0)) return 0;
    const pct = Number((campaign.total * BigInt(100)) / campaign.goal);
    return Math.min(pct, 100);
  }, [campaign]);

  // SVG height mapping for visual path
  const filledY = useMemo(() => {
    // 20px padding at top, 410px total line travel to bottom y=430
    return 20 + (410 * progressPercent) / 100;
  }, [progressPercent]);

  // Fetch campaign info
  const fetchCampaignData = useCallback(async () => {
    try {
      const data = await getCampaign();
      setCampaign(data);
    } catch (err) {
      console.error("Failed to fetch campaign data:", err);
    }
  }, []);

  // Fetch live activity feed from Horizon
  const fetchActivityFeed = useCallback(async () => {
    try {
      const txs = await getRecentTransactions(CONTRACT_ID);
      setActivities(txs);
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

  // Trigger balance fetch when wallet public key changes
  useEffect(() => {
    if (publicKey) {
      void fetchBalance();
    } else {
      setUserBalance(null);
    }
  }, [publicKey, fetchBalance]);

  // Initial load
  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  // Polling every 5 seconds
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

  // Watch hook-level wallet errors and classify them
  useEffect(() => {
    if (walletError) {
      setTxState({
        status: "error",
        type: walletError.type as TxState["type"],
        message: walletError.message
      });
    }
  }, [walletError]);

  // Handle funding
  const handleFund = async () => {
    if (!publicKey) return;
    setIsFunding(true);
    setTxState({ status: "idle" });
    try {
      await fundTestnetAccount(publicKey);
      // Wait for ledger update
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

  // Submit Donation
  const handleDonateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // Refresh immediately
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
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--background)" }}>
      <Confetti active={showConfetti} />

      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0" aria-hidden>
        <div className="absolute top-0 left-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-violet-500/6 blur-[100px]" />
        <div className="absolute inset-0 opacity-40"
          style={{ backgroundImage: "radial-gradient(rgba(148,163,184,0.08) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-6 pb-20 sm:px-6 sm:pt-8">
        
        {/* HEADER NAVBAR */}
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <Link href="/" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors mb-1 inline-block">
              {t.backToSplitPay}
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 shadow-lg shadow-cyan-900/40">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight leading-none text-gradient">{t.title}</h1>
                <span className="block text-[10px] text-slate-500 leading-none mt-0.5">{t.tagline}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/25 bg-cyan-400/8 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Testnet
            </span>
            <LanguageToggle locale={locale} onChange={setLocale} />
            
            {publicKey ? (
              <div className="flex items-center gap-2">
                <code className="rounded-lg bg-white/5 border border-white/5 px-3 py-2 text-xs text-slate-300 font-mono">
                  {formatAddress(publicKey, 6, 6)}
                </code>
                <button
                  type="button"
                  onClick={disconnect}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5"
                >
                  {t.disconnect}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={openModal}
                disabled={isConnecting}
                className="rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isConnecting ? t.connecting : t.connectWallet}
              </button>
            )}
          </div>
        </header>

        {/* MAIN LAYOUT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: SVG VERTICAL PROGRESS Timeline */}
          <div className="lg:col-span-5 glass p-6 sm:p-8 rounded-3xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-6">Milestone Journey</h3>
            
            <div className="relative flex items-stretch gap-6 min-h-[460px]">
              
              {/* SVG Glowing Track */}
              <div className="relative flex justify-center w-12 shrink-0">
                <svg className="w-12 h-full absolute inset-0" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="neonProgressGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="50%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                    <filter id="neonBlur" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  
                  {/* Background Track (Dim) */}
                  <line x1="24" y1="20" x2="24" y2="430" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
                  
                  {/* Filled Glowing Track */}
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
                </svg>

                {/* Milestone Node 1: Planning (25%) */}
                <div
                  className="absolute"
                  style={{ top: "20px", transform: "translateY(-50%)" }}
                >
                  <div className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-500 z-20 ${
                    progressPercent >= 25
                      ? "border-cyan-400 bg-slate-900 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.6)]"
                      : "border-slate-800 bg-slate-950 text-slate-600"
                  }`}>
                    {progressPercent >= 25 && (
                      <span className="absolute inset-0 rounded-full bg-cyan-400/20 animate-ping" />
                    )}
                    <span className="text-[10px] font-bold">1</span>
                  </div>
                </div>

                {/* Milestone Node 2: Development (50%) */}
                <div
                  className="absolute"
                  style={{ top: "225px", transform: "translateY(-50%)" }}
                >
                  <div className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-500 z-20 ${
                    progressPercent >= 50
                      ? "border-violet-500 bg-slate-900 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.6)]"
                      : "border-slate-800 bg-slate-950 text-slate-600"
                  }`}>
                    {progressPercent >= 50 && (
                      <span className="absolute inset-0 rounded-full bg-violet-500/20 animate-ping" />
                    )}
                    <span className="text-[10px] font-bold">2</span>
                  </div>
                </div>

                {/* Milestone Node 3: Production (100%) */}
                <div
                  className="absolute"
                  style={{ top: "430px", transform: "translateY(-50%)" }}
                >
                  <div className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-500 z-20 ${
                    progressPercent >= 100
                      ? "border-indigo-500 bg-slate-900 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.6)]"
                      : "border-slate-800 bg-slate-950 text-slate-600"
                  }`}>
                    {progressPercent >= 100 && (
                      <span className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
                    )}
                    <span className="text-[10px] font-bold">3</span>
                  </div>
                </div>
              </div>

              {/* Milestone Details */}
              <div className="flex flex-col justify-between py-1 flex-1">
                {/* Milestone 1 Description */}
                <div className={`flex flex-col pl-2 transition-all duration-500 ${progressPercent >= 25 ? "opacity-100" : "opacity-45"}`}>
                  <div className="flex items-center gap-2">
                    <h4 className={`text-sm font-extrabold ${progressPercent >= 25 ? "text-cyan-300" : "text-slate-400"}`}>
                      {t.milestonePlanning}
                    </h4>
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                      progressPercent >= 25 ? "bg-cyan-500/10 text-cyan-400" : "bg-slate-800 text-slate-500"
                    }`}>
                      {progressPercent >= 25 ? t.activeStatus : t.inactiveStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t.milestonePlanningDesc}</p>
                </div>

                {/* Milestone 2 Description */}
                <div className={`flex flex-col pl-2 transition-all duration-500 ${progressPercent >= 50 ? "opacity-100" : "opacity-45"}`}>
                  <div className="flex items-center gap-2">
                    <h4 className={`text-sm font-extrabold ${progressPercent >= 50 ? "text-violet-300" : "text-slate-400"}`}>
                      {t.milestoneDevelopment}
                    </h4>
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                      progressPercent >= 50 ? "bg-violet-500/10 text-violet-400" : "bg-slate-800 text-slate-500"
                    }`}>
                      {progressPercent >= 50 ? t.activeStatus : t.inactiveStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t.milestoneDevelopmentDesc}</p>
                </div>

                {/* Milestone 3 Description */}
                <div className={`flex flex-col pl-2 transition-all duration-500 ${progressPercent >= 100 ? "opacity-100" : "opacity-45"}`}>
                  <div className="flex items-center gap-2">
                    <h4 className={`text-sm font-extrabold ${progressPercent >= 100 ? "text-indigo-300" : "text-slate-400"}`}>
                      {t.milestoneProduction}
                    </h4>
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                      progressPercent >= 100 ? "bg-indigo-500/10 text-indigo-400" : "bg-slate-800 text-slate-500"
                    }`}>
                      {progressPercent >= 100 ? t.activeStatus : t.inactiveStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t.milestoneProductionDesc}</p>
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN: MAIN INTERACTIVE & STATS BLOCK */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* STATS CARD */}
            <div className="glass rounded-3xl p-6 sm:p-8 card-glow border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-cyan-500/5 blur-3xl" />
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest block mb-2">
                {t.campaignStats}
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight mb-4">
                {campaign ? campaign.title : "Sponsoring Campaign"}
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-6">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Goal</span>
                  <span className="text-xl sm:text-2xl font-black text-white font-mono">
                    {campaign ? formatXlm(Number(campaign.goal) / 10_000_000) : "0.00"}
                  </span>
                  <span className="text-xs text-slate-400 font-bold ml-1">XLM</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Raised</span>
                  <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">
                    {campaign ? formatXlm(Number(campaign.total) / 10_000_000) : "0.00"}
                  </span>
                  <span className="text-xs text-cyan-400 font-bold ml-1">XLM</span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">{t.donorCount}</span>
                  <span className="text-xl sm:text-2xl font-black text-white font-mono">
                    {campaign ? campaign.donor_count : 0}
                  </span>
                </div>
              </div>

              {/* Progress Track Bar */}
              <div>
                <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5">
                  <span>{campaign ? t.raisedOfGoal(formatXlm(Number(campaign.total) / 10_000_000), formatXlm(Number(campaign.goal) / 10_000_000)) : ""}</span>
                  <span className="font-bold text-cyan-300">{progressPercent}%</span>
                </div>
                <div className="h-3 w-full bg-slate-900/60 rounded-full border border-white/5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-violet-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* ERROR ALERTS FEEDBACK */}
            {txState.status === "error" && (
              <div className="animate-fade-up rounded-2xl border p-4 text-sm flex gap-3 items-start border-rose-500/20 bg-rose-500/8 text-rose-200">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-bold text-white mb-0.5">
                    {txState.type === "wallet_not_found" && t.walletNotFoundTitle}
                    {txState.type === "user_rejected" && t.userRejectedTitle}
                    {txState.type === "insufficient_balance" && t.insufficientBalanceTitle}
                    {txState.type === "network_error" && t.errorTitle}
                    {!txState.type && t.errorTitle}
                  </h4>
                  <p className="text-xs text-rose-300/90 leading-relaxed mb-3">
                    {txState.message}
                  </p>
                  
                  {txState.type === "insufficient_balance" && publicKey && (
                    <button
                      type="button"
                      onClick={handleFund}
                      disabled={isFunding}
                      className="rounded-lg bg-rose-500/20 border border-rose-500/30 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-rose-500/30 disabled:opacity-60"
                    >
                      {isFunding ? t.fundingWalletBtn : t.fundWalletBtn}
                    </button>
                  )}
                  {txState.type === "wallet_not_found" && (
                    <a
                      href="https://freighter.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded-lg bg-rose-500/20 border border-rose-500/30 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-rose-500/30"
                    >
                      Download Freighter Wallet
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* TRANSACTION SUCCESS FEEDBACK */}
            {txState.status === "success" && (
              <div className="animate-fade-up rounded-2xl border p-5 flex gap-4 items-start border-emerald-500/20 bg-emerald-500/8 text-emerald-200">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white mb-0.5">{t.txSuccessTitle}</h4>
                  <p className="text-xs text-emerald-300/95 leading-relaxed mb-3">
                    {txState.message || t.txSuccessMessage(donateAmount)}
                  </p>
                  {txState.explorerUrl && (
                    <a
                      href={txState.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition"
                    >
                      {t.viewExplorer}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* TRANSACTION PENDING MODAL-LIKE FEEDBACK */}
            {txState.status === "pending" && (
              <div className="animate-fade-up rounded-2xl border p-5 flex gap-4 items-center border-indigo-500/20 bg-indigo-500/8 text-indigo-200">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-0.5">Sponsoring in progress</h4>
                  <p className="text-xs text-indigo-300/90 leading-relaxed">
                    Please approve the transaction invocation request in your wallet. Preparing XDR and submitting…
                  </p>
                </div>
              </div>
            )}

            {/* DONATE INPUT SPONSORSHIP FORM */}
            <div className="glass rounded-3xl p-6 sm:p-8 border border-white/5">
              <h3 className="text-lg font-bold text-white mb-4">{t.donateTitle}</h3>
              
              {publicKey && (
                <div className="mb-4 flex items-center justify-between rounded-xl bg-white/5 border border-white/5 px-4 py-3 text-xs">
                  <div className="flex flex-col">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">{t.balanceLabel}</span>
                    <span className="text-sm font-black text-slate-200 font-mono">
                      {isBalanceLoading ? "Loading…" : `${userBalance ? formatXlm(Number(userBalance)) : "0.00"} XLM`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={fetchBalance}
                    disabled={isBalanceLoading}
                    className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold uppercase tracking-wider transition disabled:opacity-60"
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
                      className="w-full rounded-2xl bg-slate-900/60 border border-white/10 px-5 py-4 text-white text-sm font-semibold font-mono placeholder-slate-600 focus:border-cyan-400 focus:outline-none transition"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500 uppercase tracking-widest">
                      XLM
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={txState.status === "pending"}
                    className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed py-4 text-sm font-extrabold text-white shadow-lg shadow-cyan-900/30 transition-all duration-200"
                  >
                    {txState.status === "pending" ? t.donatingBtn : t.donateBtn}
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={openModal}
                  disabled={isConnecting}
                  className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed py-4 text-sm font-extrabold text-white shadow-lg shadow-cyan-900/30 transition-all duration-200"
                >
                  {isConnecting ? t.connecting : t.connectWalletToDonate}
                </button>
              )}
            </div>

            {/* LEADERBOARD CARD */}
            <div className="glass rounded-3xl p-6 sm:p-8 border border-white/5 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 h-32 w-32 rounded-full bg-violet-600/5 blur-3xl" />
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>🏆</span>
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
                        className={`flex items-center justify-between rounded-2xl border px-4 py-3.5 transition duration-300 hover:translate-x-1 ${
                          isSelf
                            ? "bg-cyan-500/5 border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                            : "bg-white/5 border-white/5 hover:bg-white/8 hover:border-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg leading-none shrink-0">{medal}</span>
                          <div className="flex flex-col">
                            <span className="text-xs font-mono font-bold text-slate-200">
                              {formatAddress(donor.address, 8, 8)}
                            </span>
                            {isSelf && (
                              <span className="text-[8px] font-extrabold uppercase text-cyan-400 tracking-widest mt-0.5">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-white font-mono">
                            {formatXlm(Number(donor.amount) / 10_000_000)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold ml-1.5 font-mono">XLM</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ACTIVITY FEED */}
            <div className="glass rounded-3xl p-6 sm:p-8 border border-white/5">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
                  </span>
                  <span>{t.activityTitle}</span>
                </span>
                <span className="text-[9px] uppercase font-bold text-slate-500 font-mono tracking-wider">
                  Live
                </span>
              </h3>

              {activities.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">{t.noActivity}</p>
              ) : (
                <div className="space-y-3.5">
                  {activities.map((act) => (
                    <div
                      key={act.id}
                      className="group rounded-2xl bg-white/3 border border-white/3 p-4 flex flex-col gap-2 transition duration-200 hover:bg-white/5 hover:border-white/5 animate-fade-in"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                          act.functionName === "fund"
                            ? "bg-cyan-500/10 text-cyan-400"
                            : "bg-indigo-500/10 text-indigo-400"
                        }`}>
                          {act.functionName === "fund" ? t.funcFund : t.funcInitialize}
                        </span>
                        <span className="text-slate-500 font-mono font-semibold">
                          {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mt-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                          <span className="text-slate-600">From:</span>
                          <span className="font-bold text-slate-300">{formatAddress(act.donor, 8, 8)}</span>
                        </div>
                        {act.amount !== null && (
                          <div className="flex items-center gap-1 text-xs">
                            <span className="font-mono font-black text-white">{formatXlm(act.amount)}</span>
                            <span className="font-bold text-slate-500 font-mono">XLM</span>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-white/5 pt-2 mt-1 flex justify-between items-center">
                        <span className="text-[10px] font-mono text-slate-600">ID: {act.id.slice(0, 8)}…</span>
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${act.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 hover:text-cyan-300 transition"
                        >
                          Verify on explorer
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
