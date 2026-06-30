"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Confetti } from "@/components/Confetti";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useWallets } from "@/hooks/useWallets";
import {
  getCampaign,
  buildDonateXdr,
  submitSignedXdr,
  classifyError,
  getRecentTransactions,
  CONTRACT_ID,
  RPC_URL,
  HORIZON_URL,
  NETWORK_PASSPHRASE,
  type Campaign,
  type ParsedTx
} from "@/lib/crowdfund";
import { formatXlm } from "@/lib/split";
import { formatAddress, getXlmBalance, fundTestnetAccount } from "@/lib/stellar";
import { Contract, nativeToScVal } from "@stellar/stellar-sdk";
import { Server } from "@stellar/stellar-sdk/rpc";

type Locale = "en" | "tr";
type Category = "environment" | "education" | "health";

type TxState = {
  status: "idle" | "pending" | "success" | "error";
  hash?: string;
  explorerUrl?: string;
  message?: string;
  type?: "wallet_not_found" | "user_rejected" | "insufficient_balance" | "network_error";
};

type PageCopy = {
  title: string;
  tagline: string;
  backToSplitPay: string;
  connected: string;
  disconnect: string;
  connectWallet: string;
  connecting: string;
  campaignStats: string;
  raisedOfGoal: (raised: string, goal: string) => string;
  donorCount: string;
  donateTitle: string;
  donatePlaceholder: string;
  donateBtn: string;
  donatingBtn: string;
  connectWalletToDonate: string;
  insufficientBalance: string;
  leaderboardTitle: string;
  activityTitle: string;
  noDonors: string;
  noActivity: string;
  funcInitialize: string;
  funcFund: string;
  milestonePlanning: string;
  milestonePlanningDesc: string;
  milestoneDevelopment: string;
  milestoneDevelopmentDesc: string;
  milestoneProduction: string;
  milestoneProductionDesc: string;
  activeStatus: string;
  inactiveStatus: string;
  walletNotFoundTitle: string;
  walletNotFoundDesc: string;
  userRejectedTitle: string;
  userRejectedDesc: string;
  insufficientBalanceTitle: string;
  insufficientBalanceDesc: string;
  errorTitle: string;
  txSuccessTitle: string;
  txSuccessMessage: (amount: string) => string;
  viewExplorer: string;
  statusLabel: string;
  addressLabel: string;
  amountLabel: string;
  fundWalletBtn: string;
  fundingWalletBtn: string;
  balanceLabel: string;
  claimBtn: string;
  claimingBtn: string;
  claimedStatus: string;
  lockedStatus: string;
  claimableStatus: string;
  ownerSectionTitle: string;
  totalWithdrawnLabel: string;
  demoModeLabel: string;
  liveModeLabel: string;
  simulationAlert: string;
  
  // Custom Redesign Copy keys
  heroTitle: string;
  heroDesc: string;
  howItWorksTitle: string;
  howItWorksStep1Title: string;
  howItWorksStep1Desc: string;
  howItWorksStep2Title: string;
  howItWorksStep2Desc: string;
  howItWorksStep3Title: string;
  howItWorksStep3Desc: string;
  outflowTunnelTitle: string;
  outflowTunnelDesc: string;
  outflowM1Expense: string;
  outflowM2Expense: string;
  outflowM3Expense: string;
  proofLabel: string;
  remainingBalanceLabel: string;
  remainingBalanceValue: (val: string) => string;
  overdraftWarning: string;
  invalidAmountWarning: string;
  milestoneLabel: string;
  goalTargetLabel: string;
  catEnvLabel: string;
  catEduLabel: string;
  catHealthLabel: string;
  treeTitle: string;
  bookTitle: string;
  heartTitle: string;
  activeCampaignLabel: string;
  victoryTitleEnv: string;
  victoryDescEnv: string;
  victoryTitleEdu: string;
  victoryDescEdu: string;
  victoryTitleHealth: string;
  victoryDescHealth: string;
  closeBtn: string;
  actorLabel: string;
  liveFeedLabel: string;
  signatureRequiredTitle: string;
  signatureRequiredDesc: string;
  phase1Release: string;
  phase2Release: string;
  phase3Release: string;
  receiverLabel: string;
  disbursedAmountLabel: string;
  totalRaisedLabel: string;
  envTitle: string;
  eduTitle: string;
  healthTitle: string;
  phase1Title: string;
  phase2Title: string;
  phase3Title: string;
  trustBadge: string;
};

// Stateless Tooltip component using standard Tailwind hover classes
const Tooltip = ({ content, children }: { content: string; children: React.ReactNode }) => {
  return (
    <span className="relative group inline-flex items-center cursor-help">
      {children}
      <span className="pointer-events-none absolute bottom-full right-[-10px] sm:right-auto sm:left-1/2 sm:-translate-x-1/2 mb-2 w-56 rounded-xl bg-slate-950 border border-white/10 px-3 py-2.5 text-[10px] font-mono text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 shadow-2xl leading-normal break-all select-all">
        {content}
        <span className="absolute top-full right-[16px] sm:right-auto sm:left-1/2 sm:-translate-x-1/2 border-4 border-transparent border-t-slate-950" />
      </span>
    </span>
  );
};

