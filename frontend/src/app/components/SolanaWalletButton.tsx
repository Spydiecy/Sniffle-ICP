'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { FaWallet } from 'react-icons/fa';

// Note: Keeping Solana wallet functionality as requested
// This component will be updated to use ICP wallet when ready
export default function SolanaWalletButton() {
  const { connected, publicKey } = useWallet();

  return (
    <div className="flex items-center gap-2">
      <WalletMultiButton className="!bg-icp-teal hover:!bg-icp-teal-dark !rounded-lg !px-4 !py-2 !text-white !font-medium !transition-colors hover:!shadow-lg hover:!shadow-icp-teal/30" />
    </div>
  );
}
