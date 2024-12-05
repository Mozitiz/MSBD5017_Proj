'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Users, Home, Plus, ArrowLeft, SplitSquareVertical } from 'lucide-react'
import SignatureModal from './signature-modal'

interface User {
  id: string
  name: string
  avatar: string
  amount: number
  isOwner?: boolean
  hasSigned?: boolean
}

interface BillSplitRoomProps {
  roomId: string
  initialStake: number
  currentUserId: string
  onCancel: () => void
  onConfirm: (amounts: { [key: string]: number }) => void
  onReturnToDashboard: () => void
}

export default function BillSplitRoom({ 
  roomId, 
  initialStake, 
  currentUserId,
  onCancel, 
  onConfirm,
  onReturnToDashboard
}: BillSplitRoomProps) {
  const [total, setTotal] = useState<number>(initialStake)
  const [users, setUsers] = useState<User[]>([
    { 
      id: currentUserId, 
      name: 'You', 
      avatar: '/placeholder.svg?height=40&width=40', 
      amount: initialStake,
      isOwner: true,
      hasSigned: false
    }
  ])
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal')
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [isCheckoutComplete, setIsCheckoutComplete] = useState(false)

  useEffect(() => {
    if (splitMode === 'equal') {
      handleEqualSplit()
    }
  }, [total, users.length, splitMode])

  const handleEqualSplit = () => {
    if (isCheckoutComplete) return
    const splitAmount = Number((total / users.length).toFixed(2))
    const updatedUsers = users.map(user => ({
      ...user,
      amount: splitAmount
    }))
    setUsers(updatedUsers)
  }

  const handleCustomSplit = () => {
    if (isCheckoutComplete) return
    setSplitMode('custom')
  }

  const updateUserAmount = (id: string, amount: number) => {
    if (isCheckoutComplete) return
    const updatedUsers = users.map(user =>
      user.id === id ? { ...user, amount } : user
    )
    setUsers(updatedUsers)
    if (splitMode === 'custom') {
      const newTotal = updatedUsers.reduce((sum, user) => sum + user.amount, 0)
      setTotal(newTotal)
    }
  }

  const addUser = () => {
    if (isCheckoutComplete) return
    const newUser = {
      id: String(users.length + 1),
      name: `User ${users.length}`,
      avatar: '/placeholder.svg?height=40&width=40',
      amount: splitMode === 'equal' ? total / (users.length + 1) : 0,
      hasSigned: false
    }
    setUsers(prevUsers => [...prevUsers, newUser])
  }

  const handleSign = () => {
    setUsers(users.map(user =>
      user.id === currentUserId ? { ...user, hasSigned: true } : user
    ))
    if (users.every(user => user.hasSigned || user.id === currentUserId)) {
      onConfirm(users.reduce((acc, user) => ({
        ...acc,
        [user.id]: user.amount
      }), {}))
      setIsCheckoutComplete(true)
    }
  }

  const totalSplit = users.reduce((sum, user) => sum + user.amount, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 p-4 flex items-center justify-center">
      <Card className="w-full max-w-2xl bg-white/80 backdrop-blur shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
          <div className="flex items-center space-x-2">
            <SplitSquareVertical className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-purple-800">Bill Split</h2>
          </div>
          <span className="text-sm text-purple-600 font-medium">Room: {roomId}</span>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="flex items-center justify-between gap-4 bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 flex-1">
              <Label htmlFor="total" className="text-lg font-medium text-purple-800">Total:</Label>
              <Input
                id="total"
                type="number"
                value={total || ''}
                onChange={(e) => !isCheckoutComplete && setTotal(Number(e.target.value))}
                className="bg-white border-purple-200 text-purple-800 placeholder:text-purple-300"
                placeholder="0"
                disabled={isCheckoutComplete}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="split-mode" className="text-sm font-medium text-purple-600">
                {splitMode === 'equal' ? 'Equal' : 'Custom'} Split
              </Label>
              <Switch
                id="split-mode"
                checked={splitMode === 'custom'}
                onCheckedChange={(checked) => checked ? handleCustomSplit() : setSplitMode('equal')}
                disabled={isCheckoutComplete}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between px-4 py-2 bg-purple-200 rounded-t-lg">
              <span className="font-semibold text-purple-800">User</span>
              <span className="font-semibold text-purple-800">Bill</span>
            </div>
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    {user.isOwner && (
                      <Home className="absolute -top-1 -left-1 h-4 w-4 text-blue-500 bg-white rounded-full p-0.5" />
                    )}
                  </div>
                  <span className="font-medium text-indigo-800">{user.name}</span>
                </div>
                <Input
                  type="number"
                  value={user.amount.toFixed(2)}
                  onChange={(e) => updateUserAmount(user.id, Number(e.target.value))}
                  className="w-24 bg-white border-indigo-200 text-indigo-800 text-right"
                  disabled={splitMode === 'equal' || isCheckoutComplete}
                />
              </div>
            ))}
          </div>

          <Button
            onClick={addUser}
            variant="outline"
            className="w-full border-dashed border-purple-300 text-purple-600 hover:bg-purple-50"
            disabled={isCheckoutComplete}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>

          <div className="flex justify-between items-center bg-indigo-100 p-4 rounded-lg">
            <span className="text-lg font-medium text-indigo-800">Total Split:</span>
            <span className="text-xl font-bold text-indigo-600">{totalSplit.toFixed(2)} U</span>
          </div>

          {isCheckoutComplete && (
            <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Checkout Complete!</strong>
              <span className="block sm:inline"> The bill has been successfully split and paid.</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end space-x-4 border-t pt-6">
          {isCheckoutComplete ? (
            <Button
              onClick={onReturnToDashboard}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Dashboard
            </Button>
          ) : (
            <>
              <Button
                onClick={onCancel}
                variant="outline"
                className="border-purple-300 text-purple-600 hover:bg-purple-50"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setShowSignatureModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={Math.abs(totalSplit - total) > 0.01 || users.length < 2}
              >
                Confirm Split
              </Button>
            </>
          )}
        </CardFooter>
      </Card>

      <SignatureModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        total={total}
        users={users}
        onSign={handleSign}
        currentUserId={currentUserId}
      />
    </div>
  )
}

