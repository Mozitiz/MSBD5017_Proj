'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PlusCircle, ArrowLeft } from 'lucide-react'

interface User {
  id: string
  name: string
  avatar: string
  amount: number
}

interface BillSplitInterfaceProps {
  stake: number
  onExit: () => void
}

export default function BillSplitInterface({ stake, onExit }: BillSplitInterfaceProps) {
  const [total, setTotal] = useState(stake)
  const [isEditing, setIsEditing] = useState(false)
  const [users, setUsers] = useState<User[]>([
    { id: '1', name: 'You', avatar: '/placeholder.svg?height=50&width=50', amount: stake },
  ])

  const addUser = () => {
    const newUser = { 
      id: `${users.length + 1}`, 
      name: `User ${users.length + 1}`, 
      avatar: '/placeholder.svg?height=50&width=50', 
      amount: 0 
    }
    setUsers([...users, newUser])
  }

  const updateUserAmount = (id: string, amount: number) => {
    setUsers(users.map(user => 
      user.id === id ? { ...user, amount } : user
    ))
  }

  const totalSplit = users.reduce((sum, user) => sum + user.amount, 0)
  const isBalanced = Math.abs(totalSplit - total) < 0.01

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50 p-4">
      <Card className="mx-auto max-w-2xl bg-white/80 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold">Bill Split</CardTitle>
          <Button variant="ghost" size="icon" onClick={onExit}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-lg font-medium">Total Amount (Stake)</div>
            {isEditing ? (
              <Input
                type="number"
                value={total}
                onChange={(e) => setTotal(Number(e.target.value))}
                className="w-32"
                onBlur={() => setIsEditing(false)}
                autoFocus
              />
            ) : (
              <div 
                className="text-xl font-bold cursor-pointer" 
                onClick={() => setIsEditing(true)}
              >
                {total} U
              </div>
            )}
          </div>

          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>{user.name}</div>
                </div>
                <Input
                  type="number"
                  value={user.amount}
                  onChange={(e) => updateUserAmount(user.id, Number(e.target.value))}
                  className="w-24"
                />
              </div>
            ))}
          </div>

          <Button 
            onClick={addUser} 
            variant="outline" 
            className="w-full"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add User
          </Button>

          <div className="flex justify-between items-center">
            <div>Total Split: {totalSplit.toFixed(2)} U</div>
            <div className={isBalanced ? "text-green-500" : "text-red-500"}>
              {isBalanced ? "Balanced" : "Not Balanced"}
            </div>
          </div>

          <Button 
            className="w-full" 
            disabled={!isBalanced}
          >
            Confirm Split
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

