import { Metadata } from "next";
import { CrowdfundPage } from "@/components/CrowdfundPage";

export const metadata: Metadata = {
  title: "StellarFund | Güvenli Blokzinciri Fonlama Platformu",
  description: "Stellar Soroban akıllı sözleşmeleri ile korunan, şeffaf ve adım adım güvenli kitlesel fonlama platformu.",
};

export default function FundPage() {
  return <CrowdfundPage />;
}
