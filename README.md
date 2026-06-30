# StellarFund — Fluid Crowdfunding dApp (Soroban Testnet)

> **TR:** Stellar Sarı Kuşak (Yellow Belt) projesi: Çoklu cüzdan desteği (StellarWalletsKit) ve on-chain Soroban akıllı sözleşmesi ile interaktif kitlesel fonlama uygulaması.

StellarFund is a design-first crowdfunding dApp on Stellar Testnet. It visualizes campaign progress not with standard boxy cards, but as a fluid, glowing milestone journey. Users can connect multiple wallets (Freighter, xBull, Lobstr) to donate XLM, pushing the neon progress path forward in real-time.

---

## Live Demo

**[https://stellarfund-crowdfund.vercel.app/fund](https://stellarfund-crowdfund.vercel.app/fund)**

> **TR:** Vercel üzerinde canlı çalışan testnet arayüzü linki.

---

## 🛠️ On-Chain Contract Information

- **Contract ID:** `CCNY74O274PDPMGDS2PU34SYQMIYQWZYCUE4WNM6L4B6AQMXGWXCRIFY`
- **Initial Tx (Goal set to 100 XLM):** [`1864ad3f893eff3bcd572e53f081ccfb9233911c9295c14153cbc2084488e145`](https://stellar.expert/explorer/testnet/tx/1864ad3f893eff3bcd572e53f081ccfb9233911c9295c14153cbc2084488e145)
- **Stellar Expert Explorer:** [View Contract on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CCNY74O274PDPMGDS2PU34SYQMIYQWZYCUE4WNM6L4B6AQMXGWXCRIFY)

> **TR:** Akıllı sözleşme adresi, başlatma işlem özeti ve Stellar Expert gezgin linkleri.

---

## 📸 Screenshots & Previews

### Multi-Wallet Connection Modal (StellarWalletsKit)
*(StellarWalletsKit connection interface showing Freighter, xBull, and Lobstr)*
> **TR Özet:** Cüzdan bağlantı arayüzünde Freighter, xBull ve Lobstr seçeneklerini gösteren modal ekranı.

### Desktop App Interface
*(Aesthetic glowing neon progress timeline, interactive SVG monitors, and custom leaderboard)*
> **TR Özet:** Gelişmiş neon yol haritası, animasyonlu SVG monitörler ve cömert destekçiler liderlik tablosu masaüstü görünümü.

*(Note: Place your screenshots inside `docs/screenshots/` folder as `wallet_modal.png` and `desktop_preview.png`)*

---

## User Workflow Diagram

```mermaid
flowchart TD
    A([🚀 Open StellarFund]) --> B{Connect Wallet\nStellarWalletsKit}
    B --> C[Select Wallet\nFreighter / xBull / Lobstr]
    C --> D[Fetch XLM Balance\nvia Horizon API]
    D --> E[Display Campaign Info\nGoal · Total Raised · Donors]
    E --> F[Enter Donation Amount]
    F --> G{Checks}
    G -- Insufficient Balance --> H([⚠️ Show Insufficient Error\nfriendbot trigger option])
    G -- User Cancels --> I([🚫 Show Rejected Error])
    G -- Valid --> J[Build Donate Transaction]
    J --> K[Sign via Wallet]
    K --> L[Submit to Soroban RPC]
    L -- Success --> M[🎊 Confetti Burst!]
    M --> N[Show TX Hash & Explorer link]
    N --> O[Sync Leaderboard & Progress\nevery 5 seconds]
```

> **TR:** Kullanıcı bağış işlem akış şeması.

---

## Features

- **Multi-Wallet Integration:** Toggle connection modals via `StellarWalletsKit` supporting **Freighter**, **xBull**, and **LOBSTR** in a single click.
- **Fluid Progress SVG Track:** Replaces boxy layout cards with a glowing neon energy cable path. It lights up dynamically as milestones at 25% (Planning), 50% (Development), and 100% (Production) are crossed.
- **On-Chain Leaderboard:** Ranks the top 3 contributors inside the Soroban Rust contract, awarding a custom 👑 crown badge to the top donor.
- **Live Activity Feed:** Periodically polls Horizon API every 5 seconds to display the latest 5 transaction hashes and operation details.
- **On-Chain Milestone Withdrawals (`claim_milestone`):** Allows only the verified campaign owner to claim milestone funds. Spent proof-of-execution links (IPFS) are fully transparent.
- **Comprehensive Error Handling:** Identifies and guides users through `wallet_not_found` (with direct download links), `user_rejected` (signature cancelled), and `insufficient_balance` (with a direct Friendbot testnet faucet button).

> **TR Özet:** Proje; StellarWalletsKit cüzdan modalı, neon SVG yol haritası progress çizgisi, en çok bağış yapan ilk 3 liderlik tablosu, Horizon canlı işlem akışı, akıllı sözleşme aşamalı bütçe çekme ve Friendbot testnet musluğu ile 3 tip hata yönetimini barındırır.

---

## Tech Stack

- Soroban SDK (v26)
- Next.js 14 & TypeScript
- Tailwind CSS
- Stellar CLI (v27)
- `@creit-tech/stellar-wallets-kit`
- `@stellar/stellar-sdk`

> **TR Özet:** Uygulama Next.js 14, Tailwind CSS, TypeScript, Soroban SDK (Rust), `@creit-tech/stellar-wallets-kit` ve `@stellar/stellar-sdk` kütüphaneleriyle inşa edilmiştir.

---

## Local Setup

### Prerequisites
1. Node.js 18+
2. Freighter, xBull, or Lobstr browser extension set to **Testnet**

### Run locally
```bash
git clone https://github.com/deniznizam/stellarfund-crowdfund.git
cd stellarfund-crowdfund
npm install
npm run dev
```

Open [http://localhost:3000/fund](http://localhost:3000/fund).

> **TR Özet:** Projeyi yerelde kurmak için Node.js 18+ sürümünün kurulu olduğundan emin olup repoyu kopyalayın, `npm install` ve `npm run dev` komutlarını çalıştırın.

---

## Yellow Belt Checklist

- [x] StellarWalletsKit multi-wallet implementation (Freighter, xBull, Lobstr)
- [x] 3 error types handled (Not found, Rejected, Insufficient balance)
- [x] Contract deployed on testnet
- [x] Contract called from frontend
- [x] Transaction status visible (pending/success/fail)
- [x] Deployed contract address & TX hash in README
- [x] Live demo link (Vercel)
- [x] Placeholders for screenshots of wallet options attached
- [x] Public GitHub repository -> https://github.com/deniznizam/stellarfund-crowdfund

---

## License

MIT
