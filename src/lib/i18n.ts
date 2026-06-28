import { formatXlm } from "@/lib/split";

export type Locale = "en" | "tr";

export type Copy = {
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  connectPromptTitle: string;
  connectPromptBody: string;
  balanceLabel: string;
  balanceSource: string;
  refresh: string;
  getTestXlm: string;
  funding: string;
  splitEyebrow: string;
  splitTitle: string;
  splitDescription: string;
  totalBill: string;
  peopleAtTable: string;
  youPayFor: string;
  youPayForHint: string;
  perPerson: string;
  yourShare: string;
  recipient: string;
  recipientHint: string;
  memoLabel: string;
  memoPlaceholder: string;
  memoHint: string;
  copySummary: string;
  copiedSummary: string;
  sendPayment: string;
  sendingPayment: string;
  connectToPay: string;
  connected: string;
  connectFreighter: string;
  connecting: string;
  disconnect: string;
  txLoadingTitle: string;
  txSuccessTitle: string;
  txErrorTitle: string;
  txWaiting: string;
  viewExplorer: string;
  hashLabel: string;
  footer: string;
  balanceLoadError: string;
  walletConnectError: string;
  fundingError: string;
  sendError: string;
  txSuccessMessage: (amount: string, payFor: number, total: number) => string;
  scenariosLabel: string;
  pizzaNightName: string;
  lunaDinnerName: string;
  coffeeBreakName: string;
  hostLabel: string;
  youLabel: string;
  friendLabel: string;
  receivesLabel: string;
  paysLabel: string;
  unpaidLabel: string;
  receiptHeader: string;
  receiptFooter: string;
  shareTitle: string;
  shareWhatsapp: string;
  shareTelegram: string;
  shareText: (total: string, share: string, yours: string, host: string) => string;
  // Feature 1 – balance check
  insufficientBalance: string;
  // Feature 3 – copy address
  copyAddress: string;
  addressCopied: string;
  // Feature 4 – QR
  qrLabel: string;
  // Feature 6 – account validation
  checkingAccount: string;
  recipientValid: string;
  recipientNotFound: string;
  // Feature 7 – multi-pay
  multiPayTitle: string;
  multiPayDesc: string;
  addRecipient: string;
  totalToSend: string;
  sendAll: string;
  sendingAll: string;
  multiMemoLabel: string;
  multiMemoPlaceholder: string;
  multiTxSuccess: string;
  multiTxError: string;
};

