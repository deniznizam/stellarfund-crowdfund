"use client";

import { useState } from "react";
import type { Copy } from "@/lib/i18n";
import { formatXlm } from "@/lib/split";

type BalanceCardProps = {
  copy: Copy;
  publicKey: string;
  balance: string | null;
  xlmPrice: number | null;
  isLoading: boolean;
  onRefresh: () => void;
  onFund?: () => void;
  isFunding?: boolean;
};

export function BalanceCard({
  copy: t,
  publicKey,
  balance,
  xlmPrice,
  isLoading,
  onRefresh,
  onFund,
  isFunding,
}: BalanceCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const balanceNum = parseFloat(balance ?? "0");
  const usdValue = xlmPrice != null ? (balanceNum * xlmPrice).toFixed(2) : null;

  return (
    <section className="glass card-glow rounded-2xl p-5">
      {/* Balance row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-400 mb-1">{t.balanceLabel}</p>
          <p className="text-3xl font-black tracking-tight text-white leading-none">
            {isLoading ? (
              <span className="text-slate-500 text-2xl">…</span>
            ) : (
              `${formatXlm(balanceNum)}`
            )}
            <span className="ml-1.5 text-lg font-bold text-slate-400">XLM</span>
          </p>
          {/* Feature 5: USD equivalent */}
          {usdValue != null && !isLoading && (
            <p className="mt-1 text-xs text-slate-500">
              ≈ <span className="text-emerald-400 font-semibold">${usdValue} USD</span>
              {xlmPrice != null && (
                <span className="ml-1.5 text-slate-600">@ ${xlmPrice.toFixed(4)}/XLM</span>
              )}
            </p>
          )}
          <p className="mt-1.5 text-[10px] text-slate-600">{t.balanceSource}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/4 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/8 disabled:opacity-50 transition"
          >
            <svg className={`h-3 w-3 ${isLoading ? "animate-spin-smooth" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t.refresh}
          </button>
          {onFund && (
            <button
              type="button"
              onClick={onFund}
              disabled={isFunding}
              className="flex items-center gap-1.5 rounded-lg border border-cyan-400/25 bg-cyan-400/8 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-400/15 disabled:opacity-50 transition"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {isFunding ? t.funding : t.getTestXlm}
            </button>
          )}
        </div>
      </div>

      {/* Feature 3: Copy address */}
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/6 bg-slate-950/40 px-3 py-2">
        <code className="flex-1 truncate font-mono text-[11px] text-slate-400">
          {publicKey}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          title={t.copyAddress}
          className="shrink-0 text-slate-500 hover:text-indigo-400 transition-colors"
        >
          {copied ? (
            <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>
    </section>
  );
}
