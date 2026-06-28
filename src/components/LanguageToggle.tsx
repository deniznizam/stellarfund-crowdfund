"use client";

import type { Locale } from "@/lib/i18n";

type LanguageToggleProps = {
  locale: Locale;
  onChange: (locale: Locale) => void;
};

export function LanguageToggle({ locale, onChange }: LanguageToggleProps) {
  return (
    <div
      className="flex rounded-xl border border-white/10 bg-white/5 p-1"
      role="group"
      aria-label="Language"
    >
      {(["en", "tr"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => onChange(code)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
            locale === code
              ? "bg-violet-500 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
