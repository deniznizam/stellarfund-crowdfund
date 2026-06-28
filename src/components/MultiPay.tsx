"use client";

import { useState } from "react";
import type { Copy, Locale } from "@/lib/i18n";
import { formatXlm } from "@/lib/split";
import { isValidPublicKey, formatAddress } from "@/lib/stellar";

type PaymentRow = {
  id: string;
  recipient: string;
  amount: string;
};

type MultiPayProps = {
  locale: Locale;
  copy: Copy;
  isConnected: boolean;
  isSending: boolean;
  balance: string | null;
  onConnect: () => void;
  onSendMulti: (entries: Array<{ to: string; amount: string }>, memo: string) => void;
  txResult?: { status: "success" | "error"; hash?: string; explorerUrl?: string; message?: string } | null;
};

export function MultiPay({
  locale,
  copy: t,
  isConnected,
  isSending,
  balance,
  onConnect,
  onSendMulti,
  txResult,
}: MultiPayProps) {
  const [rows, setRows] = useState<PaymentRow[]>([
    { id: "1", recipient: "", amount: "" },
    { id: "2", recipient: "", amount: "" },
  ]);
  const [batchMemo, setBatchMemo] = useState("");

  const addRow = () =>
    setRows(r => [...r, { id: Date.now().toString(), recipient: "", amount: "" }]);

  const removeRow = (id: string) =>
    setRows(r => r.filter(row => row.id !== id));

  const updateRow = (id: string, field: "recipient" | "amount", value: string) =>
    setRows(r => r.map(row => row.id === id ? { ...row, [field]: value } : row));

  const validRows = rows.filter(r => isValidPublicKey(r.recipient.trim()) && parseFloat(r.amount) > 0);
  const totalAmount = rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const balanceNum = parseFloat(balance ?? "0");
  const insufficient = isConnected && totalAmount > balanceNum && totalAmount > 0;
  const canSend = validRows.length > 0 && validRows.length === rows.filter(r => r.recipient || r.amount).length && !insufficient;

  const handleSend = () => {
    if (!canSend) return;
    onSendMulti(
      validRows.map(r => ({ to: r.recipient.trim(), amount: parseFloat(r.amount).toFixed(7) })),
      batchMemo
    );
  };

  return (
    <section className="glass card-glow rounded-3xl p-6 sm:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">{t.multiPayTitle}</p>
        </div>
        <h2 className="text-xl font-bold text-white">{t.multiPayDesc}</h2>
        <p className="mt-1 text-xs text-slate-500">
          {locale === "tr"
            ? "Stellar'ın multi-op özelliği sayesinde tüm ödemeler tek seferde onaylanır."
            : "Thanks to Stellar's multi-op feature, all payments are signed and submitted in a single transaction."}
        </p>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-12 gap-2 mb-2 px-1">
        <div className="col-span-1" />
        <div className="col-span-6 text-[10px] font-bold uppercase tracking-wider text-slate-600">
          {locale === "tr" ? "Alıcı Adresi" : "Recipient Address"}
        </div>
        <div className="col-span-3 text-[10px] font-bold uppercase tracking-wider text-slate-600">
          XLM
        </div>
        <div className="col-span-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
          {locale === "tr" ? "Sil" : "Remove"}
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-2 mb-4">
        {rows.map((row, idx) => {
          const isValid = isValidPublicKey(row.recipient.trim());
          const hasAmt = parseFloat(row.amount) > 0;
          const rowOk = isValid && hasAmt;
          const rowTouched = row.recipient.length > 0 || row.amount.length > 0;

          return (
            <div key={row.id}
              className={`grid grid-cols-12 gap-2 items-center rounded-2xl border p-3 transition ${
                rowOk ? "border-emerald-500/20 bg-emerald-500/3"
                : rowTouched ? "border-rose-500/20 bg-rose-500/3"
                : "border-white/5 bg-slate-950/30"
              }`}>
              {/* Index */}
              <div className="col-span-1 flex justify-center">
                <span className={`text-xs font-bold ${rowOk ? "text-emerald-500" : "text-slate-600"}`}>
                  #{idx + 1}
                </span>
              </div>
              {/* Address */}
              <div className="col-span-6">
                <input type="text" value={row.recipient}
                  onChange={e => updateRow(row.id, "recipient", e.target.value)}
                  placeholder="G…"
                  className="w-full rounded-xl border border-white/8 bg-slate-950/60 px-3 py-2 font-mono text-[11px] text-white outline-none focus:border-indigo-400/40 focus:ring-1 focus:ring-indigo-400/20 transition placeholder:text-slate-700"
                />
                {row.recipient && !isValid && (
                  <p className="text-[9px] text-rose-400 mt-0.5 px-1">
                    {locale === "tr" ? "Geçersiz adres" : "Invalid address"}
                  </p>
                )}
                {isValid && (
                  <p className="text-[9px] text-emerald-500 mt-0.5 px-1 font-mono">
                    {formatAddress(row.recipient.trim(), 6, 6)}
                  </p>
                )}
              </div>
              {/* Amount */}
              <div className="col-span-3">
                <input type="number" value={row.amount}
                  onChange={e => updateRow(row.id, "amount", e.target.value)}
                  placeholder="0.00" min="0" step="0.0000001"
                  className="w-full rounded-xl border border-white/8 bg-slate-950/60 px-3 py-2 text-xs text-white outline-none focus:border-indigo-400/40 focus:ring-1 focus:ring-indigo-400/20 transition placeholder:text-slate-700"
                />
              </div>
              {/* Remove */}
              <div className="col-span-2 flex justify-center">
                {rows.length > 1 && (
                  <button type="button" onClick={() => removeRow(row.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 hover:text-rose-400 hover:bg-rose-400/8 transition">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add row */}
      <button type="button" onClick={addRow}
        className="mb-5 flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        {t.addRecipient}
      </button>

      {/* Batch memo */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-slate-400">{t.multiMemoLabel}</label>
          <span className="text-[10px] font-mono text-slate-600">{batchMemo.length}/28</span>
        </div>
        <input type="text" maxLength={28} value={batchMemo}
          onChange={e => setBatchMemo(e.target.value)}
          placeholder={t.multiMemoPlaceholder}
          className="field-input" />
      </div>

      {/* Footer: total + send */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-white/6 bg-slate-950/50 p-4">
        <div>
          <p className="text-xs text-slate-500">{t.totalToSend}</p>
          <p className="text-2xl font-black text-white mt-0.5">
            {formatXlm(totalAmount)} <span className="text-sm text-slate-400 font-bold">XLM</span>
          </p>
          {insufficient && (
            <p className="mt-1 flex items-center gap-1 text-xs text-amber-400">
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
              {t.insufficientBalance}
            </p>
          )}
          <p className="mt-1 text-[10px] text-slate-700">
            {validRows.length} {locale === "tr" ? "geçerli alıcı" : "valid recipient(s)"}
            {" · "}
            {locale === "tr" ? "tek işlem" : "single transaction"}
          </p>
        </div>

        {isConnected ? (
          <button type="button" id="multi-send-btn" onClick={handleSend}
            disabled={isSending || !canSend}
            className="shrink-0 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-900/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
            {isSending ? t.sendingAll : t.sendAll}
          </button>
        ) : (
          <button type="button" onClick={onConnect}
            className="shrink-0 rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-7 py-3.5 text-sm font-bold text-white transition">
            {t.connectToPay}
          </button>
        )}
      </div>

      {/* Multi-pay result */}
      {txResult && (
        <div className={`mt-4 rounded-2xl border p-4 animate-fade-up ${
          txResult.status === "success"
            ? "border-emerald-400/25 bg-emerald-400/6 text-emerald-200"
            : "border-rose-400/25 bg-rose-400/6 text-rose-200"
        }`}>
          <div className="flex items-start gap-2">
            {txResult.status === "success" ? (
              <svg className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            ) : (
              <svg className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
            )}
            <div>
              <p className="text-sm font-semibold">
                {txResult.status === "success" ? t.multiTxSuccess : t.multiTxError}
              </p>
              {txResult.message && <p className="text-xs opacity-80 mt-0.5">{txResult.message}</p>}
              {txResult.explorerUrl && (
                <a href={txResult.explorerUrl} target="_blank" rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium underline underline-offset-4 hover:no-underline">
                  {t.viewExplorer}
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
