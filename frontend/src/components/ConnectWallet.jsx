// src/components/ConnectWallet.tsx
'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

export function ConnectWallet() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected) {
    return (
      <div className="text-center">
        <p className="mb-2">Connected to: {address}</p>
        <button onClick={() => disconnect()} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => connect({ connector: injected() })} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
      Connect Wallet
    </button>
  )
}