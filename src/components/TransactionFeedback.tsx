"use client";

import type { Copy } from "@/lib/i18n";
import { formatXlm } from "@/lib/split";
import { formatAddress } from "@/lib/stellar";
import { getAppUrl } from "@/lib/i18n";

type TransactionFeedbackProps = {
  copy: Copy;
  status: "idle" | "loading" | "success" | "error";
  message?: string;
  hash?: string;
  explorerUrl?: string;
  totalBill?: string;
  perPersonShare?: number;
  yourShare?: number;
  recipient?: string;
  memo?: string;
};

export function TransactionFeedback({
  copy: t,
  status,
  message,
  hash,
  explorerUrl,
  totalBill = "0",
  perPersonShare = 0,
  yourShare = 0,
  recipient = "",
  memo = "",
}: TransactionFeedbackProps) {
  if (status === "idle") return null;

  const styles = {
    loading: "border-sky-400/30 bg-sky-400/8 text-sky-100",
    success: "border-emerald-400/30 bg-emerald-400/8 text-emerald-100",
    error: "border-rose-400/30 bg-rose-400/8 text-rose-100",
  } as const;

  // Build social share text
  const hostShort = recipient ? formatAddress(recipient, 4, 4) : "Host";
  const shareText = t.shareText(
    totalBill,
    formatXlm(perPersonShare),
    formatXlm(yourShare),
    hostShort
  );

  const appUrl = getAppUrl();
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " Pay here: " + appUrl)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(shareText)}`;

  const StatusIcon = () => {
    if (status === "loading") return (
      <svg className="h-5 w-5 animate-spin text-sky-400 shrink-0" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    );
    if (status === "success") return (
      <svg className="h-5 w-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
    return (
      <svg className="h-5 w-5 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    );
  };

  return (
    <div className="space-y-4">
      {/* Alert Banner */}
      <section
        className={`rounded-2xl border p-5 ${styles[status === "loading" ? "loading" : status]}`}
        aria-live="polite"
        role="status"
      >
        <div className="flex items-start gap-3">
          <StatusIcon />
          <div className="min-w-0 flex-1">
            <p className={`font-semibold ${status === "success" ? "animate-bounce-in" : ""}`}>
              {status === "loading" && t.txLoadingTitle}
              {status === "success" && `🎉 ${t.txSuccessTitle}`}
              {status === "error" && t.txErrorTitle}
            </p>
            {message ? <p className="mt-1 text-sm opacity-90">{message}</p> : null}
            {hash ? (
              <p className="mt-3 break-all font-mono text-xs opacity-70">
                {t.hashLabel}: {hash}
              </p>
            ) : null}
            {explorerUrl ? (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4 hover:no-underline"
              >
                {t.viewExplorer}
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ) : null}
          </div>
        </div>
      </section>

      {/* Printable Receipt on Success */}
      {status === "success" && hash && (
        <section className="relative rounded-3xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
          {/* Jagged border top */}
          <div className="absolute left-4 right-4 top-0 -translate-y-1/2 overflow-hidden text-neutral-800 select-none pointer-events-none font-mono text-[10px] tracking-widest text-center" aria-hidden>
            ▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼
          </div>

          <div className="text-center font-mono mt-2">
            <h3 className="text-xs font-bold tracking-widest text-slate-400">
              *** {t.receiptHeader} ***
            </h3>
            <p className="text-[9px] text-emerald-400 mt-1 uppercase font-bold tracking-wider">
              -- TRANSACTION SUCCESSFUL --
            </p>
            <div className="border-t border-dashed border-neutral-800 my-4" />
          </div>

          <div className="font-mono text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">TX STATUS</span>
              <span className="text-emerald-400 font-bold">SETTLED</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">TX HASH</span>
              <span className="text-slate-300 font-mono">{formatAddress(hash, 8, 8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">HOST ADDR</span>
              <span className="text-slate-300 font-mono">{formatAddress(recipient, 6, 6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">MEMO TEXT</span>
              <span className="text-violet-300">{memo || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">TOTAL BILL</span>
              <span className="text-slate-300">{totalBill} XLM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">PER PERSON</span>
              <span className="text-slate-300">{formatXlm(perPersonShare)} XLM</span>
            </div>

            <div className="border-t border-dashed border-neutral-800 my-4" />

            <div className="flex justify-between items-baseline pt-1">
              <span className="text-xs font-bold text-slate-300">AMOUNT TRANSFERRED</span>
              <span className="text-xl font-bold text-emerald-400">
                {formatXlm(yourShare)} XLM
              </span>
            </div>
          </div>

          <div className="mt-6 border-t border-dashed border-neutral-800 pt-4 text-center font-mono text-[9px] text-neutral-600">
            <p>{t.receiptFooter}</p>
            <p className="mt-1">REF-TX-{hash.slice(0, 8).toUpperCase()}</p>
          </div>

          {/* Social Share */}
          <div className="mt-6 border-t border-neutral-800 pt-5">
            <p className="text-xs font-semibold text-slate-400 mb-3">{t.shareTitle}</p>
            <div className="grid grid-cols-2 gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                id="share-whatsapp-btn"
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white py-2.5 text-xs font-bold transition shadow-md shadow-emerald-950"
              >
                {/* WhatsApp icon */}
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm.001 1.5A8.5 8.5 0 0120.5 12a8.5 8.5 0 01-8.5 8.5c-1.616 0-3.127-.452-4.413-1.237l-.318-.196-3.296.98.98-3.295-.196-.318A8.46 8.46 0 013.5 12a8.5 8.5 0 018.501-8.5zm-2.3 4.5c-.2 0-.524.075-.8.375s-1.05 1.025-1.05 2.5 1.075 2.9 1.225 3.1.425.6 1.05 1.25a13.78 13.78 0 002.575 2c.35.175 1.1.45 2.05.475.95.025 1.625-.225 2.225-.55.6-.325.925-.9.975-1.1.05-.2.05-.375-.025-.55s-.275-.275-.6-.45c-.325-.175-1.925-.95-2.225-1.05-.3-.1-.5-.15-.7.15s-.8 1.05-1 1.25c-.2.2-.375.225-.7.075s-1.35-.5-2.575-1.6c-.95-.85-1.6-1.9-1.775-2.225-.175-.325 0-.5.15-.65.125-.125.275-.325.425-.5.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525s-.7-1.7-.95-2.325c-.25-.6-.5-.525-.7-.525z"/>
                </svg>
                {t.shareWhatsapp}
              </a>
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                id="share-telegram-btn"
                className="flex items-center justify-center gap-2 rounded-xl bg-sky-700 hover:bg-sky-600 text-white py-2.5 text-xs font-bold transition shadow-md shadow-sky-950"
              >
                {/* Telegram icon */}
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.68 7.92c-.12.56-.48.7-.96.44l-2.64-1.96-1.28 1.22c-.14.14-.26.26-.52.26l.18-2.66 4.74-4.28c.2-.18-.04-.28-.32-.1L7.8 14.6l-2.56-.8c-.56-.18-.58-.56.12-.82l10-3.86c.48-.18.9.12.74.72h.54z"/>
                </svg>
                {t.shareTelegram}
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