const en: Copy = {
  tagline: "Safe & Friendly Bill Splitter",
  heroTitle: "SplitPay",
  heroSubtitle:
    "Split restaurant bills and group expenses with friends, then pay your portion instantly with secure digital test coins.",
  connectPromptTitle: "Ready to settle up?",
  connectPromptBody:
    "Connect your digital wallet to instantly calculate shares and pay your portion to the host.",
  balanceLabel: "Your Available Balance",
  balanceSource: "Secured on the digital network · Live",
  refresh: "Refresh",
  getTestXlm: "Get Free Test Money",
  funding: "Adding funds…",
  splitEyebrow: "Settle the bill",
  splitTitle: "Calculate shares & pay instantly",
  splitDescription:
    "Enter the total bill, table size, and the number of shares you want to cover. SplitPay handles the rest.",
  totalBill: "Total bill (XLM)",
  peopleAtTable: "People sharing the bill",
  youPayFor: "You are covering",
  youPayForHint: "people's share",
  perPerson: "Each person owes",
  yourShare: "Your total portion to send",
  recipient: "Host's Stellar Address",
  recipientHint: "Enter the Stellar address of the friend who paid the main bill.",
  memoLabel: "On-chain memo (optional)",
  memoPlaceholder: "Pizza night",
  memoHint: "Visible on Stellar Expert · max 28 characters.",
  copySummary: "Copy payment summary",
  copiedSummary: "Copied!",
  sendPayment: "Pay My Share Now",
  sendingPayment: "Sending your share safely…",
  connectToPay: "Connect Wallet to Send",
  connected: "Connected",
  connectFreighter: "Connect Wallet",
  connecting: "Connecting…",
  disconnect: "Disconnect",
  txLoadingTitle: "Payment in progress",
  txSuccessTitle: "Payment Succeeded!",
  txErrorTitle: "Payment Failed",
  txWaiting: "Please confirm the payment in Freighter…",
  viewExplorer: "Verify on-chain →",
  hashLabel: "Transaction ID",
  footer: "SplitPay · Settle expenses with friends safely using Stellar",
  balanceLoadError: "Could not fetch balance. Get some free test money and try again.",
  walletConnectError: "Could not link your wallet.",
  fundingError: "Could not receive free test money.",
  sendError: "Something went wrong sending your share.",
  txSuccessMessage: (amount, payFor, total) =>
    `Successfully paid ${amount} XLM for ${payFor} of ${total} shares.`,
  scenariosLabel: "Try a quick demo scenario:",
  pizzaNightName: "Pizza Night",
  lunaDinnerName: "Dinner at Luna",
  coffeeBreakName: "Coffee Break",
  hostLabel: "Host",
  youLabel: "You",
  friendLabel: "Friend",
  receivesLabel: "receives",
  paysLabel: "pays",
  unpaidLabel: "unpaid",
  receiptHeader: "BILL SPLIT RECEIPT",
  receiptFooter: "THANK YOU FOR USING SPLITPAY",
  shareTitle: "Send receipt to friends:",
  shareWhatsapp: "WhatsApp",
  shareTelegram: "Telegram",
  shareText: (total, share, yours, host) =>
    `We split the bill with SplitPay! Total: ${total} XLM · Per person: ${share} XLM · My share of ${yours} XLM sent to ${host}.`,
  // Feature 1
  insufficientBalance: "Insufficient balance for this payment.",
  // Feature 3
  copyAddress: "Copy address",
  addressCopied: "Copied!",
  // Feature 4
  qrLabel: "Scan to get host's address",
  // Feature 6
  checkingAccount: "Checking address…",
  recipientValid: "Account found on testnet ✓",
  recipientNotFound: "No account found on testnet — recipient must activate their wallet first.",
  // Feature 7
  multiPayTitle: "Multi-Pay",
  multiPayDesc: "Bundle payments to multiple people into a single Stellar transaction.",
  addRecipient: "Add recipient",
  totalToSend: "Total to send",
  sendAll: "Send All",
  sendingAll: "Sending…",
  multiMemoLabel: "Batch memo (optional)",
  multiMemoPlaceholder: "Group dinner",
  multiTxSuccess: "All payments sent successfully!",
  multiTxError: "Multi-payment failed.",
};

