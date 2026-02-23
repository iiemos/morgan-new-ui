import React from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';

function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { t } = useTranslation();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3 bg-primary/10 px-4 py-2 rounded-xl border border-primary/30">
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
        <span className="text-sm font-medium">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button
          onClick={() => disconnect()}
          className="text-red-400 hover:text-red-300 transition-colors"
        >
          <Icon icon="mdi:logout" className="text-lg" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => connect({ connector: connectors[0] })}
        disabled={isPending}
        className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-xl border border-primary/30 transition-all font-medium text-sm"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <Icon icon="mdi:loading" className="animate-spin" />
            {t('wallet.connecting')}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Icon icon="mdi:wallet" />
            {t('wallet.connect')}
          </span>
        )}
      </button>
    </div>
  );
}

export default WalletConnect;