const pageCopy: Record<Locale, PageCopy> = {
  en: {
    title: "StellarFund",
    tagline: "Stellar-Secured Transparent Donation Network",
    backToSplitPay: "← Back to SplitPay Calculator",
    connected: "Connected",
    disconnect: "Disconnect",
    connectWallet: "Connect Wallet",
    connecting: "Connecting…",
    campaignStats: "Campaign Wallet Ledger",
    raisedOfGoal: (raised, goal) => `${raised} XLM raised of ${goal} XLM target`,
    donorCount: "Generous Backers",
    donateTitle: "Support This Project",
    donatePlaceholder: "Enter contribution (XLM)",
    donateBtn: "Make My Donation",
    donatingBtn: "Sending to Smart Contract…",
    connectWalletToDonate: "Connect Wallet to Support",
    insufficientBalance: "Insufficient balance in your wallet.",
    leaderboardTitle: "Most Generous Supporters",
    activityTitle: "Recent Donations & Disbursals",
    noDonors: "No transactions processed yet. Be the first to back this project!",
    noActivity: "No ledger transactions detected yet on Testnet.",
    funcInitialize: "Campaign Deployed",
    funcFund: "Donation",
    milestonePlanning: "Phase 1: Planning & Setup (25%)",
    milestonePlanningDesc: "Creation of initial specifications, core architecture setup, and developer environments.",
    milestoneDevelopment: "Phase 2: Development & Audit (50%)",
    milestoneDevelopmentDesc: "Soroban contract deployments, testing protocols on Stellar Testnet, and client SDK integration.",
    milestoneProduction: "Phase 3: Launch & Mainnet (100%)",
    milestoneProductionDesc: "Final production release, third-party security audits, and global launch.",
    activeStatus: "Unlocked",
    inactiveStatus: "Locked",
    walletNotFoundTitle: "Wallet Extension Not Found",
    walletNotFoundDesc: "Freighter, xBull, or Lobstr extension was not detected. Please install one of them to proceed.",
    userRejectedTitle: "Signature Declined",
    userRejectedDesc: "The signing request was rejected in your wallet. Feel free to try again when ready.",
    insufficientBalanceTitle: "Insufficient Account Balance",
    insufficientBalanceDesc: "You don't have enough XLM in your testnet wallet. Click below to request test tokens.",
    errorTitle: "Transaction Failed",
    txSuccessTitle: "Donation Complete!",
    txSuccessMessage: (amount) => `Thank you! You successfully contributed ${amount} XLM to the crowdfunding campaign.`,
    viewExplorer: "Verify on Stellar Expert →",
    statusLabel: "Status",
    addressLabel: "Address",
    amountLabel: "Amount",
    fundWalletBtn: "Request Free Test XLM",
    fundingWalletBtn: "Funding Account…",
    balanceLabel: "Current Balance",
    claimBtn: "Disburse Milestone Funds",
    claimingBtn: "Withdrawing Funds…",
    claimedStatus: "Released & Spent",
    lockedStatus: "Locked in Escrow",
    claimableStatus: "Ready to Disburse",
    ownerSectionTitle: "Campaign Manager Portal",
    totalWithdrawnLabel: "Withdrawn Funds",
    demoModeLabel: "Demo Simulation Mode",
    liveModeLabel: "Live Smart Contract",
    simulationAlert: "You are currently exploring the interactive simulation dashboard. You can mock donations and withdraw milestone funds.",
    
    // Custom Redesign Copy values
    heroTitle: "Every Donation Reaches Its True Purpose",
    heroDesc: "With StellarFund, your donations are kept in smart contract vaults. The creator can disburse funds step-by-step only upon proving milestone completions with photos and receipts.",
    howItWorksTitle: "How StellarFund Protects Your Giving",
    howItWorksStep1Title: "Donate",
    howItWorksStep1Desc: "Securely link your Stellar wallet and choose your support amount. Your donation is immediately recorded.",
    howItWorksStep2Title: "Funds Remain Secure",
    howItWorksStep2Desc: "All donations are locked inside a secure on-chain contract vault. Nobody can withdraw it at once.",
    howItWorksStep3Title: "Disbursed Step-by-Step",
    howItWorksStep3Desc: "The creator receives funds only after verifying progress milestones (photos, receipts, reports) step-by-step.",
    outflowTunnelTitle: "Where Does Your Money Go?",
    outflowTunnelDesc: "Track where, when, and why the withdrawn project budget is spent, with proof of execution.",
    outflowM1Expense: "Hosting infrastructure setup, domain registration, and API keys activation.",
    outflowM2Expense: "Smart contract independent code audit fees, integration testing, and bug bounties.",
    outflowM3Expense: "Mainnet deployment costs, public marketing campaigns, and licensing.",
    proofLabel: "Proof-of-Execution Hash (IPFS)",
    remainingBalanceLabel: "Estimated Post-Donation Balance",
    remainingBalanceValue: (val) => `${val} XLM`,
    overdraftWarning: "⚠️ This donation amount exceeds your current wallet balance.",
    invalidAmountWarning: "⚠️ Please enter an amount greater than 0.",
    milestoneLabel: "Milestone Progress",
    goalTargetLabel: "Goal Target",
    catEnvLabel: "Nature & Forests",
    catEduLabel: "Educational Support",
    catHealthLabel: "Health & Medical Support",
    treeTitle: "Forestry Campaign Progress Visualization",
    bookTitle: "Educational Book Support Progress Visualization",
    heartTitle: "Medical Equipment Campaign Live Pulse Monitor",
    activeCampaignLabel: "Selected Campaign Target",
    victoryTitleEnv: "Saplings planted!",
    victoryDescEnv: "Your contribution sprouted new trees in the forest timeline!",
    victoryTitleEdu: "Knowledge shared!",
    victoryDescEdu: "Your contribution enabled more students to receive tech books!",
    victoryTitleHealth: "Lives touched!",
    victoryDescHealth: "Your donation provided vital diagnostic devices for the health clinic!",
    closeBtn: "Close Dashboard",
    actorLabel: "From Address",
    liveFeedLabel: "Live Ledger Activity",
    signatureRequiredTitle: "Signature Required",
    signatureRequiredDesc: "Please review and authorize the transaction signing request in your connected wallet.",
    phase1Release: "Phase 1: Planning & Setup (25%)",
    phase2Release: "Phase 2: Development & Audit (25%)",
    phase3Release: "Phase 3: Launch & Mainnet (50%)",
    receiverLabel: "Receiver Address",
    disbursedAmountLabel: "Amount Disbursed",
    totalRaisedLabel: "Total Contributions",
    envTitle: "Reforestation and Forestry Campaign",
    eduTitle: "Books and Educational Support for Underprivileged Schools",
    healthTitle: "Medical Equipment and Patient Supplies for Public Hospitals",
    phase1Title: "Phase 1: Planning (25%)",
    phase2Title: "Phase 2: Development (50%)",
    phase3Title: "Phase 3: Production (100%)",
    trustBadge: "Stellar Secured"
  },
  tr: {
    title: "StellarFund",
    tagline: "Stellar Akıllı Sözleşmesiyle Korunan Şeffaf Bağış Ağı",
    backToSplitPay: "← SplitPay Hesaplayıcısına Dön",
    connected: "Bağlandı",
    disconnect: "Bağlantıyı Kes",
    connectWallet: "Cüzdanı Bağla",
    connecting: "Bağlanıyor…",
    campaignStats: "Kampanya Bütçe Detayları",
    raisedOfGoal: (raised, goal) => `Hedeflenen ${goal} XLM bütçenin ${raised} XLM'i toplandı`,
    donorCount: "Destekçi Sayısı",
    donateTitle: "Bu Projeye Destek Ol",
    donatePlaceholder: "Destek miktarını girin (XLM)",
    donateBtn: "Bağışımı Yap",
    donatingBtn: "Bağışınız gönderiliyor...",
    connectWalletToDonate: "Destek Olmak için Cüzdanı Bağla",
    insufficientBalance: "Cüzdanınızda yeterli bakiye bulunmamaktadır.",
    leaderboardTitle: "En Cömert Destekçiler",
    activityTitle: "Son Bağışlar ve Harcamalar",
    noDonors: "Henüz bağış yapılmadı. İlk destekçi siz olabilirsiniz!",
    noActivity: "Testnet üzerinde henüz işlem algılanmadı.",
    funcInitialize: "Kampanya Başlatıldı",
    funcFund: "Bağış Gönderimi",
    milestonePlanning: "Aşama 1: Planlama & Kurulum (%25)",
    milestonePlanningDesc: "Proje planlama dokümanları, sunucu altyapısının kurulumu ve çekirdek geliştirme süreçleri.",
    milestoneDevelopment: "Aşama 2: Geliştirme & Denetim (%25)",
    milestoneDevelopmentDesc: "Akıllı sözleşmelerin kurulması, Stellar Testnet entegrasyonu ve kod denetimleri.",
    milestoneProduction: "Aşama 3: Yayına Giriş & Mainnet (%50)",
    milestoneProductionDesc: "Projenin ana ağda yayına alınması, halka açık dağıtımı ve nihai testleri.",
    activeStatus: "Kilit Açıldı",
    inactiveStatus: "Kilitli",
    walletNotFoundTitle: "Cüzdan Eklentisi Bulunamadı",
    walletNotFoundDesc: "Freighter, xBull veya Lobstr eklentisi tespit edilemedi. Lütfen cüzdan eklentisini yükleyip sayfayı yenileyin.",
    userRejectedTitle: "İmza Talebi Reddedildi",
    userRejectedDesc: "Cüzdanınızdaki imzalama işlemi iptal edildi. Hazır olduğunuzda işlemi tekrar deneyebilirsiniz.",
    insufficientBalanceTitle: "Yetersiz Bakiye",
    insufficientBalanceDesc: "Cüzdanınızda işlem için yeterli XLM bulunmuyor. Aşağıdan test cüzdanınıza ücretsiz XLM talep edebilirsiniz.",
    errorTitle: "İşlem Başarısız",
    txSuccessTitle: "Bağışınız Ulaştı!",
    txSuccessMessage: (amount) => `Katkınız için teşekkür ederiz! ${amount} XLM bağışınız akıllı sözleşme kasasına güvenle aktarıldı.`,
    viewExplorer: "İşlemi Stellar Gezgininde Doğrula →",
    statusLabel: "Durum",
    addressLabel: "Adres",
    amountLabel: "Tutar",
    fundWalletBtn: "Test Cüzdanına Ücretsiz XLM Yükle",
    fundingWalletBtn: "Yükleniyor…",
    balanceLabel: "Cüzdan Bakiyeniz",
    claimBtn: "Hakedişi Çek",
    claimingBtn: "Bütçe Çekiliyor…",
    claimedStatus: "Bütçe Çekildi (Kanıtlandı)",
    lockedStatus: "Kilitli (Aşama Bekleniyor)",
    claimableStatus: "Hak Edildi (Çekilebilir)",
    ownerSectionTitle: "Kampanya Yönetim Paneli",
    totalWithdrawnLabel: "Çekilen Toplam Bütçe",
    demoModeLabel: "Simülasyon Modu",
    liveModeLabel: "Canlı Akıllı Sözleşme",
    simulationAlert: "Değerlendirme kolaylığı için şu an Simülasyon Modundasınız. Gerçek para harcamadan test bağışları yapabilir ve bütçe aşamalarını onaylayabilirsiniz.",
    
    // Custom Redesign Copy values
    heroTitle: "Her Bağış Hak Ettiği Yere Ulaşsın",
    heroDesc: "StellarFund ile bağışlarınız akıllı sözleşme kasalarında tutulur. Proje sahibi parayı ancak aşamaları tamamladığını fotoğraf ve faturalarla kanıtladığında, adım adım çekebilir.",
    howItWorksTitle: "Güvenli Bağış Sistemi Nasıl Çalışır?",
    howItWorksStep1Title: "Bağış Yap",
    howItWorksStep1Desc: "Stellar cüzdanınızı bağlayın ve istediğiniz miktarda destek olun. Bağışınız anında blokzincirine kaydedilir.",
    howItWorksStep2Title: "Paran Güvende Kalsın",
    howItWorksStep2Desc: "Toplanan tüm fonlar akıllı sözleşmede kilitli kalır. Proje sahibi bütçeyi tek seferde alamaz.",
    howItWorksStep3Title: "Adım Adım Harcansın",
    howItWorksStep3Desc: "Proje sahibi bütçeyi ancak her aşamayı tamamladığını (fatura, fotoğraf vb. kanıtlarla) sunduğunda adım adım çekebilir.",
    outflowTunnelTitle: "Paranız Nereye Gidiyor?",
    outflowTunnelDesc: "Hak edilen bütçelerin hangi aşamada, tam olarak ne zaman ve hangi kanıtlarla çekildiğini şeffafça izleyin.",
    outflowM1Expense: "Hosting sunucu kurulumları, alan adı tescili ve API sunucu kiralama masrafları.",
    outflowM2Expense: "Akıllı sözleşme bağımsız denetim (audit) ücretleri, entegrasyon testleri ve hata ödül bütçeleri.",
    outflowM3Expense: "Mainnet dağıtım maliyetleri, pazarlama kampanyaları, lisanslama ve yayın masrafları.",
    proofLabel: "IPFS Kanıt Belgesi",
    remainingBalanceLabel: "Kalan Tahmini Bakiyeniz",
    remainingBalanceValue: (val) => `${val} XLM`,
    overdraftWarning: "⚠️ Girdiğiniz tutar cüzdan bakiyenizi aşmaktadır.",
    invalidAmountWarning: "⚠️ Lütfen sıfırdan büyük geçerli bir miktar girin.",
    milestoneLabel: "Yol Haritası Durumu",
    goalTargetLabel: "Hedef Miktar",
    catEnvLabel: "Doğa ve Orman",
    catEduLabel: "Eğitime Destek",
    catHealthLabel: "Sağlık ve Tıp",
    treeTitle: "Doğa & Orman Kampanyası Görsel İlerlemesi",
    bookTitle: "Kitap Desteği Görsel İlerlemesi",
    heartTitle: "Tıbbi Cihaz Kampanyası Canlı Nabız Göstergesi",
    activeCampaignLabel: "Aktif Destek Kategorisi",
    victoryTitleEnv: "Fidanlar Toprakla Buluşuyor!",
    victoryDescEnv: "Katkınız sayesinde doğaya yeni fidanlar kazandırdınız! Destekleriniz toprakla buluşacak.",
    victoryTitleEdu: "Eğitime Işık Oldunuz!",
    victoryDescEdu: "Katkınız sayesinde öğrencilerimiz teknoloji kitaplarına kavuşuyor. Teşekkürler!",
    victoryTitleHealth: "Bir Hayata Dokundunuz!",
    victoryDescHealth: "Katkınız sayesinde yerel hastanemize hayati tıbbi teşhis cihazları kazandırılıyor. Ritimler güçlendi!",
    closeBtn: "Kapat ve Paneli İncele",
    actorLabel: "Gönderen",
    liveFeedLabel: "Anlık Akış Günlüğü",
    signatureRequiredTitle: "İmza Talebi Bekleniyor",
    signatureRequiredDesc: "Lütfen cüzdanınızda açılan pencereden işlem imzalama talebini gözden geçirin ve onaylayın.",
    phase1Release: "Aşama 1: Planlama & Kurulum (%25)",
    phase2Release: "Aşama 2: Geliştirme & Denetim (%25)",
    phase3Release: "Aşama 3: Yayına Giriş & Mainnet (%50)",
    receiverLabel: "Alıcı Adresi",
    disbursedAmountLabel: "Ödenen Bütçe",
    totalRaisedLabel: "Toplanan Toplam Katkı",
    envTitle: "Ağaçlandırma ve Doğa Kampanyası",
    eduTitle: "Dezavantajlı Okullara Kitap ve/veya Donanım Desteği",
    healthTitle: "Devlet Hastanelerine Tıbbi Cihaz ve Ekipman Desteği",
    phase1Title: "Aşama 1: Planlama & Kurulum (%25)",
    phase2Title: "Aşama 2: Geliştirme & Entegrasyon (%50)",
    phase3Title: "Aşama 3: Yayına Giriş & Mainnet (%100)",
    trustBadge: "Stellar Blokzincir Korumalı"
  }
};

export const getMilestoneDetails = (category: Category, phase: number, locale: string) => {
  const isTr = locale === "tr";
  if (category === "environment") {
    if (phase === 1) {
      return {
        title: isTr ? "Aşama 1: Arazi Hazırlığı & Fidan Alımı (%25)" : "Phase 1: Land Prep & Sapling Sourcing (25%)",
        desc: isTr ? "Ekim alanının temizlenmesi, toprak analizinin yapılması ve dikilecek fidanların satın alınması." : "Clearing the planting zone, performing soil analysis, and purchasing the saplings.",
        expense: isTr ? "Toprak hazırlığı işçiliği, fidan nakliyesi ve sertifikalı fidan alım bedelleri." : "Soil preparation labor, sapling logistics, and certified sapling purchase costs."
      };
    }
    if (phase === 2) {
      return {
        title: isTr ? "Aşama 2: Dikim & İlk Can Suyu (%25)" : "Phase 2: Planting & Initial Watering (25%)",
        desc: isTr ? "Fidanların dikiminin gönüllülerce tamamlanması ve ilk can sularının verilmesi." : "Volunteers planting the saplings and providing the initial water feeds.",
        expense: isTr ? "Ekim ekipmanları kiralanması, gönüllü koordinasyon giderleri ve su tedariği." : "Planting tool rentals, volunteer coordination costs, and water supplies."
      };
    }
    return {
      title: isTr ? "Aşama 3: Koruma Çiti & 1 Yıllık Bakım (%50)" : "Phase 3: Fencing & 1-Year Care (50%)",
      desc: isTr ? "Fidanların yaban hayatından korunması için etrafa çit çekilmesi ve damla sulama altyapısının kurulması." : "Installing protective fencing against wildlife and setting up drip-irrigation systems.",
      expense: isTr ? "Koruma çit teli ve kazıkları, damla sulama boruları alımı ve 1 yıllık sulama/bakım bütçesi." : "Fencing materials, drip tubes, and 1-year periodic watering and care registry."
    };
  } else if (category === "education") {
    if (phase === 1) {
      return {
        title: isTr ? "Aşama 1: İhtiyaç Tespiti & Kitap Siparişi (%25)" : "Phase 1: Needs Assessment & Book Orders (25%)",
        desc: isTr ? "Okullarla görüşerek eksik kitap ve ders materyali listelerinin çıkarılması ve siparişlerin geçilmesi." : "Meeting with schools to list missing books and tech materials, and placing purchase orders.",
        expense: isTr ? "Okul ziyaret lojistikleri, yayın evleri kitap sipariş avansları ve tablet tedarik kaparoları." : "School logistics, publisher booking fees, and initial hardware pre-orders."
      };
    }
    if (phase === 2) {
      return {
        title: isTr ? "Aşama 2: Sevkiyat & Sınıf Kurulumları (%25)" : "Phase 2: Shipping & Classroom Setup (25%)",
        desc: isTr ? "Satın alınan kitapların ve ders materyallerinin okullara nakledilmesi, sınıflardaki dolaplara yerleştirilmesi." : "Transporting the books and hardware to schools and setting up library/classroom shelves.",
        expense: isTr ? "Kargo/nakliye ücretleri, kütüphane dolapları imalatı ve kurulum ekibi masrafları." : "Logistics freight fees, library furniture manufacturing, and installer daily wages."
      };
    }
    return {
      title: isTr ? "Aşama 3: Öğretmen Eğitimleri & Eğitim Üyelikleri (%50)" : "Phase 3: Teacher Training & Platform Access (50%)",
      desc: isTr ? "Öğretmenlere kitapların ve tabletlerin müfredata uygun kullanımı için eğitimler verilmesi, 1 yıllık online üyelikler açılması." : "Providing curriculum training sessions for teachers and setting up 1-year educational platform memberships.",
      expense: isTr ? "Eğitmen kaşeleri, 1 yıllık online eğitim platformu lisans ödemeleri ve teknik destek bütçesi." : "Trainer honorariums, 1-year online learning platform licenses, and customer support."
    };
  } else {
    if (phase === 1) {
      return {
        title: isTr ? "Aşama 1: Tıbbi Cihaz Siparişi & Lojistik (%25)" : "Phase 1: Equipment Order & Logistics (25%)",
        desc: isTr ? "Hastanelerin acil tıbbi cihaz ihtiyaçlarının kesinleştirilmesi, üretici siparişleri ve gümrük işlemleri." : "Finalizing urgent diagnostic device choices, ordering from medical manufacturers, and clearing customs.",
        expense: isTr ? "Cihaz sipariş depozitoları, gümrük vergileri ve tıbbi nakliye sigorta poliçesi bedelleri." : "Medical device deposits, import customs clearances, and medical shipping insurances."
      };
    }
    if (phase === 2) {
      return {
        title: isTr ? "Aşama 2: Hastane Teslimatı & Kurulum (%25)" : "Phase 2: Hospital Delivery & Calibration (25%)",
        desc: isTr ? "Cihazların hastanelere teslim edilmesi, steril odalarda kurulumlarının yapılarak teknik testlerinin tamamlanması." : "Delivering equipment to clinics, setting up in sterile zones, and finalizing calibration tests.",
        expense: isTr ? "Teknik ekip yol/konaklama masrafları, lisanslı kalibrasyon test kitleri ve onay harçları." : "Field engineer service fees, licensed calibration test runs, and official safety stamps."
      };
    }
    return {
      title: isTr ? "Aşama 3: Personel Eğitimi & 1 Yıllık Sarf Deposu (%50)" : "Phase 3: Staff Training & 1-Year Supplies (50%)",
      desc: isTr ? "Doktor ve hemşirelere cihazların kullanım eğitimlerinin verilmesi, hastaların kabulü ve 1 yıllık sarf malzeme deposunun doldurulması." : "Providing device usage training for medical staff, admitting patients, and stocking 1 year of medical supplies.",
      expense: isTr ? "Kullanıcı eğitimi sertifikasyon bedelleri, 1 yıllık filtre, iğne ve teşhis sarf malzemesi alım bütçesi." : "Staff training certifications, and a 1-year stock of filters, test kits, and diagnostic consumables."
    };
  }
};

