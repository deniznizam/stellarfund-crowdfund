"use client";

import type { Copy } from "@/lib/i18n";
import { formatAddress } from "@/lib/stellar";

type WalletButtonProps = {
  copy: Copy;
  publicKey: string | null;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
};

export function WalletButton({
  copy: t,
  publicKey,
  isConnecting,
  onConnect,
  onDisconnect,
}: WalletButtonProps) {
  if (publicKey) {
    return (
      <div className="flex items-center gap-3">
        <span className="hidden rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300 sm:inline">
          {t.connected}
        </span>
        <code className="rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-300">
          {formatAddress(publicKey, 6, 6)}
        </code>
        <button
          type="button"
          onClick={onDisconnect}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5"
        >
          {t.disconnect}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onConnect}
      disabled={isConnecting}
      className="rounded-xl bg-gradient-to-r from-violet-500 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isConnecting ? t.connecting : t.connectFreighter}
    </button>
  );
}
