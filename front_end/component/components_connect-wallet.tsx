'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Wallet } from 'lucide-react'

declare global {
  interface Window {
    ethereum?: any
  }
}

export default function ConnectWallet({ onConnect }: { onConnect: (account: string) => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connectWallet = async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed')
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (accounts.length > 0) {
        onConnect(accounts[0])
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-green-50">
      <Card className="w-[380px]">
        <CardHeader>
          <CardTitle className="text-center">Connect Your Wallet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full"
            size="lg"
            onClick={connectWallet}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wallet className="mr-2 h-4 w-4" />
            )}
            Connect MetaMask
          </Button>
          {error && (
            <p className="text-center text-sm text-red-500">{error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

