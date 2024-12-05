'use client'

import { useState } from 'react'
import ConnectWallet from '@/components/connect-wallet'
import UserDashboard from '@/components/user-dashboard'

export default function Home() {
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null)

  const handleConnect = (account: string) => {
    setConnectedAccount(account)
  }

  const handleDisconnect = () => {
    setConnectedAccount(null)
  }

  if (!connectedAccount) {
    return <ConnectWallet onConnect={handleConnect} />
  }

  return <UserDashboard account={connectedAccount} onDisconnect={handleDisconnect} />
}