// Independent Demo States for categories
type DemoState = {
  campaign: Campaign;
  activities: ParsedTx[];
};

const INITIAL_DEMO_STATES: Record<Category, DemoState> = {
  environment: {
    campaign: {
      title: "Reforestation and Cyber-Forestry Campaign",
      goal: BigInt(100_0000000), // 100 XLM
      total: BigInt(35_0000000), // 35 XLM (35%)
      donor_count: 5,
      top_donors: [
        { address: "GB2X...R4PQ (Alice)", amount: BigInt(20_0000000) },
        { address: "GD4Y...K7LT (Bob)", amount: BigInt(10_0000000) },
        { address: "GC3Z...M2NS (Charlie)", amount: BigInt(5_0000000) }
      ],
      owner: "GDT6X...P9QW",
      m1_claimed: true,
      m2_claimed: false,
      m3_claimed: false
    },
    activities: [
      {
        id: "op1",
        hash: "env_tx_1111",
        createdAt: new Date(Date.now() - 45000).toISOString(),
        functionName: "fund",
        donor: "GB2X...R4PQ (Alice)",
        amount: 20
      },
      {
        id: "op2",
        hash: "env_tx_2222",
        createdAt: new Date(Date.now() - 250000).toISOString(),
        functionName: "fund",
        donor: "GD4Y...K7LT (Bob)",
        amount: 10
      },
      {
        id: "op3",
        hash: "env_tx_3333",
        createdAt: new Date(Date.now() - 800000).toISOString(),
        functionName: "fund",
        donor: "GC3Z...M2NS (Charlie)",
        amount: 5
      }
    ]
  },
  education: {
    campaign: {
      title: "Tech Books and Hardware for Underprivileged Schools",
      goal: BigInt(150_0000000), // 150 XLM
      total: BigInt(90_0000000), // 90 XLM (60%)
      donor_count: 6,
      top_donors: [
        { address: "GDDX...T5LQ (Dave)", amount: BigInt(45_0000000) },
        { address: "GCEY...R2NW (Eva)", amount: BigInt(30_0000000) },
        { address: "GCAZ...B7MS (Frank)", amount: BigInt(15_0000000) }
      ],
      owner: "GDT6X...P9QW",
      m1_claimed: true,
      m2_claimed: true,
      m3_claimed: false
    },
    activities: [
      {
        id: "op1",
        hash: "edu_tx_1111",
        createdAt: new Date(Date.now() - 15000).toISOString(),
        functionName: "fund",
        donor: "GDDX...T5LQ (Dave)",
        amount: 45
      },
      {
        id: "op2",
        hash: "edu_tx_2222",
        createdAt: new Date(Date.now() - 180000).toISOString(),
        functionName: "fund",
        donor: "GCEY...R2NW (Eva)",
        amount: 30
      },
      {
        id: "op3",
        hash: "edu_tx_3333",
        createdAt: new Date(Date.now() - 420000).toISOString(),
        functionName: "fund",
        donor: "GCAZ...B7MS (Frank)",
        amount: 15
      }
    ]
  },
  health: {
    campaign: {
      title: "Medical Diagnostic Equipment and Patient Supplies",
      goal: BigInt(200_0000000), // 200 XLM
      total: BigInt(20_0000000), // 20 XLM (10%)
      donor_count: 3,
      top_donors: [
        { address: "GCTX...R9PL (Grace)", amount: BigInt(10_0000000) },
        { address: "GCKY...A2BS (Hank)", amount: BigInt(7_0000000) },
        { address: "GCEY...Q9NW (Ivy)", amount: BigInt(3_0000000) }
      ],
      owner: "GDT6X...P9QW",
      m1_claimed: false,
      m2_claimed: false,
      m3_claimed: false
    },
    activities: [
      {
        id: "op1",
        hash: "h_tx_1111",
        createdAt: new Date(Date.now() - 120000).toISOString(),
        functionName: "fund",
        donor: "GCTX...R9PL (Grace)",
        amount: 10
      },
      {
        id: "op2",
        hash: "h_tx_2222",
        createdAt: new Date(Date.now() - 600000).toISOString(),
        functionName: "fund",
        donor: "GCKY...A2BS (Hank)",
        amount: 7
      },
      {
        id: "op3",
        hash: "h_tx_3333",
        createdAt: new Date(Date.now() - 1200000).toISOString(),
        functionName: "fund",
        donor: "GCEY...Q9NW (Ivy)",
        amount: 3
      }
    ]
  }
};

