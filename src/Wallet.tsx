import React, {FC, ReactElement, useMemo} from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import {
  PhantomWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { createDefaultAuthorizationResultCache, SolanaMobileWalletAdapter } from '@solana-mobile/wallet-adapter-mobile';
import config from "./config";

// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');

interface WalletProps {
  children: ReactElement;
}

export const Wallet: FC<WalletProps> = ({ children }: WalletProps) => {
  const endpoint = config.rpcUrl;

  //  or you can do this way:
  // const network = WalletAdapterNetwork.Devnet;
  // const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    // uncomment other wallets if needed
    () => [
      new SolanaMobileWalletAdapter({
        appIdentity: { name: 'Solana Wallet Adapter App' },
        authorizationResultCache: createDefaultAuthorizationResultCache(),
      }),
      // new CoinbaseWalletAdapter(),
      new PhantomWalletAdapter(),
      // new GlowWalletAdapter(),
      // new SlopeWalletAdapter(),
      // new SolflareWalletAdapter({ network }),
      // new TorusWalletAdapter(),
    ],
    [endpoint]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletMultiButton />
          <WalletDisconnectButton />
          { children }
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};