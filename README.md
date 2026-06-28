# StellarFund — Fluid Crowdfunding dApp (Soroban Testnet)

> **TR:** Stellar Sarı Kuşak (Yellow Belt) projesi: Çoklu cüzdan desteği (StellarWalletsKit) ve on-chain Soroban akıllı sözleşmesi ile interaktif kitlesel fonlama uygulaması.

StellarFund is a design-first crowdfunding dApp on Stellar Testnet. It visualizes campaign progress not with standard boxy cards, but as a fluid, glowing milestone journey. Users can connect multiple wallets (Freighter, xBull, Lobstr) to donate XLM, pushing the neon progress path forward in real-time.

---

## Live Demo

**[https://stellarfund-crowdfund.vercel.app](https://stellarfund-crowdfund.vercel.app)**  
*(Vercel deploy sonrası URL'inizi buraya da ekleyebilirsiniz)*

---

## 🛠️ On-Chain Contract Information

- **Contract ID:** `CB7XVTKGOV6R3YG3C4J47Q6H4FHNOVO7MKNGW4HM3RHVDHQGZCCAITT3`
- **Initial Tx (Goal set to 100 XLM):** [`3c10ebaec1b4592c1cbe99fc719430de5e5d43da455f01a78c3558054096d963`](https://stellar.expert/explorer/testnet/tx/3c10ebaec1b4592c1cbe99fc719430de5e5d43da455f01a78c3558054096d963)
- **Stellar Expert Explorer:** [View Contract on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CB7XVTKGOV6R3YG3C4J47Q6H4FHNOVO7MKNGW4HM3RHVDHQGZCCAITT3)

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
git clone <your-new-repository-url>
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
- [ ] Public GitHub repository

---

## 📈 Future Roadmap / Gelecek Yol Haritası

Based on blockchain crowdfunding research and donor motivation analysis, the future iterations (Blue & Black Belt milestones) of StellarFund will address the following areas:

### 1. Proof-of-Execution & Trust Verification
- **Concept:** To mitigate the "trust gap," campaign owners will not be able to freely withdraw milestone funds.
- **Implementation:** The `claim_milestone` contract method will require an IPFS hash parameter representing proof-of-work (invoices, code repository updates, or project evidence): `claim_milestone(milestone_num, proof_hash)`.

### 2. Social Impact & Soulbound NFTs (SBTs)
- **Concept:** Donors contributing above a specific threshold (e.g., 50 XLM) will receive non-transferable Soulbound Tokens (SBTs) directly minted from the Soroban contract.
- **Implementation:** Acts as verifiable digital proof of social support, providing game-like status upgrades (social proof).

### 3. Outflow & Expense Ledger
- **Concept:** Visualizing spent funds alongside raised funds to provide complete transparency.
- **Implementation:** An interactive timeline showing where and when claimed funds were spent on-chain.

---

> **TR:** Akademik rapor bulguları ve bağışçı motivasyonu analizlerine dayanarak, StellarFund projesinin gelecek sürümleri (Mavi ve Siyah Kuşak aşamaları) şu stratejik geliştirmeleri içerecektir:
>
> 1. **Proof-of-Execution (Yürütme Kanıtı):** Kampanya sahibi hedeflenen aşama fonunu çekerken, IPFS üzerinde saklanan fatura veya kanıt dökümanının hash değerini parametre olarak zincire sunmak zorunda kalacak: `claim_milestone(milestone_num, proof_hash)`.
> 2. **Soulbound NFT (SBT) Başarı Rozetleri:** Belirli bir barajın (Örn: 50 XLM) üzerinde bağış yapan destekçilere Soroban sözleşmesinden doğrudan devredilemez başarı rozetleri (SBT) mint edilecek (Sosyal statü ve oyunlaştırma desteği).
> 3. **Giden Para / Harcama Akışı:** Arayüzde sadece toplanan değil, kontrattan çekilen paraların nereye ve ne zaman harcandığını gösteren akışkan bir harcama tüneli sunulacak.

---

## License
