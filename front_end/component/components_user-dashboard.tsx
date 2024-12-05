'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronRight, Plus, History, LogOut } from 'lucide-react'
import BillsHistory from './bills-history'
import CreateRoomModal from './create-room-modal'
import BillSplitRoom from './bill-split-room'

interface Bill {
  id: string
  amount: number
  paid: boolean
  date: string
}

interface DashboardProps {
  account: string
  onDisconnect: () => void
}

export default function UserDashboard({ account, onDisconnect }: DashboardProps) {
  const [balance, setBalance] = useState<number>(0)
  const [bills, setBills] = useState<Bill[]>([])
  const [showBillsHistory, setShowBillsHistory] = useState(false)
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false)
  const [showBillSplitRoom, setShowBillSplitRoom] = useState(false)
  const [currentRoomStake, setCurrentRoomStake] = useState<number>(0)
  const [currentRoomId, setCurrentRoomId] = useState<string>('')

  useEffect(() => {
    const fetchBalance = async () => {
      setBalance(200)
    }

    const fetchBills = async () => {
      const mockBills: Bill[] = [
        { id: '1', amount: 50, paid: true, date: '2023-05-01' },
        { id: '2', amount: 30, paid: true, date: '2023-05-15' },
        { id: '3', amount: 20, paid: false, date: '2023-06-01' },
      ]
      setBills(mockBills)
    }

    fetchBalance()
    fetchBills()
  }, [account])

  const totalBills = bills.length
  const billsPaid = bills.filter(bill => bill.paid).length
  const repaymentRate = totalBills > 0 ? Math.round((billsPaid / totalBills) * 100) : 0

  const handleCreateRoom = (stake: number) => {
    setCurrentRoomStake(stake)
    setCurrentRoomId(`0X${Math.random().toString(16).substr(2, 6).toUpperCase()}`)
    setShowCreateRoomModal(false)
    setShowBillSplitRoom(true)
  }

  const handleConfirmSplit = (amounts: { [key: string]: number }) => {
    console.log('Split confirmed:', amounts)
    // Here you would typically send this data to your backend or smart contract
    const newBill: Bill = {
      id: `${bills.length + 1}`,
      amount: Object.values(amounts).reduce((sum, amount) => sum + amount, 0),
      paid: true,
      date: new Date().toISOString().split('T')[0]
    }
    setBills([...bills, newBill])
    setBalance(prevBalance => prevBalance - newBill.amount)
  }

  const handleReturnToDashboard = () => {
    setShowBillSplitRoom(false)
  }

  if (showBillSplitRoom) {
    return (
      <BillSplitRoom
        roomId={currentRoomId}
        initialStake={currentRoomStake}
        currentUserId={account}
        onCancel={() => setShowBillSplitRoom(false)}
        onConfirm={handleConfirmSplit}
        onReturnToDashboard={handleReturnToDashboard}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card className="bg-white/80 backdrop-blur shadow-xl">
          <CardHeader className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20 border-2 border-purple-200">
                <AvatarImage src="/placeholder.svg?height=80&width=80" alt="User" />
                <AvatarFallback>ME</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold text-purple-800">Welcome back!</h2>
                <p className="text-sm text-gray-500">
                  Wallet: {account.slice(0, 6)}...{account.slice(-4)}
                </p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-500">Current Balance</p>
              <p className="text-3xl font-bold text-purple-600">{balance} U</p>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
            <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
              <CardContent className="flex flex-col items-center justify-center h-full p-6">
                <p className="text-3xl font-bold">{totalBills}</p>
                <p className="text-sm">Total Bills</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
              <CardContent className="flex flex-col items-center justify-center h-full p-6">
                <p className="text-3xl font-bold">{billsPaid}</p>
                <p className="text-sm">Bills Paid</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white">
              <CardContent className="flex flex-col items-center justify-center h-full p-6">
                <p className="text-3xl font-bold">{repaymentRate}%</p>
                <p className="text-sm">Repayment Rate</p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="w-full justify-between bg-white/80 backdrop-blur hover:bg-white"
            onClick={() => setShowBillsHistory(true)}
          >
            <div className="flex items-center">
              <History className="mr-2 h-4 w-4" />
              Bills History
            </div>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button 
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => setShowCreateRoomModal(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Room
          </Button>
        </div>

        <Button 
          variant="outline" 
          className="w-full justify-center bg-white/80 backdrop-blur hover:bg-white text-red-600 hover:text-red-700"
          onClick={onDisconnect}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect Wallet
        </Button>
      </div>

      {showBillsHistory && (
        <BillsHistory 
          bills={bills} 
          onClose={() => setShowBillsHistory(false)} 
        />
      )}

      <CreateRoomModal 
        isOpen={showCreateRoomModal}
        onClose={() => setShowCreateRoomModal(false)}
        onCreateRoom={handleCreateRoom}
      />
    </div>
  )
}