export function CrowdfundPage() {
  const [locale, setLocale] = useState<Locale>("en");
  const t = pageCopy[locale];

  // Active Category State
  const [activeTab, setActiveTab] = useState<Category>("environment");

  // Demo mode state toggle (Default is true to show interactive simulator instantly)
  const [isDemoMode, setIsDemoMode] = useState(true);

  // Independent Demo State
  const [demoStates, setDemoStates] = useState<Record<Category, DemoState>>(INITIAL_DEMO_STATES);

  // Live Campaign & Activities State
  const [liveCampaign, setLiveCampaign] = useState<Campaign | null>(null);
  const [liveActivities, setLiveActivities] = useState<ParsedTx[]>([]);

  // Wallet State
  const { publicKey, isConnecting, error: walletError, openModal, disconnect, signXdr } = useWallets();
  const [userBalance, setUserBalance] = useState<string | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [isFunding, setIsFunding] = useState(false);

  // Form State
  const [donateAmount, setDonateAmount] = useState("");
  const [myDemoDonations, setMyDemoDonations] = useState<Record<Category, number>>({
    environment: 0,
    education: 0,
    health: 0
  });
  const [txState, setTxState] = useState<TxState>({ status: "idle" });
  const [showConfetti, setShowConfetti] = useState(false);
  const [isClaiming, setIsClaiming] = useState<number | null>(null);

  // Success Victory Modal State
  const [showVictoryOverlay, setShowVictoryOverlay] = useState(false);
  const [victoryDonationAmount, setVictoryDonationAmount] = useState("0");

  // Active campaign statistics mapping
  const campaign = useMemo(() => {
    return isDemoMode ? demoStates[activeTab].campaign : liveCampaign;
  }, [isDemoMode, demoStates, activeTab, liveCampaign]);

  const activities = useMemo(() => {
    return isDemoMode ? demoStates[activeTab].activities : liveActivities;
  }, [isDemoMode, demoStates, activeTab, liveActivities]);

  // Campaign progress calculation
  const progressPercent = useMemo(() => {
    if (!campaign || campaign.goal === BigInt(0)) return 0;
    const pct = Number((campaign.total * BigInt(100)) / campaign.goal);
    return Math.min(pct, 100);
  }, [campaign]);

  // Owner authentication
  const isOwner = useMemo(() => {
    if (!campaign || !publicKey) return false;
    return isDemoMode ? true : campaign.owner === publicKey;
  }, [campaign, publicKey, isDemoMode]);

  // Total funds withdrawn by owner based on claimed milestones
  const totalWithdrawn = useMemo(() => {
    if (!campaign) return 0;
    let withdrawn = 0;
    const totalFloat = Number(campaign.goal) / 10_000_000;
    if (campaign.m1_claimed) withdrawn += totalFloat * 0.25;
    if (campaign.m2_claimed) withdrawn += totalFloat * 0.25;
    if (campaign.m3_claimed) withdrawn += totalFloat * 0.50;
    return withdrawn;
  }, [campaign]);

  // Dynamic balance prediction helper
  const remainingBalance = useMemo(() => {
    if (!userBalance) return null;
    const current = Number(userBalance);
    const donation = Number(donateAmount);
    if (isNaN(donation) || donation <= 0) return null;
    const rem = current - donation;
    return rem >= 0 ? formatXlm(rem) : null;
  }, [userBalance, donateAmount]);

  // Dynamic input validator
  const inputValidation = useMemo(() => {
    const amt = Number(donateAmount);
    if (donateAmount === "") return { valid: true };
    if (isNaN(amt) || amt <= 0) return { valid: false, reason: t.invalidAmountWarning };
    if (userBalance && amt > Number(userBalance)) return { valid: false, reason: t.overdraftWarning };
    return { valid: true };
  }, [donateAmount, userBalance, t]);

  // Fetch campaign info
  const fetchCampaignData = useCallback(async () => {
    if (isDemoMode) return;
    try {
      const data = await getCampaign();
      setLiveCampaign(data);
    } catch (err) {
      console.error("Failed to fetch campaign data:", err);
    }
  }, [isDemoMode]);

  // Fetch live activity feed from Horizon
  const fetchActivityFeed = useCallback(async () => {
    if (isDemoMode) return;
    try {
      const txs = await getRecentTransactions(CONTRACT_ID);
      setLiveActivities(txs);
    } catch (err) {
      console.error("Failed to fetch Horizon activity:", err);
    }
  }, [isDemoMode]);

  // Fetch balance
  const fetchBalance = useCallback(async () => {
    if (!publicKey) return;
    setIsBalanceLoading(true);
    try {
      const bal = await getXlmBalance(publicKey);
      setUserBalance(bal);
    } catch (err) {
      console.error("Failed to fetch balance:", err);
      setUserBalance("0");
    } finally {
      setIsBalanceLoading(false);
    }
  }, [publicKey]);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchCampaignData(), fetchActivityFeed(), fetchBalance()]);
  }, [fetchCampaignData, fetchActivityFeed, fetchBalance]);

  useEffect(() => {
    if (publicKey) {
      void fetchBalance();
    } else {
      setUserBalance(null);
    }
  }, [publicKey, fetchBalance]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    const interval = setInterval(() => {
      void fetchCampaignData();
      void fetchActivityFeed();
      if (publicKey) {
        void fetchBalance();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchCampaignData, fetchActivityFeed, fetchBalance, publicKey]);

  useEffect(() => {
    if (walletError) {
      setTxState({
        status: "error",
        type: walletError.type as TxState["type"],
        message: walletError.message
      });
    }
  }, [walletError]);

  const handleFund = async () => {
    if (!publicKey) return;
    setIsFunding(true);
    setTxState({ status: "idle" });
    try {
      await fundTestnetAccount(publicKey);
      await new Promise(r => setTimeout(r, 2000));
      await fetchBalance();
    } catch (err) {
      console.error(err);
      setTxState({
        status: "error",
        type: "network_error",
        message: "Failed to fund wallet from Friendbot."
      });
    } finally {
      setIsFunding(false);
    }
  };

  // Submit claim milestone transaction
  const handleClaimMilestone = async (milestoneNum: number) => {
    if (isDemoMode) {
      setIsClaiming(milestoneNum);
      setTxState({ status: "pending" });
      await new Promise(r => setTimeout(r, 1200));
      
      setDemoStates(prev => {
        const catState = { ...prev[activeTab] };
        const campaignUpdate = { ...catState.campaign };
        campaignUpdate.m1_claimed = milestoneNum === 1 ? true : campaignUpdate.m1_claimed;
        campaignUpdate.m2_claimed = milestoneNum === 2 ? true : campaignUpdate.m2_claimed;
        campaignUpdate.m3_claimed = milestoneNum === 3 ? true : campaignUpdate.m3_claimed;
        catState.campaign = campaignUpdate;
        return { ...prev, [activeTab]: catState };
      });

      setTxState({
        status: "success",
        hash: `demo_claim_hash_m${milestoneNum}`,
        explorerUrl: "#"
      });
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5500);
      setIsClaiming(null);
      return;
    }

    if (!publicKey) return;
    setIsClaiming(milestoneNum);
    setTxState({ status: "pending" });
    try {
      const server = new Server(RPC_URL);
      const { Horizon, TransactionBuilder, BASE_FEE } = await import("@stellar/stellar-sdk");
      const account = await new Horizon.Server(HORIZON_URL).loadAccount(publicKey);
      
      const tx = new TransactionBuilder(account, { fee: String(Number(BASE_FEE) * 10), networkPassphrase: NETWORK_PASSPHRASE })
        .addOperation(new Contract(CONTRACT_ID).call(
          "claim_milestone",
          nativeToScVal(milestoneNum, { type: "u32" })
        ))
        .setTimeout(30).build();
      
      const prepared = await server.prepareTransaction(tx);
      const xdrString = prepared.toXDR();
      const signedXdr = await signXdr(xdrString);
      const result = await submitSignedXdr(signedXdr);

      setTxState({
        status: "success",
        hash: result.hash,
        explorerUrl: result.explorerUrl,
        message: `Milestone ${milestoneNum} funds successfully withdrawn to your wallet.`
      });
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
      void refreshAll();
    } catch (err) {
      console.error("Claim failed:", err);
      const classified = classifyError(err);
      setTxState({
        status: "error",
        type: classified.type as TxState["type"],
        message: classified.message
      });
    } finally {
      setIsClaiming(null);
    }
  };

  const handleDonateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(donateAmount);
    
    if (isDemoMode) {
      setTxState({ status: "pending" });
      await new Promise(r => setTimeout(r, 1000));
      
      setDemoStates(prev => {
        const catState = prev[activeTab];
        const donorAmountScVal = BigInt(Math.round(amount * 10_000_000));
        
        // Deep copy the campaign properties safely
        const campaignUpdate = {
          ...catState.campaign,
          total: catState.campaign.total + donorAmountScVal,
          donor_count: catState.campaign.donor_count + 1,
          top_donors: catState.campaign.top_donors.map(d => ({ ...d }))
        };

        // Dynamic leaderboard updates in simulation mode
        const donorAddress = publicKey || "G-SIZ...CUZDAN (Siz)";
        let found = false;
        
        const updatedDonors = campaignUpdate.top_donors.map(d => {
          if (d.address === donorAddress || (d.address.includes("(Siz)") && donorAddress === "G-SIZ...CUZDAN (Siz)")) {
            found = true;
            return { ...d, amount: d.amount + donorAmountScVal };
          }
          return d;
        });

        if (!found) {
          updatedDonors.push({
            address: donorAddress,
            amount: donorAmountScVal
          });
        }

        // Sort descending and keep top 3
        campaignUpdate.top_donors = updatedDonors
          .sort((a, b) => (b.amount > a.amount ? 1 : b.amount < a.amount ? -1 : 0))
          .slice(0, 3);

        const updatedActivities = [
          {
            id: `op_${Date.now()}`,
            hash: `demo_tx_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            functionName: "fund",
            donor: donorAddress,
            amount
          },
          ...catState.activities.map(a => ({ ...a }))
        ];

        setMyDemoDonations(prevMy => ({
          ...prevMy,
          [activeTab]: prevMy[activeTab] + amount
        }));

        return {
          ...prev,
          [activeTab]: {
            campaign: campaignUpdate,
            activities: updatedActivities
          }
        };
      });

      setTxState({
        status: "success",
        hash: "demo_tx_hash_stellar",
        explorerUrl: "#"
      });
      setVictoryDonationAmount(String(amount));
      setShowVictoryOverlay(true);
      setDonateAmount("");
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5500);
      return;
    }

    if (!publicKey) return;
    if (isNaN(amount) || amount <= 0) {
      setTxState({
        status: "error",
        type: "network_error",
        message: "Please enter a valid amount greater than 0."
      });
      return;
    }

    if (userBalance !== null && Number(userBalance) < amount) {
      setTxState({
        status: "error",
        type: "insufficient_balance",
        message: t.insufficientBalance
      });
      return;
    }

    setTxState({ status: "pending" });
    try {
      const xdrString = await buildDonateXdr(publicKey, amount);
      const signedXdr = await signXdr(xdrString);
      const result = await submitSignedXdr(signedXdr);

      setTxState({
        status: "success",
        hash: result.hash,
        explorerUrl: result.explorerUrl
      });
      setVictoryDonationAmount(String(amount));
      setShowVictoryOverlay(true);
      setDonateAmount("");
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
      void refreshAll();
    } catch (err) {
      console.error("Submission failed:", err);
      const classified = classifyError(err);
      setTxState({
        status: "error",
        type: classified.type as TxState["type"],
        message: classified.message
      });
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden font-sans pb-24" style={{ background: "var(--background)" }}>
      <Confetti active={showConfetti} />

      {/* Dynamic Victory Overlay Modal (Category Specific Big Animation) */}
      {showVictoryOverlay && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-bounce-in">
          <div className={`relative max-w-md w-full glass p-8 rounded-3xl border text-center shadow-2xl ${
            activeTab === "environment" ? "border-emerald-500/30" : activeTab === "education" ? "border-amber-500/30" : "border-rose-500/30"
          }`}>
            <span className="block text-5xl mb-4 animate-bounce">
              {activeTab === "environment" ? "🌲" : activeTab === "education" ? "📚" : "❤️"}
            </span>
            <h2 className={`text-2xl font-black mb-2 tracking-tight ${
              activeTab === "environment" ? "text-emerald-400" : activeTab === "education" ? "text-amber-400" : "text-rose-400"
            }`}>
              {activeTab === "environment" && t.victoryTitleEnv}
              {activeTab === "education" && t.victoryTitleEdu}
              {activeTab === "health" && t.victoryTitleHealth}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-6 font-display px-2">
              {activeTab === "environment" && (
                locale === "tr"
                  ? `Katkınız sayesinde doğaya tam ${Math.max(1, Math.round(Number(victoryDonationAmount) * 0.7))} yeni fidan kazandırdınız! Fidanlarınız en kısa sürede toprakla buluşacak.`
                  : `With your support, you added exactly ${Math.max(1, Math.round(Number(victoryDonationAmount) * 0.7))} new saplings to our real-world forestry project!`
              )}
              {activeTab === "education" && (
                locale === "tr"
                  ? `Katkınız sayesinde tam ${Math.max(1, Math.round(Number(victoryDonationAmount) * 0.15))} öğrencimiz teknoloji kitaplarına kavuşuyor. Eğitime ışık oldunuz!`
                  : `With your support, ${Math.max(1, Math.round(Number(victoryDonationAmount) * 0.15))} more students received technology books in classroom projects!`
              )}
              {activeTab === "health" && (
                locale === "tr"
                  ? `Katkınız sayesinde yerel hastanelerimize tam ${Math.max(1, Math.round(Number(victoryDonationAmount) * 0.2))} adet hayati tıbbi teşhis kiti kazandırdınız. Destekleriniz hayat kurtaracak!`
                  : `With your support, local hospitals gained ${Math.max(1, Math.round(Number(victoryDonationAmount) * 0.2))} vital medical diagnostic kits!`
              )}
            </p>
            
            <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/5 font-mono text-xs text-slate-400 flex flex-col gap-1 items-center">
              <span>{locale === "tr" ? "Yatırılan Tutar" : "Contributed"}</span>
              <span className={`text-lg font-black ${
                activeTab === "environment" ? "text-emerald-400" : activeTab === "education" ? "text-amber-400" : "text-rose-400"
              }`}>{victoryDonationAmount} XLM</span>
            </div>

            <button
              type="button"
              onClick={() => setShowVictoryOverlay(false)}
              className={`w-full rounded-2xl py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-md transition duration-200 hover:brightness-110 ${
                activeTab === "environment" 
                  ? "bg-gradient-to-r from-emerald-400 to-teal-500 shadow-emerald-950/20" 
                  : activeTab === "education" 
                    ? "bg-gradient-to-r from-amber-400 to-orange-500 shadow-amber-950/20" 
                    : "bg-gradient-to-r from-rose-400 to-purple-600 shadow-rose-950/20"
              }`}
            >
              {t.closeBtn}
            </button>
          </div>
        </div>
      )}

      {/* Background kinetic grid + floating orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        {/* Animated ambient orbs */}
        <div className={`absolute top-[-10%] left-[-10%] h-[60%] w-[60%] rounded-full blur-[150px] transition-all duration-1000 animate-float-slow opacity-60 ${
          activeTab === "environment" 
            ? "bg-emerald-500/20" 
            : activeTab === "education" 
              ? "bg-amber-500/20" 
              : "bg-rose-500/20"
        }`} />
        <div className="absolute bottom-[-15%] right-[-10%] h-[55%] w-[55%] rounded-full bg-violet-600/15 blur-[160px] animate-float-slow-reverse opacity-50" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 cyber-grid-dot opacity-60" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-8 sm:px-8">
        
        {/* Mobile-only Utility Corner (Dil & Info - Safe top right corner positioning on viewports < 640px) */}
        <div className="absolute top-6 right-4 flex sm:hidden items-center gap-2 z-50">
          <LanguageToggle locale={locale} onChange={setLocale} />
          
          <div className="relative group inline-block">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-500/40 bg-cyan-500/10 text-xs font-black text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)] animate-glow-pulse transition hover:scale-105 hover:bg-cyan-500/20 cursor-help font-mono"
            >
              i
            </button>
            <div className="pointer-events-none absolute right-0 top-full mt-3 w-[260px] rounded-2xl bg-slate-950 border border-white/10 p-5 text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-250 z-50 shadow-2xl leading-relaxed">
              <span className="block font-black text-cyan-400 mb-1.5 font-display text-left text-[11px]">
                {locale === "tr" ? "🔒 Blokzinciri & Güvenlik Nedir?" : "🔒 What is Blockchain & Security?"}
              </span>
              <p className="text-left font-sans text-[10px] leading-relaxed">
                {locale === "tr" 
                  ? "Blokzinciri, kimsenin müdahale edemeyeceği dijital bir güven defteridir. Bağışlarınız doğrudan akıllı sözleşme kasasında kilitlenir. Proje yöneticisi, yaptığı işlerin görsel kanıtlarını (fatura, fotoğraf vb.) sunmadan paranızı çekemez. Bu sayede desteğinizin her kuruşu güvence altındadır."
                  : "Blockchain is a digital ledger of absolute trust. Your donations are locked directly inside a smart contract vault. The creator cannot withdraw your funds without submitting visual proof of work (receipts, photos, etc.). Your support is 100% secure."}
              </p>
            </div>
          </div>
        </div>

        {/* TOP HEADER */}
        <header className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-8">
          {/* Left Side: Logo & Brand Title */}
          <div className="flex flex-col gap-1.5 items-center sm:items-start text-center sm:text-left w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className={`relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 transition-all duration-700 ${
                activeTab === "environment" 
                  ? "bg-emerald-950/30 text-emerald-400" 
                  : activeTab === "education" 
                    ? "bg-amber-950/30 text-amber-400" 
                    : "bg-rose-950/30 text-rose-400"
              }`}>
                <svg className="h-5 w-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none text-gradient font-display">{t.title}</h1>
                <span className="block text-[10px] font-black text-slate-500 tracking-widest uppercase mt-1.5 font-mono">{t.tagline}</span>
              </div>
            </div>
          </div>
          
          {/* Right Side: Badges, Controls, & Connect Button */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5 sm:gap-3.5 w-full sm:w-auto sm:self-center">
            {/* Trust Badge */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-emerald-400/80 font-mono whitespace-nowrap">
              {t.trustBadge}
            </span>

            {/* Testnet Status */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-cyan-300 font-mono">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              Testnet
            </span>

            {/* Language Switcher - Desktop Only */}
            <div className="hidden sm:block">
              <LanguageToggle locale={locale} onChange={setLocale} />
            </div>

            {/* Global Trust Info Button (🔒 Nedir?) - Desktop Only */}
            <div className="hidden sm:inline-block relative group">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-500/40 bg-cyan-500/10 text-xs font-black text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)] animate-glow-pulse transition hover:scale-105 hover:bg-cyan-500/20 cursor-help font-mono"
              >
                i
              </button>
              <div className="pointer-events-none absolute right-0 top-full mt-3 w-72 rounded-2xl bg-slate-950 border border-white/10 p-5 text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-250 z-50 shadow-2xl leading-relaxed">
                <span className="block font-black text-cyan-400 mb-1.5 font-display text-left">
                  {locale === "tr" ? "🔒 Blokzinciri & Güvenlik Nedir?" : "🔒 What is Blockchain & Security?"}
                </span>
                <p className="text-left font-sans text-xs leading-relaxed">
                  {locale === "tr" 
                    ? "Blokzinciri, kimsenin müdahale edemeyeceği dijital bir güven defteridir. Bağışlarınız doğrudan akıllı sözleşme kasasında kilitlenir. Proje yöneticisi, yaptığı işlerin görsel kanıtlarını (fatura, fotoğraf vb.) sunmadan paranızı çekemez. Bu sayede desteğinizin her kuruşu güvence altındadır."
                    : "Blockchain is a digital ledger of absolute trust. Your donations are locked directly inside a smart contract vault. The creator cannot withdraw your funds without submitting visual proof of work (receipts, photos, etc.). Your support is 100% secure."}
                </p>
                <div className="absolute top-0 right-3.5 -mt-1.5 h-3 w-3 rotate-45 border-l border-t border-white/10 bg-slate-950" />
              </div>
            </div>

            {/* Connect Wallet Button */}
            {publicKey ? (
              <div className="flex items-center gap-2.5">
                <code className="rounded-xl bg-slate-950 border border-white/5 px-4.5 py-2.5 text-xs text-slate-200 font-mono font-bold">
                  {formatAddress(publicKey, 6, 6)}
                </code>
                <button
                  type="button"
                  onClick={disconnect}
                  className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4.5 py-2.5 text-xs font-black uppercase tracking-wider text-rose-300 transition hover:bg-rose-500/25"
                >
                  {t.disconnect}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={openModal}
                disabled={isConnecting}
                className="rounded-xl bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600 px-7 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-cyan-500/15 transition hover:scale-[1.02] hover:brightness-110 disabled:opacity-60 font-display"
              >
                {isConnecting ? t.connecting : t.connectWallet}
              </button>
            )}
          </div>
        </header>

        {/* HERO HEADER AREA & SIMULATION BOX GRID */}
        <section className="mb-12 animate-fade-up relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center border border-white/5 bg-slate-950/20 rounded-3xl p-6 sm:p-8 glass">
          <div className="md:col-span-8 text-left">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4 leading-tight font-display text-gradient">
              {t.heroTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {t.heroDesc}
            </p>
          </div>
          
          <div className="md:col-span-4 rounded-2xl bg-white/5 border border-white/10 p-5 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2.5 font-mono">
              {locale === "tr" ? "🧪 TEST SÜRÜŞÜ" : "🧪 SANDBOX MODE"}
            </span>
            <p className="text-xs font-bold text-slate-300 leading-relaxed mb-3.5 px-1 font-display">
              {locale === "tr" ? "İsterseniz önce simülasyonda deneyin!" : "Feel free to try in simulation mode first!"}
            </p>
            
            <button
              type="button"
              onClick={() => setIsDemoMode(!isDemoMode)}
              className={`w-full rounded-xl py-2 text-xs font-black uppercase tracking-wider transition-all duration-300 border font-display ${
                isDemoMode
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse"
                  : "bg-cyan-500/10 border-cyan-500/40 text-cyan-300"
              }`}
            >
              {isDemoMode ? t.demoModeLabel : t.liveModeLabel}
            </button>
            <span className="text-[9px] text-slate-500 mt-2 font-mono text-center">
              {isDemoMode 
                ? (locale === "tr" ? "✓ Sanal bütçelerle test ediyorsunuz" : "✓ Using mock funds and test releases")
                : (locale === "tr" ? "⚠️ Canlı testnet sözleşmesine bağlı" : "⚠️ Bound to live testnet contract")}
            </span>
          </div>
        </section>

        {/* CATEGORY TABS (Doğa / Eğitim / Sağlık) */}
        <div className="mb-12 flex flex-wrap justify-center gap-5 relative z-10">
          <button
            type="button"
            onClick={() => setActiveTab("environment")}
            className={`rounded-2xl px-8 py-5 text-xs sm:text-sm font-black tracking-widest uppercase transition-all duration-500 flex items-center gap-3.5 border font-display ${
              activeTab === "environment"
                ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-300 shadow-[0_0_35px_rgba(16,185,129,0.25)] scale-[1.03]"
                : "bg-slate-950/40 border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/10"
            }`}
          >
            <svg className="w-4 h-4 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span>{t.catEnvLabel}</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab("education")}
            className={`rounded-2xl px-8 py-5 text-xs sm:text-sm font-black tracking-widest uppercase transition-all duration-500 flex items-center gap-3.5 border font-display ${
              activeTab === "education"
                ? "bg-amber-500/10 border-amber-500/50 text-amber-300 shadow-[0_0_35px_rgba(245,158,11,0.25)] scale-[1.03]"
                : "bg-slate-950/40 border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/10"
            }`}
          >
            <svg className="w-4 h-4 shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>{t.catEduLabel}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("health")}
            className={`rounded-2xl px-8 py-5 text-xs sm:text-sm font-black tracking-widest uppercase transition-all duration-500 flex items-center gap-3.5 border font-display ${
              activeTab === "health"
                ? "bg-rose-500/10 border-rose-500/50 text-rose-300 shadow-[0_0_35px_rgba(244,63,94,0.25)] scale-[1.03]"
                : "bg-slate-950/40 border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/10"
            }`}
          >
            <svg className="w-4 h-4 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{t.catHealthLabel}</span>
          </button>
        </div>

        {/* HOW IT WORKS SIMPLE 3-STEP ONBOARDING */}
        <section className="mb-12 glass p-8 sm:p-10 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden z-10">
          <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-cyan-500/5 blur-3xl" />
          <h3 className="text-sm font-black tracking-widest uppercase text-slate-400 mb-6 border-b border-white/5 pb-3 font-display">
            {t.howItWorksTitle}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-2.5 relative pl-4 border-l-2 border-cyan-500/35">
              <span className="text-xs font-black text-cyan-400 font-mono">{locale === "tr" ? "01 / DESTEK" : "01 / SUPPORT"}</span>
              <h4 className="text-sm font-extrabold text-white font-display">{t.howItWorksStep1Title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{t.howItWorksStep1Desc}</p>
            </div>
            <div className="flex flex-col gap-2.5 relative pl-4 border-l-2 border-violet-500/35">
              <span className="text-xs font-black text-violet-400 font-mono">{locale === "tr" ? "02 / GÜVENLİK" : "02 / SECURITY"}</span>
              <h4 className="text-sm font-extrabold text-white font-display">{t.howItWorksStep2Title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{t.howItWorksStep2Desc}</p>
            </div>
            <div className="flex flex-col gap-2.5 relative pl-4 border-l-2 border-indigo-500/35">
              <span className="text-xs font-black text-indigo-400 font-mono">{locale === "tr" ? "03 / TESLİMAT" : "03 / RELEASE"}</span>
              <h4 className="text-sm font-extrabold text-white font-display">{t.howItWorksStep3Title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{t.howItWorksStep3Desc}</p>
            </div>
          </div>
        </section>

        {/* MAIN ROW CONTAINERS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
          
          {/* LEFT SIDE: DYNAMIC CATEGORY ANIMATION GRID */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* SVG ANIMATED PORTRAIT CONTAINER */}
            <div className="glass p-6 rounded-3xl border border-white/5 relative flex flex-col items-center shadow-xl">
              <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase mb-4 border-b border-white/5 pb-2.5 w-full text-center font-display">
                {activeTab === "environment" && t.treeTitle}
                {activeTab === "education" && t.bookTitle}
                {activeTab === "health" && t.heartTitle}
              </h3>
              
              <div className="relative w-full h-[320px] flex items-center justify-center bg-slate-950/70 rounded-2xl border border-white/10 shadow-inner overflow-hidden">
                <div className="absolute inset-0 cyber-grid-dot opacity-40" />
                
                {/* SVG 1: Cybernetic Reforestation Tree (Green Accent) */}
                {activeTab === "environment" && (
                  <svg className="w-full h-full max-h-[220px] p-6 relative z-10" viewBox="0 0 200 200" fill="none">
                    <defs>
                      <linearGradient id="treeGrad" x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0%" stopColor="#047857" />
                        <stop offset="50%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#34d399" />
                      </linearGradient>
                      <filter id="treeGlow">
                        <feGaussianBlur stdDeviation="3.5" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* High-fidelity Environmental Grid Monitor Lines */}
                    <path d="M20 50 L180 50 M20 90 L180 90 M20 130 L180 130 M20 170 L180 170" stroke="#064e3b" strokeWidth="0.5" strokeOpacity="0.15" />
                    <path d="M50 20 L50 180 M90 20 L90 180 M130 20 L130 180 M170 20 L170 180" stroke="#064e3b" strokeWidth="0.5" strokeOpacity="0.15" />

                    {/* Concentric orbital radar rings (Breathing animation) */}
                    <circle cx="100" cy="110" r="70" stroke="#10b981" strokeWidth="0.5" strokeOpacity="0.1" strokeDasharray="3 3" className="origin-center animate-spin" style={{ animationDuration: "25s" }} />
                    <circle cx="100" cy="110" r="50" stroke="#10b981" strokeWidth="0.75" strokeOpacity="0.15" strokeDasharray="4 2" className="origin-center animate-spin" style={{ animationDuration: "18s", animationDirection: "reverse" }} />
                    
                    {/* Static backdrop dashed tree blueprint (Always visible so tree is recognizable) */}
                    <path 
                      d="M100 65 L65 110 H75 L55 145 H65 L45 170 H155 L135 170 H145 L125 145 H135 L100 110 Z" 
                      stroke="#10b981" 
                      strokeWidth="1.5" 
                      strokeOpacity="0.25" 
                      fill="none" 
                      strokeDasharray="3 3" 
                    />
                    <line x1="100" y1="170" x2="100" y2="65" stroke="#10b981" strokeWidth="1" strokeOpacity="0.2" />

                    {/* Glowing Tree Core Line Art */}
                    <g filter="url(#treeGlow)">
                      {/* Trunk */}
                      <line 
                        x1="100" 
                        y1="165" 
                        x2="100" 
                        y2={165 - (95 * Math.max(progressPercent, 10)) / 100} 
                        stroke="url(#treeGrad)" 
                        strokeWidth="4" 
                        strokeLinecap="round" 
                        className="transition-all duration-1000 ease-out"
                      />
                      {/* Lush Pine Tree Shape Layers growing in opacity with progress */}
                      <path 
                        d="M100 70 L65 110 H135 Z" 
                        fill="url(#treeGrad)" 
                        fillOpacity={0.05 + (progressPercent / 400)}
                        stroke="url(#treeGrad)" 
                        strokeWidth="2" 
                        strokeLinejoin="round"
                        className="transition-all duration-700 ease-out"
                      />
                      <path 
                        d="M100 100 L55 145 H145 Z" 
                        fill="url(#treeGrad)" 
                        fillOpacity={progressPercent >= 30 ? 0.05 + (progressPercent / 500) : 0.02}
                        stroke="url(#treeGrad)" 
                        strokeWidth="2.5" 
                        strokeLinejoin="round"
                        className="transition-all duration-700 ease-out font-sans"
                        strokeOpacity={progressPercent >= 30 ? 1 : 0.25}
                      />
                      <path 
                        d="M100 125 L45 170 H155 Z" 
                        fill="url(#treeGrad)" 
                        fillOpacity={progressPercent >= 60 ? 0.05 + (progressPercent / 600) : 0.02}
                        stroke="url(#treeGrad)" 
                        strokeWidth="3" 
                        strokeLinejoin="round"
                        className="transition-all duration-700 ease-out"
                        strokeOpacity={progressPercent >= 60 ? 1 : 0.2}
                      />

                      {/* Glowing crown lights based on progress */}
                      {progressPercent >= 10 && (
                        <circle 
                          cx="100" 
                          cy={165 - (95 * Math.max(progressPercent, 10)) / 100} 
                          r="5" 
                          fill="#34d399" 
                          className="animate-pulse" 
                        />
                      )}
                    </g>

                    {/* Ambient pulse wave */}
                    {progressPercent > 0 && (
                      <circle
                        cx="100"
                        cy="110"
                        r={30 + (progressPercent * 0.4)}
                        stroke="#10b981"
                        strokeWidth="1"
                        strokeOpacity={0.5 - (progressPercent / 200)}
                        className="animate-ping"
                        style={{ animationDuration: "3s", transformOrigin: "center" }}
                      />
                    )}
                  </svg>
                )}

                {/* SVG 2: Holographic Knowledge Book (Amber Accent) */}
                {activeTab === "education" && (
                  <svg className="w-full h-full max-h-[220px] p-6 relative z-10" viewBox="0 0 200 200" fill="none">
                    <defs>
                      <linearGradient id="bookGrad" x1="0" y1="1" x2="1" y2="0">
                        <stop offset="0%" stopColor="#d97706" />
                        <stop offset="50%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#fef08a" />
                      </linearGradient>
                      <filter id="bookGlow">
                        <feGaussianBlur stdDeviation="3.5" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* High-fidelity Education Grid Monitor Lines */}
                    <path d="M20 50 L180 50 M20 90 L180 90 M20 130 L180 130 M20 170 L180 170" stroke="#78350f" strokeWidth="0.5" strokeOpacity="0.15" />
                    <path d="M50 20 L50 180 M90 20 L90 180 M130 20 L130 180 M170 20 L170 180" stroke="#78350f" strokeWidth="0.5" strokeOpacity="0.15" />
                    
                    {/* Floating vertical binary code particles (Rise animation) */}
                    {progressPercent >= 30 && <text x="75" y="65" fill="#f59e0b" fontSize="8" className="animate-pulse font-mono font-bold" opacity="0.3">1</text>}
                    {progressPercent >= 60 && <text x="125" y="60" fill="#fef08a" fontSize="8" className="animate-pulse font-mono font-bold" opacity="0.4">0</text>}

                    {/* Laser scanner target line (Animates vertically) */}
                    <line 
                      x1="45" 
                      y1="75" 
                      x2="155" 
                      y2="75" 
                      stroke="#fbbf24" 
                      strokeWidth="1.5" 
                      filter="url(#bookGlow)"
                      className="animate-bounce"
                      style={{ animationDuration: "3.5s" }}
                    />
 
                    {/* Static backdrop dashed book blueprint (Always visible so book is recognizable) */}
                    <path 
                      d="M100 152 Q75 142 45 147 V75 Q75 70 100 80 Q125 70 155 75 V147 Q125 142 100 152 Z" 
                      stroke="#fbbf24" 
                      strokeWidth="1.5" 
                      strokeOpacity="0.25" 
                      fill="none" 
                      strokeDasharray="3 3" 
                    />
                    <line x1="100" y1="152" x2="100" y2="80" stroke="#fbbf24" strokeWidth="1" strokeOpacity="0.2" />

                    {/* Glowing Book Core Line Art */}
                    <g filter="url(#bookGlow)">
                      {/* Spine */}
                      <path d="M100 80 V152" stroke="#b45309" strokeWidth="3.5" strokeLinecap="round" />
                      
                      {/* Left Page (Grows based on progress) */}
                      <path
                        d="M100 152 Q75 142 45 147 V75 Q75 70 100 80 Z"
                        fill="url(#bookGrad)"
                        fillOpacity={0.05 + (progressPercent / 400)}
                        stroke="url(#bookGrad)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
 
                      {/* Right Page (Grows based on progress) */}
                      <path
                        d="M100 152 Q125 142 155 147 V75 Q125 70 100 80 Z"
                        fill="url(#bookGrad)"
                        fillOpacity={0.05 + (progressPercent / 400)}
                        stroke="url(#bookGrad)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />

                      {/* Simulated Text Lines inside Book Pages */}
                      <line x1="55" y1="95" x2="88" y2="95" stroke="#fbbf24" strokeWidth="1.5" strokeOpacity="0.3" strokeLinecap="round" />
                      <line x1="55" y1="110" x2="88" y2="110" stroke="#fbbf24" strokeWidth="1.5" strokeOpacity="0.3" strokeLinecap="round" />
                      <line x1="55" y1="125" x2="80" y2="125" stroke="#fbbf24" strokeWidth="1.5" strokeOpacity="0.3" strokeLinecap="round" />

                      <line x1="112" y1="95" x2="145" y2="95" stroke="#fbbf24" strokeWidth="1.5" strokeOpacity="0.3" strokeLinecap="round" />
                      <line x1="112" y1="110" x2="145" y2="110" stroke="#fbbf24" strokeWidth="1.5" strokeOpacity="0.3" strokeLinecap="round" />
                      <line x1="112" y1="125" x2="137" y2="125" stroke="#fbbf24" strokeWidth="1.5" strokeOpacity="0.3" strokeLinecap="round" />
                    </g>
                  </svg>
                )}

                {/* SVG 3: Cyber Pulse Heart (Health - Rose Red Accent) */}
                {activeTab === "health" && (
                  <svg className="w-full h-full max-h-[220px] p-6 relative z-10" viewBox="0 0 200 200" fill="none">
                    <defs>
                      <linearGradient id="heartGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" />
                        <stop offset="50%" stopColor="#e11d48" />
                        <stop offset="100%" stopColor="#be123c" />
                      </linearGradient>
                      <filter id="heartGlow">
                        <feGaussianBlur stdDeviation="3.5" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* High-fidelity ECG Grid Monitor Lines */}
                    <path d="M20 50 L180 50 M20 90 L180 90 M20 130 L180 130 M20 170 L180 170" stroke="#881337" strokeWidth="0.5" strokeOpacity="0.15" />
                    <path d="M50 20 L50 180 M90 20 L90 180 M130 20 L130 180 M170 20 L170 180" stroke="#881337" strokeWidth="0.5" strokeOpacity="0.15" />

                    {/* ECG grid background line */}
                    <path
                      d="M20 110 L60 110 L70 80 L82 140 L94 70 L106 125 L118 110 L180 110"
                      stroke="#881337"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeOpacity="0.3"
                    />

                    {/* Animated glowing pulse wave overlay */}
                    <path
                      d="M20 110 L60 110 L70 80 L82 140 L94 70 L106 125 L118 110 L180 110"
                      stroke="#f43f5e"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#heartGlow)"
                      className="animate-heartbeat-flow"
                    />

                    {/* Glowing heartbeat icon in center (Pulses rhythmically) */}
                    <path
                      d="M100 135 C100 135, 55 105, 55 82 C55 65, 68 57, 84 65 C92 69, 100 82, 100 82 C100 82, 108 69, 116 65 C132 57, 145 65, 145 82 C145 105, 100 135, 100 135 Z"
                      fill="url(#heartGrad)"
                      filter="url(#heartGlow)"
                      className="origin-center"
                      style={{
                        transform: `scale(${0.6 + (progressPercent / 300)})`,
                        animation: `glow-pulse ${2.5 - (progressPercent / 120)}s ease-in-out infinite`,
                        transformOrigin: "center"
                      }}
                    />
                  </svg>
                )}

              </div>

              {/* Dynamic Impact Statistics Panel */}
              {(() => {
                const myRealDonations = campaign?.top_donors.find(d => {
                  const isMatch = publicKey && (d.address === publicKey || d.address.startsWith(publicKey.substring(0, 10)));
                  return isMatch;
                })?.amount || BigInt(0);
                
                const userTotalXlm = isDemoMode 
                  ? myDemoDonations[activeTab] 
                  : (Number(myRealDonations) / 10_000_000);
                  
                const communityTotalXlm = Number(campaign?.total || 0) / 10_000_000;

                let userImpact = 0;
                let communityImpact = 0;
                let userText = "";
                let communityText = "";

                if (activeTab === "environment") {
                  userImpact = Math.max(0, Math.round(userTotalXlm * 0.1));
                  communityImpact = Math.max(0, Math.round(communityTotalXlm * 0.1));
                  
                  userText = locale === "tr"
                    ? `Bağışlarınızla doğaya ${userImpact} fidan kazandırıldı.`
                    : `Your contributions planted ${userImpact} saplings.`;
                    
                  communityText = locale === "tr"
                    ? `Topluluk bağışlarıyla doğaya ${communityImpact} fidan kazandırıldı.`
                    : `Community donations planted ${communityImpact} saplings.`;
                } else if (activeTab === "education") {
                  userImpact = Math.max(0, Math.round(userTotalXlm * 0.2));
                  communityImpact = Math.max(0, Math.round(communityTotalXlm * 0.2));

                  userText = locale === "tr"
                    ? `Bağışlarınız ${userImpact} adet kitap desteği sağladı.`
                    : `Your contributions provided ${userImpact} books.`;

                  communityText = locale === "tr"
                    ? `Topluluk bağışları ${communityImpact} adet kitap desteği sağladı.`
                    : `Community donations provided ${communityImpact} books.`;
                } else {
                  userImpact = Math.max(0, Math.round(userTotalXlm * 0.05));
                  communityImpact = Math.max(0, Math.round(communityTotalXlm * 0.05));

                  userText = locale === "tr"
                    ? `Bağışlarınız ${userImpact} hastaya tıbbi destek sağladı.`
                    : `Your donations supported ${userImpact} patients.`;

                  communityText = locale === "tr"
                    ? `Topluluk bağışları ${communityImpact} hastaya tıbbi destek sağladı.`
                    : `Community donations supported ${communityImpact} patients.`;
                }

                return (
                  <div className="w-full mt-4 p-4 rounded-2xl bg-slate-950/90 border border-white/5 space-y-2.5 font-mono text-[11px] text-left">
                    <div className="flex items-center gap-2.5">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                        activeTab === "environment" ? "bg-emerald-400" : activeTab === "education" ? "bg-amber-400" : "bg-rose-400"
                      }`} />
                      <span className="text-slate-300 font-bold">{userText}</span>
                    </div>
                    <div className="flex items-center gap-2.5 border-t border-white/5 pt-2.5">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 animate-ping ${
                        activeTab === "environment" ? "bg-emerald-400" : activeTab === "education" ? "bg-amber-400" : "bg-rose-400"
                      }`} />
                      <span className="text-slate-400">{communityText}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* ŞEFFAF PARA AKIŞI (Outflow Spend Tunnel) */}
            <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 h-28 w-28 rounded-full bg-cyan-500/5 blur-2xl" />
              <h3 className="text-lg font-black tracking-tight text-white mb-3 border-b border-white/5 pb-3 font-display">
                {t.outflowTunnelTitle}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">{t.outflowTunnelDesc}</p>
              
              <div className="space-y-7 relative pl-4 border-l border-white/10">
                {/* Outflow 1 */}
                <div className="relative">
                  <div className={`absolute -left-[21px] top-1.5 h-3.5 w-3.5 rounded-full border ${
                    campaign?.m1_claimed 
                      ? "bg-emerald-400 border-emerald-400 shadow-[0_0_8px_#10b981]" 
                      : "bg-slate-950 border-slate-700"
                  }`} />
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black text-slate-200 font-display">{getMilestoneDetails(activeTab, 1, locale).title}</span>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded font-mono ${
                      campaign?.m1_claimed ? "bg-emerald-500/10 text-emerald-400" : progressPercent >= 25 ? "bg-cyan-500/10 text-cyan-400 animate-pulse" : "bg-slate-950 text-slate-600 border border-white/5"
                    }`}>
                      {campaign?.m1_claimed ? t.claimedStatus : progressPercent >= 25 ? t.claimableStatus : t.lockedStatus}
                    </span>
                  </div>
                  
                  {/* Mini visual progress track */}
                  <div className="h-1.5 w-full bg-slate-950 rounded-full border border-white/5 overflow-hidden mb-2 relative">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        campaign?.m1_claimed ? "bg-emerald-400" : progressPercent >= 25 ? "bg-cyan-400 animate-pulse" : "bg-slate-800"
                      }`}
                      style={{ width: campaign?.m1_claimed ? "100%" : progressPercent >= 25 ? "100%" : `${(progressPercent / 25) * 100}%` }}
                    />
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-2.5">
                    {getMilestoneDetails(activeTab, 1, locale).expense}
                    <span className="block text-[11px] text-slate-400 mt-1">
                      {locale === "tr" ? "Açıklama: " : "Details: "}{getMilestoneDetails(activeTab, 1, locale).desc}
                    </span>
                    {!campaign?.m1_claimed && (
                      <span className="block text-[10px] text-slate-400/80 mt-1 italic">
                        {progressPercent >= 25 
                          ? (locale === "tr" ? "• Aşamaya ulaşıldı, proje yöneticisi bütçeyi talep edebilir." : "• Target reached, project manager can request release.")
                          : (locale === "tr" ? "• Kilitli • Serbest kalması için bağış hedefinin %25'e ulaşması gerekir" : "• Locked • Requires 25% funding progress to unlock")}
                      </span>
                    )}
                  </p>

                  {campaign?.m1_claimed && (
                    <div className="bg-slate-950 border border-white/5 rounded-xl px-3.5 py-2.5 text-[10px] font-mono text-slate-400 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>{t.proofLabel}:</span>
                        <Tooltip content="ipfs://bafybeihd3w62e2w6m5j7q8f2441995a94o6vsz">
                          <span className="text-cyan-400 font-bold hover:underline">IPFS Link ℹ️</span>
                        </Tooltip>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{t.receiverLabel}:</span>
                        <Tooltip content="GD2XZ7B3L6M8X9N0K2P4Q5W8V2C4X98F7">
                          <span className="text-slate-300 hover:underline">{formatAddress("GD2XZ7B3L6M8X9N0K2P4Q5W8V2C4X98F7", 4, 4)} ℹ️</span>
                        </Tooltip>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{t.disbursedAmountLabel}:</span>
                        <span className="font-bold text-white">
                          {campaign ? formatXlm(Number(campaign.goal) * 0.25 / 10_000_000) : "0.00"} XLM
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Outflow 2 */}
                <div className="relative">
                  <div className={`absolute -left-[21px] top-1.5 h-3.5 w-3.5 rounded-full border ${
                    campaign?.m2_claimed 
                      ? "bg-emerald-400 border-emerald-400 shadow-[0_0_8px_#10b981]" 
                      : "bg-slate-950 border-slate-700"
                  }`} />
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black text-slate-200 font-display">{getMilestoneDetails(activeTab, 2, locale).title}</span>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded font-mono ${
                      campaign?.m2_claimed ? "bg-emerald-500/10 text-emerald-400" : progressPercent >= 50 ? "bg-violet-500/10 text-violet-400 animate-pulse" : "bg-slate-950 text-slate-600 border border-white/5"
                    }`}>
                      {campaign?.m2_claimed ? t.claimedStatus : progressPercent >= 50 ? t.claimableStatus : t.lockedStatus}
                    </span>
                  </div>

                  {/* Mini visual progress track */}
                  <div className="h-1.5 w-full bg-slate-950 rounded-full border border-white/5 overflow-hidden mb-2 relative">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        campaign?.m2_claimed ? "bg-emerald-400" : progressPercent >= 50 ? "bg-violet-400 animate-pulse" : "bg-slate-800"
                      }`}
                      style={{ width: campaign?.m2_claimed ? "100%" : progressPercent >= 50 ? "100%" : `${(progressPercent / 50) * 100}%` }}
                    />
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-2.5">
                    {getMilestoneDetails(activeTab, 2, locale).expense}
                    <span className="block text-[11px] text-slate-400 mt-1">
                      {locale === "tr" ? "Açıklama: " : "Details: "}{getMilestoneDetails(activeTab, 2, locale).desc}
                    </span>
                    {!campaign?.m2_claimed && (
                      <span className="block text-[10px] text-slate-400/80 mt-1 italic">
                        {progressPercent >= 50 
                          ? (locale === "tr" ? "• Aşamaya ulaşıldı, proje yöneticisi bütçeyi talep edebilir." : "• Target reached, project manager can request release.")
                          : (locale === "tr" ? "• Kilitli • Serbest kalması için bağış hedefinin %50'ye ulaşması gerekir" : "• Locked • Requires 50% funding progress to unlock")}
                      </span>
                    )}
                  </p>

                  {campaign?.m2_claimed && (
                    <div className="bg-slate-950 border border-white/5 rounded-xl px-3.5 py-2.5 text-[10px] font-mono text-slate-400 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>{t.proofLabel}:</span>
                        <Tooltip content="ipfs://bafybeicm22zwz7q8v24a98kf22f7as90x1">
                          <span className="text-cyan-400 font-bold hover:underline">IPFS Link ℹ️</span>
                        </Tooltip>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{t.receiverLabel}:</span>
                        <Tooltip content="GCBY87KB3X9A2C4H98K92F78W56D7X89B">
                          <span className="text-slate-300 hover:underline">{formatAddress("GCBY87KB3X9A2C4H98K92F78W56D7X89B", 4, 4)} ℹ️</span>
                        </Tooltip>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{t.disbursedAmountLabel}:</span>
                        <span className="font-bold text-white">
                          {campaign ? formatXlm(Number(campaign.goal) * 0.25 / 10_000_000) : "0.00"} XLM
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Outflow 3 */}
                <div className="relative">
                  <div className={`absolute -left-[21px] top-1.5 h-3.5 w-3.5 rounded-full border ${
                    campaign?.m3_claimed 
                      ? "bg-emerald-400 border-emerald-400 shadow-[0_0_8px_#10b981]" 
                      : "bg-slate-950 border-slate-700"
                  }`} />
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black text-slate-200 font-display">{getMilestoneDetails(activeTab, 3, locale).title}</span>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded font-mono ${
                      campaign?.m3_claimed ? "bg-emerald-500/10 text-emerald-400" : progressPercent >= 100 ? "bg-indigo-500/10 text-indigo-400 animate-pulse" : "bg-slate-950 text-slate-600 border border-white/5"
                    }`}>
                      {campaign?.m3_claimed ? t.claimedStatus : progressPercent >= 100 ? t.claimableStatus : t.lockedStatus}
                    </span>
                  </div>

                  {/* Mini visual progress track */}
                  <div className="h-1.5 w-full bg-slate-950 rounded-full border border-white/5 overflow-hidden mb-2 relative">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        campaign?.m3_claimed ? "bg-emerald-400" : progressPercent >= 100 ? "bg-indigo-400 animate-pulse" : "bg-slate-800"
                      }`}
                      style={{ width: campaign?.m3_claimed ? "100%" : progressPercent >= 100 ? "100%" : `${(progressPercent / 100) * 100}%` }}
                    />
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-2.5">
                    {getMilestoneDetails(activeTab, 3, locale).expense}
                    <span className="block text-[11px] text-slate-400 mt-1">
                      {locale === "tr" ? "Açıklama: " : "Details: "}{getMilestoneDetails(activeTab, 3, locale).desc}
                    </span>
                    {!campaign?.m3_claimed && (
                      <span className="block text-[10px] text-slate-400/80 mt-1 italic">
                        {progressPercent >= 100 
                          ? (locale === "tr" ? "• Aşamaya ulaşıldı, proje yöneticisi bütçeyi talep edebilir." : "• Target reached, project manager can request release.")
                          : (locale === "tr" ? "• Kilitli • Serbest kalması için bağış hedefinin %100'e ulaşması gerekir" : "• Locked • Requires 100% funding progress to unlock")}
                      </span>
                    )}
                  </p>

                  {campaign?.m3_claimed && (
                    <div className="bg-slate-950 border border-white/5 rounded-xl px-3.5 py-2.5 text-[10px] font-mono text-slate-400 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>{t.proofLabel}:</span>
                        <Tooltip content="ipfs://bafybeid982e2w6m5j7q8f2441995a94o6vsz">
                          <span className="text-cyan-400 font-bold hover:underline">IPFS Link ℹ️</span>
                        </Tooltip>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{t.receiverLabel}:</span>
                        <Tooltip content="GD7S4P32B6W8X9N0K2P4Q5W8V2C4X98F7">
                          <span className="text-slate-300 hover:underline">{formatAddress("GD7S4P32B6W8X9N0K2P4Q5W8V2C4X98F7", 4, 4)} ℹ️</span>
                        </Tooltip>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{t.disbursedAmountLabel}:</span>
                        <span className="font-bold text-white">
                          {campaign ? formatXlm(Number(campaign.goal) * 0.50 / 10_000_000) : "0.00"} XLM
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* RIGHT SIDE: STATS & SPONSOR FORM */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* FINANCIAL STATS */}
            <div className="glass rounded-3xl p-6 sm:p-8 border border-white/5 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-cyan-500/5 blur-3xl" />
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest block mb-2 font-display">{t.campaignStats}</span>
              <h2 className="text-2xl font-black text-white tracking-tight mb-6 font-display">
                {activeTab === "environment" && t.envTitle}
                {activeTab === "education" && t.eduTitle}
                {activeTab === "health" && t.healthTitle}
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 border-b border-white/5 pb-6 mb-6">
                <div>
                  <span className="block text-[9px] uppercase font-black text-slate-500 tracking-wider font-mono">{t.goalTargetLabel}</span>
                  <span className="text-2xl font-black text-white font-mono leading-none tracking-tight">
                    {campaign ? formatXlm(Number(campaign.goal) / 10_000_000) : "0.00"}
                  </span>
                  <span className="text-[9px] text-slate-400 font-extrabold ml-1 font-mono">XLM</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-black text-slate-500 tracking-wider font-mono">{t.totalRaisedLabel}</span>
                  <span className="text-2xl font-black text-cyan-400 font-mono leading-none tracking-tight shadow-cyan-950/20">
                    {campaign ? formatXlm(Number(campaign.total) / 10_000_000) : "0.00"}
                  </span>
                  <span className="text-[9px] text-cyan-400 font-extrabold ml-1 font-mono">XLM</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-black text-slate-500 tracking-wider font-mono">{t.totalWithdrawnLabel}</span>
                  <span className="text-2xl font-black text-violet-400 font-mono leading-none tracking-tight">
                    {formatXlm(totalWithdrawn)}
                  </span>
                  <span className="text-[9px] text-violet-400 font-extrabold ml-1 font-mono">XLM</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-black text-slate-500 tracking-wider font-mono">{t.donorCount}</span>
                  <span className="text-2xl font-black text-white font-mono leading-none tracking-tight">
                    {campaign ? campaign.donor_count : 0}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs text-slate-400 mb-2.5 font-mono">
                  <span>{campaign ? t.raisedOfGoal(formatXlm(Number(campaign.total) / 10_000_000), formatXlm(Number(campaign.goal) / 10_000_000)) : ""}</span>
                  <span className={`font-black font-mono px-2 py-0.5 rounded ${
                    activeTab === "environment" ? "text-emerald-400 bg-emerald-950/30" : activeTab === "education" ? "text-amber-400 bg-amber-950/30" : "text-rose-400 bg-rose-950/30"
                  }`}>{progressPercent}%</span>
                </div>
                
                {/* Custom Gradient Striped Animated Progress Bar */}
                <div className="h-5 w-full bg-slate-950 rounded-full border border-white/10 p-1 overflow-hidden shadow-inner relative">
                  <div className="absolute inset-0 animate-shimmer opacity-20" />
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out animate-gradient-x shadow-[0_0_12px_currentColor] ${
                      activeTab === "environment" 
                        ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-emerald-400" 
                        : activeTab === "education"
                          ? "bg-gradient-to-r from-amber-500 via-orange-400 to-red-500 text-amber-400"
                          : "bg-gradient-to-r from-rose-500 via-pink-400 to-purple-500 text-rose-400"
                    }`}
                    style={{ width: `${progressPercent}%`, backgroundSize: "200% 200%" }}
                  />
                </div>
              </div>
            </div>

            {/* ERROR ALERTS */}
            {txState.status === "error" && (
              <div className="animate-fade-up rounded-2xl border p-5 flex gap-4 items-start border-rose-500/20 bg-rose-500/8 text-rose-200">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-rose-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-extrabold text-white mb-1 font-display">
                    {txState.type === "wallet_not_found" && t.walletNotFoundTitle}
                    {txState.type === "user_rejected" && t.userRejectedTitle}
                    {txState.type === "insufficient_balance" && t.insufficientBalanceTitle}
                    {txState.type === "network_error" && t.errorTitle}
                    {!txState.type && t.errorTitle}
                  </h4>
                  <p className="text-xs text-rose-300/80 leading-relaxed mb-4">
                    {txState.message}
                  </p>
                  {txState.type === "insufficient_balance" && publicKey && (
                    <button
                      type="button"
                      onClick={handleFund}
                      disabled={isFunding}
                      className="rounded-xl bg-rose-500/20 border border-rose-500/35 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white transition hover:bg-rose-500/30 disabled:opacity-60 font-display"
                    >
                      {isFunding ? t.fundingWalletBtn : t.fundWalletBtn}
                    </button>
                  )}
                  {txState.type === "wallet_not_found" && (
                    <a
                      href="https://freighter.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded-xl bg-rose-500/20 border border-rose-500/35 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white transition hover:bg-rose-500/30 font-display"
                    >
                      Download Freighter Wallet
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* PENDING ALERTS */}
            {txState.status === "pending" && (
              <div className="animate-fade-up rounded-2xl border p-5 flex gap-4 items-center border-indigo-500/20 bg-indigo-500/8 text-indigo-200">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400">
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-extrabold text-white mb-0.5 font-display">{t.signatureRequiredTitle}</h4>
                  <p className="text-xs text-indigo-300/80 leading-relaxed">
                    {t.signatureRequiredDesc}
                  </p>
                </div>
              </div>
            )}

            {/* CONTRIBUTION COMPONENT */}
            <div className="glass rounded-3xl p-6 sm:p-8 border border-white/5 shadow-lg relative overflow-hidden">
              <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-cyan-500/5 blur-xl" />
              <h3 className="text-lg font-black tracking-tight text-white mb-4 font-display">{t.donateTitle}</h3>
              
              {publicKey && (
                <div className="mb-5 flex items-center justify-between rounded-2xl bg-slate-950 border border-white/10 px-4 py-3.5 text-xs font-mono">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">{t.balanceLabel}</span>
                    <span className="text-sm font-black text-slate-200">
                      {isBalanceLoading ? "Loading…" : `${userBalance ? formatXlm(Number(userBalance)) : "0.00"} XLM`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={fetchBalance}
                    disabled={isBalanceLoading}
                    className="text-cyan-400 hover:text-cyan-300 text-xs font-bold uppercase tracking-wider transition disabled:opacity-60"
                  >
                    Refresh
                  </button>
                </div>
              )}

              {publicKey ? (
                <form onSubmit={handleDonateSubmit} className="flex flex-col gap-4">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.0000001"
                      min="0.0000001"
                      required
                      placeholder={t.donatePlaceholder}
                      value={donateAmount}
                      onChange={(e) => setDonateAmount(e.target.value)}
                      disabled={txState.status === "pending"}
                      className={`w-full rounded-2xl bg-slate-950 border px-5 py-4.5 text-white text-sm font-bold font-mono placeholder-slate-700 focus:outline-none transition shadow-inner ${
                        inputValidation.valid ? "border-white/10 focus:border-cyan-400" : "border-rose-500/55 focus:border-rose-500"
                      }`}
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500 uppercase tracking-widest font-mono">
                      XLM
                    </span>
                  </div>
                  
                  {/* Warning labels */}
                  {!inputValidation.valid && (
                    <span className="text-xs font-bold text-rose-400 px-1 animate-pulse font-mono">
                      {inputValidation.reason}
                    </span>
                  )}

                  {/* Estimated remaining balance */}
                  {remainingBalance !== null && (
                    <div className="text-xs font-bold text-slate-400 px-1 flex items-center justify-between border border-white/5 rounded-xl px-4 py-2 bg-slate-950/40 font-mono">
                      <span>{t.remainingBalanceLabel}</span>
                      <span className="font-mono text-cyan-400">{t.remainingBalanceValue(remainingBalance)}</span>
                    </div>
                  )}
                  
                  {/* Presets (auto disabled if preset > wallet balance) */}
                  <div className="grid grid-cols-4 gap-2 mb-2 font-mono">
                    {[5, 10, 25, 50].map(amt => {
                      const disabledPreset = userBalance !== null && amt > Number(userBalance);
                      
                      return (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setDonateAmount(String(amt))}
                          disabled={txState.status === "pending" || disabledPreset}
                          className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition duration-200 ${
                            disabledPreset 
                              ? "bg-slate-950 border-white/5 text-slate-700 cursor-not-allowed opacity-20" 
                              : activeTab === "environment"
                                ? "border-emerald-500/10 bg-slate-900 text-slate-400 hover:text-emerald-300 hover:border-emerald-500/30 hover:bg-slate-800"
                                : activeTab === "education"
                                  ? "border-amber-500/10 bg-slate-900 text-slate-400 hover:text-amber-300 hover:border-amber-500/30 hover:bg-slate-800"
                                  : "border-rose-500/10 bg-slate-900 text-slate-400 hover:text-rose-300 hover:border-rose-500/30 hover:bg-slate-800"
                          }`}
                        >
                          +{amt} XLM
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="submit"
                    disabled={txState.status === "pending" || !inputValidation.valid}
                    className={`w-full rounded-2xl hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed py-4.5 text-sm font-black uppercase tracking-widest text-white shadow-lg transition-all duration-250 hover:scale-[1.01] font-display ${
                      activeTab === "environment" 
                        ? "bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 shadow-emerald-900/30" 
                        : activeTab === "education"
                          ? "bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 shadow-amber-900/30"
                          : "bg-gradient-to-r from-rose-400 via-purple-500 to-indigo-500 shadow-rose-900/30"
                    }`}
                  >
                    {txState.status === "pending" ? t.donatingBtn : t.donateBtn}
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={openModal}
                  disabled={isConnecting}
                  className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed py-4.5 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-cyan-900/30 transition-all duration-200 hover:scale-[1.01] font-display"
                >
                  {isConnecting ? t.connecting : t.connectWalletToDonate}
                </button>
              )}
            </div>

            {/* LEADERBOARD CARD */}
            <div className="glass rounded-3xl p-6 sm:p-8 border border-white/5 relative overflow-hidden shadow-xl cyber-scanline">
              <div className="absolute top-0 left-0 h-32 w-32 rounded-full bg-violet-600/5 blur-3xl" />
              <h3 className="text-md font-black tracking-widest text-white mb-6 flex items-center gap-2 border-b border-white/5 pb-3 font-display">
                <span>{t.leaderboardTitle}</span>
              </h3>

              {(() => {
                const hasDonors = campaign && campaign.top_donors && campaign.top_donors.length > 0;
                const displayDonors = hasDonors 
                  ? campaign.top_donors 
                  : [
                      { address: `GB2X...R4PQ (Alice - ${locale === "tr" ? "Örnek" : "Example"})`, amount: BigInt(200_000_000) },
                      { address: `GD4Y...K7LT (Bob - ${locale === "tr" ? "Örnek" : "Example"})`, amount: BigInt(100_000_000) },
                      { address: `GC3Z...M2NS (Charlie - ${locale === "tr" ? "Örnek" : "Example"})`, amount: BigInt(50_000_000) }
                    ];

                return (
                  <div className="space-y-3 mt-2 font-mono">
                    {displayDonors.map((donor, idx) => {
                      const rank = `#${idx + 1}`;
                      const isSelf = (publicKey && donor.address === publicKey) || donor.address.includes("(Siz)");
                      const isMock = !hasDonors;
                      
                      return (
                        <div
                          key={donor.address}
                          className={`flex items-center justify-between rounded-2xl border px-5 py-4 transition duration-350 hover:translate-x-1 ${
                            isSelf
                              ? "bg-cyan-500/5 border-cyan-500/25 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                              : isMock
                                ? "bg-slate-950/40 border-white/5 opacity-70"
                                : "bg-slate-950 border-white/5 hover:bg-slate-900 hover:border-white/10"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-black tracking-widest font-mono ${
                              idx === 0 ? "text-amber-400" : idx === 1 ? "text-slate-300" : idx === 2 ? "text-amber-600" : "text-slate-500"
                            }`}>{rank}</span>
                            <Tooltip content={donor.address}>
                              <span className="text-xs text-slate-200 font-bold hover:underline cursor-help">
                                {donor.address.includes("(Siz)") 
                                  ? donor.address.replace("(Siz)", "").trim() 
                                  : isMock 
                                    ? donor.address 
                                    : formatAddress(donor.address, 6, 6)}
                                {isSelf && ` (${locale === "tr" ? "Siz" : "You"})`} ℹ️
                              </span>
                            </Tooltip>
                          </div>
                          <span className="text-sm font-black text-cyan-400 shrink-0 ml-3">
                            {formatXlm(Number(donor.amount) / 10_000_000)} XLM
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* CANLI GEÇMİŞ (Horizon logs) */}
            <div className="glass rounded-3xl p-6 sm:p-8 border border-white/5 relative overflow-hidden shadow-xl cyber-scanline">
              <h3 className="text-md font-black tracking-widest text-white mb-6 flex items-center justify-between border-b border-white/5 pb-3 font-display">
                <span className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
                  </span>
                  <span>{t.activityTitle}</span>
                </span>
                <span className="text-[9px] uppercase font-black text-slate-500 font-mono tracking-wider">{t.liveFeedLabel}</span>
              </h3>

              {activities.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">{t.noActivity}</p>
              ) : (
                <div className="space-y-4 font-mono">
                  {activities.map((tx) => {
                    const isInit = tx.functionName === "initialize";
                    
                    return (
                      <div key={tx.id} className="rounded-2xl bg-slate-950 border border-white/5 p-4.5 transition hover:border-white/10 hover:bg-slate-900">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                            isInit ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                          }`}>
                            {isInit ? t.funcInitialize : t.funcFund}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {new Date(tx.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed mb-3">
                          <span className="text-slate-500 font-bold uppercase tracking-wider text-[8px] mr-1.5">{t.actorLabel}:</span>
                          <Tooltip content={tx.donor}>
                            <span className="hover:underline cursor-help">{formatAddress(tx.donor, 6, 6)} ℹ️</span>
                          </Tooltip>
                        </p>
                        
                        <div className="flex items-center justify-between border-t border-white/5 pt-3">
                          <span className="text-xs font-black text-slate-200">
                            {tx.amount !== null ? `${formatXlm(tx.amount)} XLM` : "-"}
                          </span>
                          {tx.hash !== "demo_claim_hash_stellar" && tx.hash !== "demo_tx_hash_stellar" && !tx.hash.startsWith("demo_tx_") && !tx.hash.startsWith("env_tx_") && !tx.hash.startsWith("edu_tx_") && !tx.hash.startsWith("h_tx_") ? (
                            <Tooltip content={tx.hash}>
                              <a
                                href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-black uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition"
                              >
                                Explorer ↗ ℹ️
                              </a>
                            </Tooltip>
                          ) : (
                            <Tooltip content={`Simulated Hash: ${tx.hash}`}>
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 select-none cursor-help">
                                Simulated ℹ️
                              </span>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Campaign Owner Panel */}
            {isOwner && (
              <div className="glass rounded-3xl p-6 sm:p-8 border border-cyan-400/25 shadow-xl relative overflow-hidden bg-cyan-950/5">
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest block mb-2 font-display">{t.ownerSectionTitle}</span>
                <h3 className="text-lg font-black tracking-tight text-white mb-4 font-display">
                  {locale === "tr" ? "Kilometre Taşı Dağıtım Paneli" : "Milestone Release Dashboard"}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {locale === "tr" 
                    ? "Kampanya yöneticisi olarak, kilometre taşı hedeflerine ulaşıldığında biriken fonları doğrudan cüzdanınıza çekebilirsiniz." 
                    : "As the campaign manager, you can disburse campaign funds directly to your wallet once progress targets are reached."}
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs py-2 border-b border-white/5 font-mono">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-300 font-display">{getMilestoneDetails(activeTab, 1, locale).title}</span>
                      <span className={`font-black uppercase text-[10px] ${campaign?.m1_claimed ? "text-slate-500" : progressPercent >= 25 ? "text-cyan-400" : "text-slate-600"}`}>
                        {campaign?.m1_claimed ? t.claimedStatus : progressPercent >= 25 ? "Available" : "Locked"}
                      </span>
                    </div>
                    {isOwner && progressPercent >= 25 && !campaign?.m1_claimed && (
                      <button
                        type="button"
                        onClick={() => handleClaimMilestone(1)}
                        disabled={isClaiming !== null}
                        className="rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-500/40 px-3 py-1.5 text-[10px] font-black uppercase text-white transition disabled:opacity-50 font-display"
                      >
                        {isClaiming === 1 ? t.claimingBtn : t.claimBtn}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs py-2 border-b border-white/5 font-mono">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-300 font-display">{getMilestoneDetails(activeTab, 2, locale).title}</span>
                      <span className={`font-black uppercase text-[10px] ${campaign?.m2_claimed ? "text-slate-500" : progressPercent >= 50 ? "text-violet-400" : "text-slate-600"}`}>
                        {campaign?.m2_claimed ? t.claimedStatus : progressPercent >= 50 ? "Available" : "Locked"}
                      </span>
                    </div>
                    {isOwner && progressPercent >= 50 && !campaign?.m2_claimed && (
                      <button
                        type="button"
                        onClick={() => handleClaimMilestone(2)}
                        disabled={isClaiming !== null}
                        className="rounded-lg bg-violet-500/20 hover:bg-violet-500/35 border border-violet-500/40 px-3 py-1.5 text-[10px] font-black uppercase text-white transition disabled:opacity-50 font-display"
                      >
                        {isClaiming === 2 ? t.claimingBtn : t.claimBtn}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs py-2 font-mono">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-300 font-display">{getMilestoneDetails(activeTab, 3, locale).title}</span>
                      <span className={`font-black uppercase text-[10px] ${campaign?.m3_claimed ? "text-slate-500" : progressPercent >= 100 ? "text-indigo-400" : "text-slate-600"}`}>
                        {campaign?.m3_claimed ? t.claimedStatus : progressPercent >= 100 ? "Available" : "Locked"}
                      </span>
                    </div>
                    {isOwner && progressPercent >= 100 && !campaign?.m3_claimed && (
                      <button
                        type="button"
                        onClick={() => handleClaimMilestone(3)}
                        disabled={isClaiming !== null}
                        className="rounded-lg bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-500/40 px-3 py-1.5 text-[10px] font-black uppercase text-white transition disabled:opacity-50 font-display"
                      >
                        {isClaiming === 3 ? t.claimingBtn : t.claimBtn}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Subtle promo advertisement footer pointing to SplitPay */}
        <footer className="mt-20 border-t border-white/5 pt-8 pb-4 text-center">
          <Link 
            href="/" 
            className="text-[10px] font-mono text-slate-600 hover:text-cyan-400/50 transition-all duration-300 tracking-widest uppercase"
          >
            {locale === "tr" 
              ? "⚡ SplitPay ile hesaplarınızı kolayca bölüştürmeyi deneyin!" 
              : "⚡ Try SplitPay to split your bills and expenses easily!"}
          </Link>
        </footer>

      </div>
    </div>
  );
}
