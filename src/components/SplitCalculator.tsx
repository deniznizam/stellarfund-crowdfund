"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Copy, Locale } from "@/lib/i18n";
import { buildShareSummary } from "@/lib/i18n";
import { SplitResult, formatXlm } from "@/lib/split";
import { checkAccountExists, formatAddress, isValidPublicKey } from "@/lib/stellar";

type RecipientStatus = "idle" | "checking" | "valid" | "notfound" | "invalid";

type SplitCalculatorProps = {
  locale: Locale;
  copy: Copy;
  totalBill: string;
  numPeople: string;
  payForCount: string;
  recipient: string;
  memo: string;
  split: SplitResult | null;
  isSending: boolean;
  isConnected: boolean;
  balance: string | null; // Feature 1
  onTotalBillChange: (v: string) => void;
  onNumPeopleChange: (v: string) => void;
  onPayForCountChange: (v: string) => void;
  onRecipientChange: (v: string) => void;
  onMemoChange: (v: string) => void;
  onSubmit: () => void;
  onConnect: () => void;
  onSelectScenario: (total: string, people: string, payFor: string, recipient: string, memo: string) => void;
};

export function SplitCalculator({
  locale,
  copy: t,
  totalBill,
  numPeople,
  payForCount,
  recipient,
  memo,
  split,
  isSending,
  isConnected,
  balance,
  onTotalBillChange,
  onNumPeopleChange,
  onPayForCountChange,
  onRecipientChange,
  onMemoChange,
  onSubmit,
  onConnect,
  onSelectScenario,
}: SplitCalculatorProps) {
  const [copied, setCopied] = useState(false);
  const [recipientStatus, setRecipientStatus] = useState<RecipientStatus>("idle");
  const [showQr, setShowQr] = useState(false);

  // Feature 6: debounced account existence check
  useEffect(() => {
    if (!recipient.trim()) { setRecipientStatus("idle"); return; }
    if (!isValidPublicKey(recipient.trim())) { setRecipientStatus("invalid"); return; }
    setRecipientStatus("checking");
    const timer = setTimeout(async () => {
      const exists = await checkAccountExists(recipient.trim());
      setRecipientStatus(exists ? "valid" : "notfound");
    }, 700);
    return () => clearTimeout(timer);
  }, [recipient]);

  // Feature 1: insufficient balance check
  const balanceNum = parseFloat(balance ?? "0");
  const insufficient = isConnected && split != null && split.yourShare > balanceNum && balanceNum >= 0;

  const handleCopySummary = async () => {
    if (!split) return;
    await navigator.clipboard.writeText(buildShareSummary(locale, split.perPersonShare));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareBreakdown = (() => {
    if (!split) return [];
    const payForNum = Number(payForCount) || 1;
    const items = [
      {
        name: `${t.hostLabel}`,
        detail: recipient ? formatAddress(recipient, 4, 4) : "G…Host",
        amount: split.perPersonShare,
        status: t.receivesLabel,
        color: "text-emerald-400",
      },
      {
        name: t.youLabel,
        detail: payForNum > 1 ? `${payForNum} ${locale === "tr" ? "pay" : "shares"}` : `1 ${locale === "tr" ? "pay" : "share"}`,
        amount: split.yourShare,
        status: t.paysLabel,
        color: "text-indigo-400 font-bold",
      },
    ];
    const remaining = split.numPeople - 1 - payForNum;
    for (let i = 0; i < remaining; i++) {
      items.push({
        name: `${t.friendLabel} ${i + 2}`,
        detail: `1 ${locale === "tr" ? "pay" : "share"}`,
        amount: split.perPersonShare,
        status: t.unpaidLabel,
        color: "text-slate-500",
      });
    }
    return items;
  })();

  const demoScenarios = [
    { id: "pizza", name: t.pizzaNightName, total: "100", people: "4", payFor: "1", host: "", memo: "Pizza Night" },
    { id: "luna",  name: t.lunaDinnerName, total: "240", people: "6", payFor: "2", host: "", memo: "Dinner at Luna" },
    { id: "coffee",name: t.coffeeBreakName,total: "30",  people: "3", payFor: "1", host: "", memo: "Coffee Break" },
  ];

  // Recipient status badge
  const RecipientBadge = () => {
    if (recipientStatus === "idle" || recipientStatus === "invalid") return null;
    if (recipientStatus === "checking") return (
      <span className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
        <svg className="h-3 w-3 animate-spin-smooth" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        {t.checkingAccount}
      </span>
    );
    if (recipientStatus === "valid") return (
      <span className="flex items-center gap-1 text-[10px] text-emerald-400 mt-1">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        {t.recipientValid}
      </span>
    );
    return (
      <span className="flex items-center gap-1 text-[10px] text-amber-400 mt-1">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        </svg>
        {t.recipientNotFound}
      </span>
    );
  };

  return (
    <div className="grid gap-5 lg:grid-cols-12">

      {/* ── Left: Form ── */}
      <section className="glass card-glow rounded-3xl p-6 sm:p-8 lg:col-span-7">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400 mb-1">{t.splitEyebrow}</p>
          <h2 className="text-2xl font-bold text-white">{t.splitTitle}</h2>
        </div>

        {/* Scenarios */}
        <div className="mb-5 rounded-2xl border border-indigo-500/15 bg-indigo-500/4 p-3.5">
          <p className="text-xs font-semibold text-indigo-300 mb-2">{t.scenariosLabel}</p>
          <div className="flex flex-wrap gap-2">
            {demoScenarios.map(s => (
              <button key={s.id} type="button"
                onClick={() => onSelectScenario(s.total, s.people, s.payFor, s.host, s.memo)}
                className="rounded-xl border border-white/8 bg-slate-950/50 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-indigo-400/30 hover:text-white transition">
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Numbers */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: t.totalBill, value: totalBill, onChange: onTotalBillChange, min: "0", step: "0.0000001", placeholder: "120.50", id: "input-total-bill" },
            { label: t.peopleAtTable, value: numPeople, onChange: onNumPeopleChange, min: "2", step: "1", placeholder: "4", id: "input-num-people" },
            { label: t.youPayFor, value: payForCount, onChange: onPayForCountChange, min: "1", step: "1", placeholder: "1", id: "input-pay-for" },
          ].map(f => (
            <label key={f.id} className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-400">{f.label}</span>
              <input type="number" id={f.id} min={f.min} step={f.step} value={f.value}
                onChange={e => f.onChange(e.target.value)} placeholder={f.placeholder}
                className="field-input" />
            </label>
          ))}
        </div>

        {/* Recipient + QR */}
        <div className="mt-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-400">{t.recipient}</span>
            <div className="flex gap-2">
              <input type="text" id="input-recipient" value={recipient}
                onChange={e => onRecipientChange(e.target.value)}
                placeholder="G…" className="field-input font-mono text-xs" />
              {/* Feature 4: QR toggle */}
              {recipientStatus === "valid" && (
                <button type="button" onClick={() => setShowQr(v => !v)}
                  title={t.qrLabel}
                  className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-950/60 text-slate-400 hover:text-indigo-400 hover:border-indigo-400/30 transition">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth={1.8}/>
                    <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth={1.8}/>
                    <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth={1.8}/>
                    <path strokeLinecap="round" d="M14 14h2m3 0v2m0 3h-3m0 0v-3m3 0h-1" strokeWidth={1.8}/>
                  </svg>
                </button>
              )}
            </div>
            <RecipientBadge />
            <span className="mt-1 block text-xs text-slate-600">{t.recipientHint}</span>
          </label>

          {/* Feature 4: QR code panel */}
          {showQr && recipientStatus === "valid" && (
            <div className="mt-3 flex flex-col items-center gap-2 rounded-2xl border border-white/6 bg-slate-950/60 p-4">
              <p className="text-[10px] text-slate-500 mb-1">{t.qrLabel}</p>
              <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(recipient.trim())}&size=140x140&margin=6`}
                alt="QR code"
                width={140}
                height={140}
                className="rounded-xl"
                unoptimized
              />
              <code className="text-[9px] font-mono text-slate-600 break-all text-center max-w-[200px]">
                {recipient.trim()}
              </code>
            </div>
          )}
        </div>

        {/* Memo */}
        <div className="mt-4">
          <label className="block">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-400">{t.memoLabel}</span>
              <span className="text-[10px] font-mono text-slate-600">{memo.length}/28</span>
            </div>
            <input type="text" id="input-memo" maxLength={28} value={memo}
              onChange={e => onMemoChange(e.target.value)} placeholder={t.memoPlaceholder}
              className="field-input" />
            <span className="mt-1.5 block text-xs text-slate-600">{t.memoHint}</span>
          </label>
        </div>

        {/* Feature 1: Insufficient balance warning */}
        {insufficient && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/6 px-3 py-2.5 text-xs text-amber-300">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
            {t.insufficientBalance}
          </div>
        )}

        {/* Send / Connect */}
        {isConnected ? (
          <button type="button" id="send-payment-btn" onClick={onSubmit}
            disabled={isSending || !split || !recipient.trim() || insufficient || recipientStatus === "invalid" || recipientStatus === "notfound" || recipientStatus === "checking"}
            className="mt-5 w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-900/30 transition disabled:cursor-not-allowed disabled:opacity-50">
            {isSending ? t.sendingPayment : t.sendPayment}
          </button>
        ) : (
          <button type="button" id="connect-to-pay-btn" onClick={onConnect}
            className="mt-5 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-6 py-4 text-sm font-bold text-white transition">
            {t.connectToPay}
          </button>
        )}
      </section>

      {/* ── Right: Receipt ── */}
      <section className="lg:col-span-5">
        {split ? (
          <div className="receipt-strip relative rounded-3xl p-6 shadow-2xl">
            {/* Perforated top */}
            <div className="absolute left-4 right-4 top-0 -translate-y-1/2 select-none pointer-events-none font-mono text-[10px] tracking-widest text-center text-slate-800" aria-hidden>
              ▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼
            </div>

            <div className="text-center font-mono mt-2">
              <h3 className="text-xs font-bold tracking-widest text-slate-400">*** {t.receiptHeader} ***</h3>
              <p className="text-[10px] text-slate-600 mt-1">SPLITPAY · TESTNET</p>
              <div className="border-t border-dashed border-slate-800 my-4" />
            </div>

            <div className="font-mono text-xs space-y-2">
              {[
                ["TOTAL BILL", `${formatXlm(split.totalBill)} XLM`],
                ["PEOPLE", `${split.numPeople}`],
                ["YOUR PORTION", `${split.payForCount} ${locale === "tr" ? "pay" : "share(s)"}`],
                ...(memo.trim() ? [["MEMO", memo.trim()]] : []),
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-slate-600">{k}</span>
                  <span className={`text-slate-300 truncate max-w-[150px] ${k === "MEMO" ? "text-indigo-300" : ""}`}>{v}</span>
                </div>
              ))}

              <div className="border-t border-dashed border-slate-800 my-4" />

              {/* Participants */}
              <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-2">
                {locale === "tr" ? "KATILIMCILAR" : "PARTICIPANTS"}
              </p>
              <div className="space-y-1.5">
                {shareBreakdown.map((item, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-slate-950/60 border border-white/4 p-2.5">
                    <div>
                      <p className="text-xs font-semibold text-white">{item.name}</p>
                      <p className="text-[10px] text-slate-600 font-mono">{item.detail}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono text-slate-300">{formatXlm(item.amount)} XLM</p>
                      <p className={`text-[9px] uppercase tracking-wider ${item.color}`}>{item.status}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-800 my-4" />

              <div className="flex justify-between items-baseline">
                <span className="text-slate-400 font-bold">PER PERSON</span>
                <span className="text-lg font-bold text-white">{formatXlm(split.perPersonShare)} XLM</span>
              </div>
              <div className="flex justify-between items-baseline mt-1 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-3">
                <span className="text-indigo-300 font-bold text-xs">YOUR TOTAL DUE</span>
                <span className="text-2xl font-black text-white">{formatXlm(split.yourShare)} XLM</span>
              </div>
            </div>

            <div className="mt-6 border-t border-dashed border-slate-800 pt-4 text-center font-mono text-[9px] text-slate-700">
              {t.receiptFooter}
            </div>

            {/* Perforated bottom */}
            <div className="absolute left-4 right-4 bottom-0 translate-y-1/2 select-none pointer-events-none font-mono text-[10px] tracking-widest text-center text-slate-800" aria-hidden>
              ▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼
            </div>

            <div className="mt-8">
              <button type="button" id="copy-summary-btn" onClick={handleCopySummary}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/4 px-4 py-3 text-xs font-semibold text-cyan-200 hover:bg-cyan-400/10 hover:border-cyan-400/40 transition">
                {copied ? (
                  <><svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>{t.copiedSummary}</>
                ) : (
                  <><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>{t.copySummary}</>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-[340px] flex-col items-center justify-center rounded-3xl border border-white/5 bg-slate-900/20 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/60 text-slate-600 mb-4">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/>
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-slate-400 mb-1">
              {locale === "tr" ? "Adisyon Önizlemesi" : "Receipt Preview"}
            </h4>
            <p className="max-w-[200px] text-xs text-slate-600 leading-relaxed">
              {locale === "tr"
                ? "Sol taraftaki alanları doldurduğunuzda hesap detayları burada görünür."
                : "Fill in the fields on the left to see your bill split preview here."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
