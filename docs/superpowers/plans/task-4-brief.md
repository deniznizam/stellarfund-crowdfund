# Task 4 Brief: Hook integration & wallets context (src/hooks/useWallets.ts)

## Goal
Create `src/hooks/useWallets.ts` to manage cüzdan connection state, connection events, modal display, and transaction signing for Freighter, xBull, and Lobstr.

## Files
- Create: `src/hooks/useWallets.ts`

## Interfaces
- Produces:
  - `publicKey: string | null`: The current connected account address.
  - `isConnecting: boolean`: Wallet modal open or loading state.
  - `error: DonateError | null`: Wallet connection or permission errors.
  - `openModal()`: Triggers the StellarWalletsKit selection modal.
  - `disconnect()`: Clears the current connection state.
  - `signXdr(xdr: string) -> Promise<string>`: Prompts the active wallet to sign the built transaction XDR and returns the signed XDR.

## Verbatim Code
```typescript
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  StellarWalletsKit, WalletNetwork,
  FREIGHTER_ID, XBULL_ID, LOBSTR_ID,
  FreighterModule, xBullModule, LobstrModule,
} from "@creit-tech/stellar-wallets-kit";
import { classifyError, type DonateError } from "@/lib/crowdfund";

export type WalletState = { publicKey: string | null; isConnecting: boolean; error: DonateError | null };

export function useWallets() {
  const kitRef = useRef<StellarWalletsKit | null>(null);
  const [state, setState] = useState<WalletState>({ publicKey: null, isConnecting: false, error: null });

  useEffect(() => {
    kitRef.current = new StellarWalletsKit({
      network: WalletNetwork.TESTNET,
      selectedWalletId: FREIGHTER_ID,
      modules: [new FreighterModule(), new xBullModule(), new LobstrModule()],
    });
  }, []);

  const openModal = useCallback(() => {
    setState(s => ({ ...s, error: null, isConnecting: true }));
    kitRef.current?.openModal({
      onWalletSelected: async (option) => {
        try {
          kitRef.current!.setWallet(option.id);
          const { address } = await kitRef.current!.getAddress();
          setState({ publicKey: address, isConnecting: false, error: null });
        } catch (err) {
          setState(s => ({ ...s, isConnecting: false, error: classifyError(err) }));
        }
      },
      onClosed: () => setState(s => ({ ...s, isConnecting: false })),
    });
  }, []);

  const disconnect = useCallback(() => setState({ publicKey: null, isConnecting: false, error: null }), []);

  const signXdr = useCallback(async (xdr: string): Promise<string> => {
    const { signedTxXdr } = await kitRef.current!.signTransaction(xdr, {
      networkPassphrase: WalletNetwork.TESTNET,
    });
    return signedTxXdr;
  }, []);

  return { ...state, openModal, disconnect, signXdr };
}
```
