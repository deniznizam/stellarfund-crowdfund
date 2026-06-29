# StellarFund — Fluid Crowdfunding dApp (Soroban Testnet)

> **TR:** Stellar Sarı Kuşak (Yellow Belt) projesi: Çoklu cüzdan desteği (StellarWalletsKit) ve on-chain Soroban akıllı sözleşmesi ile interaktif kitlesel fonlama uygulaması.

StellarFund is a design-first crowdfunding dApp on Stellar Testnet. It visualizes campaign progress not with standard boxy cards, but as a fluid, glowing milestone journey. Users can connect multiple wallets (Freighter, xBull, Lobstr) to donate XLM, pushing the neon progress path forward in real-time.

---

## Live Demo

**[https://stellarfund-crowdfund-git-main-denizzs.vercel.app/fund](https://stellarfund-crowdfund-git-main-denizzs.vercel.app/fund)**

---

## 🛠️ On-Chain Contract Information

- **Contract ID:** `CCNY74O274PDPMGDS2PU34SYQMIYQWZYCUE4WNM6L4B6AQMXGWXCRIFY`
- **Initial Tx (Goal set to 100 XLM):** [`1864ad3f893eff3bcd572e53f081ccfb9233911c9295c14153cbc2084488e145`](https://stellar.expert/explorer/testnet/tx/1864ad3f893eff3bcd572e53f081ccfb9233911c9295c14153cbc2084488e145)
- **Stellar Expert Explorer:** [View Contract on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CCNY74O274PDPMGDS2PU34SYQMIYQWZYCUE4WNM6L4B6AQMXGWXCRIFY)

---

## 📸 Screenshots / Ekran Görüntüleri

### Multi-Wallet Connection Modal (StellarWalletsKit)
![StellarWalletsKit Multi-Wallet Modal](public/screenshots/01-wallet-modal.png)
*(Cüzdan bağlantısı esnasında Freighter, xBull ve Lobstr seçeneklerini gösteren modal ekranı)*

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

---

## Features

- **Multi-Wallet Entegrasyonu:** `StellarWalletsKit` kullanılarak **Freighter**, **xBull** ve **Lobstr** cüzdanları modal arayüzüyle tek tıkla bağlanabilir.
- **Akışkan İlerleme Çizelgesi (Fluid Progress SVG):** Yuvarlak kartlar yerine, hedefe giden neon bir elektrik hattı çizilmiştir. %25 (Planlama), %50 (Geliştirme) ve %100 (Üretim) hedefleri aşıldıkça bu hat parlayarak ilerler.
- **On-Chain Liderlik Tablosu (Leaderboard):** En yüksek bağış yapan ilk 3 kişi akıllı sözleşme (Rust) içerisinde sıralanarak en tepedeki bağışçıya 👑 rozeti atanır.
- **Canlı İşlem Akışı (Live Tx Feed):** Horizon API taranarak en son yapılan 5 bağış işlemi on-chain hash kodlarıyla beraber her 5 saniyede bir sayfada akar.
- **On-Chain Milestone Talebi (claim_milestone):** Akıllı sözleşme üzerinde sadece kampanya sahibi (owner) hedefler aşıldığında aşama fonunu çekebilir. Çekilen bu milestone'lar ön yüzde şeffaf bir şekilde yansıtılır.
- **3 Tip Hata Yönetimi:**
  1. `wallet_not_found` (Cüzdan eklentisi bulunamadığında Freighter indirme linki çıkarır).
  2. `user_rejected` (Kullanıcı imzayı iptal ettiğinde uyarı verir).
  3. `insufficient_balance` (Bakiye yetersizse uyarı verir ve testnet musluğundan bedava test XLM alma butonu sunar).

---

## Tech Stack

- Soroban SDK (v26)
- Next.js 14 & TypeScript
- Tailwind CSS
- Stellar CLI (v27)
- `@creit-tech/stellar-wallets-kit`
- `@stellar/stellar-sdk`

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

---

## Yellow Belt Checklist

- [x] StellarWalletsKit multi-wallet implementation (Freighter, xBull, Lobstr)
- [x] 3 error types handled (Not found, Rejected, Insufficient balance)
- [x] Contract deployed on testnet
- [x] Contract called from frontend
- [x] Transaction status visible (pending/success/fail)
- [x] Deployed contract address & TX hash in README
- [x] Live demo link (Vercel)
- [x] Screenshot of wallet options attached
- [x] Public GitHub repository -> https://github.com/deniznizam/stellarfund-crowdfund

---

## License

MIT