const tr: Copy = {
  tagline: "Güvenli ve Kolay Hesap Bölücü",
  heroTitle: "SplitPay",
  heroSubtitle:
    "Yemek hesaplarını ve grup masraflarını arkadaşlarınızla kolayca bölüşün, payınızı dijital test parasıyla saniyeler içinde ödeyin.",
  connectPromptTitle: "Hesaplaşmaya hazır mısınız?",
  connectPromptBody:
    "Payınızı anında hesaplamak ve hesabı ödeyen kişiye göndermek için cüzdanınızı bağlayın.",
  balanceLabel: "Kullanılabilir Bakiyeniz",
  balanceSource: "Dijital ağda güvenle korunuyor · Canlı",
  refresh: "Yenile",
  getTestXlm: "Bedava Test Parası Al",
  funding: "Yükleniyor…",
  splitEyebrow: "Hesabı bölüşün",
  splitTitle: "Payını hesapla, anında öde",
  splitDescription:
    "Toplam tutarı, masadaki kişi sayısını ve kaç kişilik pay ödeyeceğinizi girin. Gerisini SplitPay halleder.",
  totalBill: "Toplam hesap (XLM)",
  peopleAtTable: "Hesabı bölüşen kişi sayısı",
  youPayFor: "Ödeyeceğiniz pay sayısı",
  youPayForHint: "kişilik pay",
  perPerson: "Kişi başı düşen pay",
  yourShare: "Göndereceğiniz toplam pay",
  recipient: "Hesabı Ödeyen Arkadaşınızın Adresi",
  recipientHint: "Hesabın tamamını ödeyen arkadaşınızın Stellar adresini girin.",
  memoLabel: "Zincir üstü not (isteğe bağlı)",
  memoPlaceholder: "Pizza Gecesi",
  memoHint: "Stellar Expert'te görünür · maks. 28 karakter.",
  copySummary: "Ödeme özetini kopyala",
  copiedSummary: "Kopyalandı!",
  sendPayment: "Payımı Şimdi Gönder",
  sendingPayment: "Payınız güvenle gönderiliyor…",
  connectToPay: "Göndermek için Cüzdanı Bağla",
  connected: "Bağlı",
  connectFreighter: "Cüzdanı Bağla",
  connecting: "Bağlanıyor…",
  disconnect: "Bağlantıyı Kes",
  txLoadingTitle: "Ödeme işlemi yapılıyor",
  txSuccessTitle: "Ödeme Başarıyla Gönderildi!",
  txErrorTitle: "Ödeme Başarısız Oldu",
  txWaiting: "Lütfen Freighter'daki ödeme onayını kabul edin…",
  viewExplorer: "Zincirde doğrula →",
  hashLabel: "İşlem ID'si",
  footer: "SplitPay · Masrafları Stellar ağı ile güvenle bölüşün",
  balanceLoadError: "Bakiye yüklenemedi. Aşağıdan bedava test parası alıp tekrar deneyin.",
  walletConnectError: "Cüzdan bağlantısı kurulamadı.",
  fundingError: "Test parası yüklenemedi.",
  sendError: "Payınız gönderilirken bir hata oluştu.",
  txSuccessMessage: (amount, payFor, total) =>
    `Toplam ${total} paydan ${payFor} kişilik pay için ${amount} XLM başarıyla gönderildi.`,
  scenariosLabel: "Bir demo senaryosu deneyin:",
  pizzaNightName: "Pizza Gecesi",
  lunaDinnerName: "Luna Akşam Yemeği",
  coffeeBreakName: "Kahve Molası",
  hostLabel: "Host",
  youLabel: "Siz",
  friendLabel: "Arkadaş",
  receivesLabel: "alır",
  paysLabel: "öder",
  unpaidLabel: "ödenmedi",
  receiptHeader: "ADİSYON DETAYI",
  receiptFooter: "SPLITPAY'İ TERCİH ETTİĞİNİZ İÇİN TEŞEKKÜRLER",
  shareTitle: "Fişi arkadaşlarına gönder:",
  shareWhatsapp: "WhatsApp",
  shareTelegram: "Telegram",
  shareText: (total, share, yours, host) =>
    `Hesabı SplitPay ile bölüştük! Toplam: ${total} XLM · Kişi başı: ${share} XLM · ${yours} XLM'lik payımı ${host} adresine gönderdim.`,
  // Feature 1
  insufficientBalance: "Bu ödeme için bakiyeniz yetersiz.",
  // Feature 3
  copyAddress: "Adresi kopyala",
  addressCopied: "Kopyalandı!",
  // Feature 4
  qrLabel: "Host adresini taratın",
  // Feature 6
  checkingAccount: "Adres kontrol ediliyor…",
  recipientValid: "Testnet'te hesap bulundu ✓",
  recipientNotFound: "Testnet'te bu adreste hesap bulunamadı — alıcı önce cüzdanını aktive etmeli.",
  // Feature 7
  multiPayTitle: "Toplu Ödeme",
  multiPayDesc: "Birden fazla kişiye ödemeyi tek bir Stellar işleminde birleştirin.",
  addRecipient: "Kişi ekle",
  totalToSend: "Toplam gönderilecek",
  sendAll: "Tümünü Gönder",
  sendingAll: "Gönderiliyor…",
  multiMemoLabel: "Toplu not (isteğe bağlı)",
  multiMemoPlaceholder: "Grup yemeği",
  multiTxSuccess: "Tüm ödemeler başarıyla gönderildi!",
  multiTxError: "Toplu ödeme başarısız oldu.",
};

export const copy: Record<Locale, Copy> = { en, tr };

export function getAppUrl(): string {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://your-splitpay.vercel.app";
}

export function buildShareSummary(
  locale: Locale,
  perPersonShare: number,
  appUrl = getAppUrl()
): string {
  const amount = `${formatXlm(perPersonShare)} XLM`;
  if (locale === "tr") {
    return `SplitPay ile hesaplaştık! Kişi başı düşen pay: ${amount}. Ödemek için: ${appUrl}`;
  }
  return `We split with SplitPay! Per person: ${amount}. Pay here: ${appUrl}`;
}
