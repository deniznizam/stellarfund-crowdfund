"use client";
import { useCallback, useEffect, useState } from "react";
import { StellarWalletsKit, Networks } from "@creit-tech/stellar-wallets-kit";
import { FREIGHTER_ID, FreighterModule } from "@creit-tech/stellar-wallets-kit/modules/freighter";
import { xBullModule } from "@creit-tech/stellar-wallets-kit/modules/xbull";
import { LobstrModule } from "@creit-tech/stellar-wallets-kit/modules/lobstr";
import { classifyError, type DonateError } from "@/lib/crowdfund";

export type WalletState = { publicKey: string | null; isConnecting: boolean; error: DonateError | null };

export function useWallets() {
  const [state, setState] = useState<WalletState>({ publicKey: null, isConnecting: false, error: null });

  useEffect(() => {
    StellarWalletsKit.init({
      network: Networks.TESTNET,
      selectedWalletId: FREIGHTER_ID,
      modules: [new FreighterModule(), new xBullModule(), new LobstrModule()],
    });
  }, []);

  const openModal = useCallback(async () => {
    setState(s => ({ ...s, error: null, isConnecting: true }));
    try {
      const { address } = await StellarWalletsKit.authModal();
      setState({ publicKey: address, isConnecting: false, error: null });
    } catch (err) {
      const isClosed = err && typeof err === "object" && "message" in err && (err as { message: string }).message === "The user closed the modal.";
      if (isClosed) {
        setState(s => ({ ...s, isConnecting: false }));
      } else {
        setState(s => ({ ...s, isConnecting: false, error: classifyError(err) }));
      }
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await StellarWalletsKit.disconnect();
    } catch (e) {
      console.error(e);
    }
    setState({ publicKey: null, isConnecting: false, error: null });
  }, []);

  const signXdr = useCallback(async (xdr: string): Promise<string> => {
    const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
      networkPassphrase: Networks.TESTNET,
    });
    return signedTxXdr;
  }, []);

  return { ...state, openModal, disconnect, signXdr };
}
