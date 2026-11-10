"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { setupWalletSelector, WalletSelector } from "@near-wallet-selector/core";
import { setupModal, WalletSelectorModal } from "@near-wallet-selector/modal-ui";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { NETWORK, NETWORK_CONFIG, CONTRACT_ID } from "./near";

import "@near-wallet-selector/modal-ui/styles.css";

interface WalletContextValue {
  selector: WalletSelector | null;
  modal: WalletSelectorModal | null;
  accountId: string | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => Promise<void>;
  callMethod: (method: string, args: object, deposit?: string) => Promise<any>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<WalletSelectorModal | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const cfg = NETWORK_CONFIG[NETWORK as keyof typeof NETWORK_CONFIG] || NETWORK_CONFIG.testnet;

      const sel = await setupWalletSelector({
        network: {
          networkId: cfg.networkId,
          nodeUrl: cfg.nodeUrl,
          helperUrl: cfg.helperUrl,
          explorerUrl: `https://${cfg.networkId === "mainnet" ? "" : "testnet."}nearblocks.io`,
          indexerUrl: "",
        },
        modules: [setupMyNearWallet()],
      });

      const m = setupModal(sel, {
        contractId: CONTRACT_ID || "placeholder.testnet",
      });

      setSelector(sel);
      setModal(m);

      const state = sel.store.getState();
      const accounts = state.accounts;
      if (accounts.length > 0) {
        setAccountId(accounts[0].accountId);
      }

      const sub = sel.store.observable.subscribe((s) => {
        const accs = s.accounts;
        setAccountId(accs.length > 0 ? accs[0].accountId : null);
      });

      return () => sub.unsubscribe();
    };

    init().catch(console.error);
  }, []);

  const connect = useCallback(() => {
    modal?.show();
  }, [modal]);

  const disconnect = useCallback(async () => {
    if (!selector) return;
    const wallet = await selector.wallet();
    await wallet.signOut();
    setAccountId(null);
  }, [selector]);

  const callMethod = useCallback(
    async (method: string, args: object, deposit = "0") => {
      if (!selector || !CONTRACT_ID) throw new Error("Wallet or contract not ready");
      const wallet = await selector.wallet();
      return wallet.signAndSendTransaction({
        receiverId: CONTRACT_ID,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: method,
              args,
              gas: "30000000000000",
              deposit,
            },
          },
        ],
      });
    },
    [selector]
  );

  return (
    <WalletContext.Provider
      value={{
        selector,
        modal,
        accountId,
        isConnected: !!accountId,
        connect,
        disconnect,
        callMethod,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
