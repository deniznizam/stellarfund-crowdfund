"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BalanceCard } from "@/components/BalanceCard";
import { Confetti } from "@/components/Confetti";
import { LanguageToggle } from "@/components/LanguageToggle";
import { MultiPay } from "@/components/MultiPay";
import { SplitCalculator } from "@/components/SplitCalculator";
import { TransactionFeedback } from "@/components/TransactionFeedback";
import { WalletButton } from "@/components/WalletButton";
import { copy, type Locale } from "@/lib/i18n";
import {
  calculateSplit,
  parsePayForCount,
  parsePeopleCount,
  parsePositiveNumber,
} from "@/lib/split";
import {
  checkWalletConnection,
  connectWallet,
  fetchXlmPrice,
  fundTestnetAccount,
  getXlmBalance,
  sendMultiXlmPayment,
  sendXlmPayment,
} from "@/lib/stellar";

type TxState = {
  status: "idle" | "loading" | "success" | "error";
  message?: string;
  hash?: string;
  explorerUrl?: string;
};

/* ─── Shield icon ───────────────────────────────── */
function StellarShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-indigo-400">
      <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"
        fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Testnet badge ─────────────────────────────── */
function TestnetBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/8 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-300">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 status-dot" />
      Testnet
    </span>
  );
}

export function SplitPayApp() {
  const [locale, setLocale] = useState<Locale>("en");
  const t = copy[locale];

  /* ── Wallet state ── */
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [isFunding, setIsFunding] = useState(false);

  /* ── Feature 5: XLM price ── */
  const [xlmPrice, setXlmPrice] = useState<number | null>(null);

  /* ── Single-pay state ── */
  const [isSending, setIsSending] = useState(false);
  const [txState, setTxState] = useState<TxState>({ status: "idle" });
  const [error, setError] = useState<string | null>(null);

  /* ── Confetti ── */
  const [showConfetti, setShowConfetti] = useState(false);
  const fireConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
  };

  /* ── Feature 7: Multi-pay state ── */
  const [isMultiSending, setIsMultiSending] = useState(false);
  const [multiTxResult, setMultiTxResult] = useState<{
    status: "success" | "error";
    hash?: string;
    explorerUrl?: string;
    message?: string;
  } | null>(null);

  /* ── Split inputs ── */
  const [totalBill, setTotalBill] = useState("100");
  const [numPeople, setNumPeople] = useState("4");
  const [payForCount, setPayForCount] = useState("1");
  const [recipient, setRecipient] = useState("");
  const [memo, setMemo] = useState("SplitPay");

  /* ── Feature 5: fetch XLM price on mount ── */
  useEffect(() => {
    fetchXlmPrice().then(p => setXlmPrice(p));
  }, []);

  const refreshBalance = useCallback(async (address: string) => {
    setIsBalanceLoading(true);
    try {
      const xlm = await getXlmBalance(address);
      setBalance(xlm);
    } catch {
      setBalance("0");
      setError(t.balanceLoadError);
    } finally {
      setIsBalanceLoading(false);
    }
  }, [t.balanceLoadError]);

  /* ── Auto-reconnect on load ── */
  useEffect(() => {
    void (async () => {
      try {
        const address = await checkWalletConnection();
        if (address) {
          setPublicKey(address);
          await refreshBalance(address);
        }
      } catch { /* Freighter not yet available */ }
    })();
  }, [refreshBalance]);

  /* ── Split calculation ── */
  const split = useMemo(() => {
    const bill = parsePositiveNumber(totalBill);
    const people = parsePeopleCount(numPeople);
    const payingFor = people ? parsePayForCount(payForCount, people) : null;
    if (!bill || !people || !payingFor) return null;
    return calculateSplit({ totalBill: bill, numPeople: people, payForCount: payingFor });
  }, [totalBill, numPeople, payForCount]);

  /* ── Handlers ── */
  const handleConnect = async () => {
    setError(null);
    setIsConnecting(true);
    try {
      const address = await connectWallet();
      setPublicKey(address);
      await refreshBalance(address);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.walletConnectError);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setPublicKey(null);
    setBalance(null);
    setTxState({ status: "idle" });
    setMultiTxResult(null);
    setError(null);
  };

  const handleFund = async () => {
    if (!publicKey) return;
    setError(null);
    setIsFunding(true);
    try {
      await fundTestnetAccount(publicKey);
      await refreshBalance(publicKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.fundingError);
    } finally {
      setIsFunding(false);
    }
  };

  const handleSelectScenario = (
    total: string, people: string, payFor: string,
    recipientHost: string, memoStr: string
  ) => {
    setTotalBill(total);
    setNumPeople(people);
    setPayForCount(payFor);
    setRecipient(recipientHost);
    setMemo(memoStr);
  };

  const handleSendSplit = async () => {
    if (!publicKey || !split) return;
    setError(null);
    setTxState({ status: "loading", message: t.txWaiting });
    setIsSending(true);
    try {
      const result = await sendXlmPayment({
        from: publicKey,
        to: recipient.trim(),
        amount: split.yourShare.toFixed(7),
        memo,
      });
      setTxState({
        status: "success",
        message: t.txSuccessMessage(split.yourShare.toFixed(7), split.payForCount, split.numPeople),
        hash: result.hash,
        explorerUrl: result.explorerUrl,
      });
      fireConfetti();
      await refreshBalance(publicKey);
    } catch (err) {
      setTxState({ status: "error", message: err instanceof Error ? err.message : t.sendError });
    } finally {
      setIsSending(false);
    }
  };

  /* ── Feature 7: Multi-pay handler ── */
  const handleSendMulti = async (entries: Array<{ to: string; amount: string }>, batchMemo: string) => {
    if (!publicKey) return;
    setMultiTxResult(null);
    setIsMultiSending(true);
    try {
      const result = await sendMultiXlmPayment({ from: publicKey, entries, memo: batchMemo });
      setMultiTxResult({
        status: "success",
        hash: result.hash,
        explorerUrl: result.explorerUrl,
        message: t.multiTxSuccess,
      });
      fireConfetti();
      await refreshBalance(publicKey);
    } catch (err) {
      setMultiTxResult({
        status: "error",
        message: err instanceof Error ? err.message : t.multiTxError,
      });
    } finally {
      setIsMultiSending(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--background)" }}>
      <Confetti active={showConfetti} />

      {/* ── Ambient background ── */}
      <div className="pointer-events-none fixed inset-0" aria-hidden>
        <div className="absolute top-0 left-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-cyan-500/6 blur-[100px]" />
        {/* Subtle dot grid */}
        <div className="absolute inset-0 opacity-40"
          style={{ backgroundImage: "radial-gradient(rgba(148,163,184,0.08) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 pt-6 pb-20 sm:px-6 sm:pt-8">

        {/* ══ NAVBAR ══════════════════════════════ */}
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-lg shadow-indigo-900/40 animate-glow-pulse">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none text-gradient">SplitPay</h1>
              <span className="block text-[10px] text-slate-500 leading-none mt-0.5">{t.tagline}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <TestnetBadge />
            <LanguageToggle locale={locale} onChange={setLocale} />
            <WalletButton copy={t} publicKey={publicKey} isConnecting={isConnecting}
              onConnect={handleConnect} onDisconnect={handleDisconnect} />
          </div>
        </header>

        {/* ══ ERROR BANNER ════════════════════════ */}
        {error && (
          <div className="mb-6 animate-fade-up flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/8 px-4 py-3.5 text-sm text-rose-200">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* ══ HERO ════════════════════════════════ */}
        <section className="grid gap-5 lg:grid-cols-12 mb-7 items-stretch">

          {/* Illustration card */}
          <div className="lg:col-span-7 glass card-glow rounded-3xl overflow-hidden flex flex-col">
            <div className="p-6 sm:p-8 pb-0">
              <div className="flex items-center gap-2 mb-3">
                <StellarShield />
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  {locale === "tr" ? "Güvenli · Stellar Testnet" : "Secure · Stellar Testnet"}
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl leading-tight">
                {t.heroSubtitle}
              </h2>
              <p className="mt-2.5 text-sm text-slate-400 leading-relaxed">{t.splitDescription}</p>
            </div>
            <div className="mt-5 flex-1 overflow-hidden">
              <Image
                src="/images/dining_bill_split.jpg"
                alt={locale === "tr" ? "Yemek ve adisyon illüstrasyonu" : "Dining and bill split illustration"}
                width={900} height={380} priority
                className="w-full h-52 sm:h-64 object-cover opacity-85"
              />
            </div>
          </div>

          {/* Wallet panel */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {publicKey ? (
              <>
                {/* Feature 3 + 5: BalanceCard with copy + price */}
                <BalanceCard
                  copy={t}
                  publicKey={publicKey}
                  balance={balance}
                  xlmPrice={xlmPrice}
                  isLoading={isBalanceLoading}
                  onRefresh={() => refreshBalance(publicKey)}
                  onFund={handleFund}
                  isFunding={isFunding}
                />
                {/* How it works */}
                <div className="glass rounded-2xl p-5 flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="h-4 w-4 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z" />
                    </svg>
                    <h4 className="text-sm font-bold text-white">
                      {locale === "tr" ? "Nasıl kullanılır?" : "How it works"}
                    </h4>
                  </div>
                  <ol className="space-y-2">
                    {(locale === "tr"
                      ? ["Toplam hesabı ve kişi sayısını girin", "Hesabı ödeyen arkadaşınızın adresini ekleyin", "\"Payımı Şimdi Gönder\" butonuna basın"]
                      : ["Enter total bill and headcount", "Add the host's Stellar address", "Hit \"Pay My Share Now\""]
                    ).map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-slate-400">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-[10px]">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </>
            ) : (
              /* Connect CTA */
              <div className="glass-accent card-glow rounded-3xl flex flex-col items-center justify-center p-10 text-center flex-1 min-h-[300px]">
                <div className="relative mb-6">
                  <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl scale-150" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-700/20 border border-indigo-500/30">
                    <svg className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18-3H3m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{t.connectPromptTitle}</h3>
                <p className="max-w-[240px] text-xs text-slate-400 leading-relaxed mb-7">
                  {t.connectPromptBody}
                </p>
                <button type="button" id="hero-connect-btn" onClick={handleConnect}
                  disabled={isConnecting}
                  className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-900/40 transition-all duration-200">
                  {isConnecting ? t.connecting : t.connectFreighter}
                </button>
                {/* Trust indicators */}
                <div className="mt-5 flex items-center gap-4 text-[10px] text-slate-600">
                  {[
                    { icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", label: locale === "tr" ? "Güvenli" : "Non-custodial" },
                    { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", label: "Open source" },
                    { icon: "M13 10V3L4 14h7v7l9-11h-7z", label: "Stellar" },
                  ].map(({ icon, label }) => (
                    <span key={label} className="flex items-center gap-1">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                      </svg>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ══ SPLIT CALCULATOR ════════════════════ */}
        <div className="space-y-5">
          <SplitCalculator
            locale={locale} copy={t}
            totalBill={totalBill} numPeople={numPeople} payForCount={payForCount}
            recipient={recipient} memo={memo}
            split={split} isSending={isSending} isConnected={publicKey !== null}
            balance={balance}
            onTotalBillChange={setTotalBill} onNumPeopleChange={setNumPeople}
            onPayForCountChange={setPayForCount} onRecipientChange={setRecipient}
            onMemoChange={setMemo} onSubmit={handleSendSplit} onConnect={handleConnect}
            onSelectScenario={handleSelectScenario}
          />

          <TransactionFeedback
            copy={t} status={txState.status} message={txState.message}
            hash={txState.hash} explorerUrl={txState.explorerUrl}
            totalBill={totalBill}
            perPersonShare={split ? split.perPersonShare : 0}
            yourShare={split ? split.yourShare : 0}
            recipient={recipient} memo={memo}
          />

          {/* ══ Feature 7: MULTI-PAY ═══════════════ */}
          <MultiPay
            locale={locale} copy={t}
            isConnected={publicKey !== null}
            isSending={isMultiSending}
            balance={balance}
            onConnect={handleConnect}
            onSendMulti={handleSendMulti}
            txResult={multiTxResult}
          />
        </div>

        {/* ══ FOOTER ══════════════════════════════ */}
        <footer className="mt-16 border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <span className="font-mono">{t.footer}</span>
          <div className="flex items-center gap-4">
            {[
              { href: "/fund", label: locale === "tr" ? "Bağış Kampanyası" : "Crowdfunding Campaign", isInternal: true },
              { href: "https://stellar.org", label: "Stellar" },
              { href: "https://freighter.app", label: "Freighter" },
              { href: "https://stellar.expert/explorer/testnet", label: "Explorer" },
            ].map(({ href, label, isInternal }) =>
              isInternal ? (
                <Link key={label} href={href} className="hover:text-slate-400 transition-colors">
                  {label}
                </Link>
              ) : (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  className="hover:text-slate-400 transition-colors">{label}</a>
              )
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
