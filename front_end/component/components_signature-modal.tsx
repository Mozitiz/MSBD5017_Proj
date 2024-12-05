'use client'

import { useState, useEffect } from 'react'
import { Check, Home, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import confetti from 'canvas-confetti'

interface User {
  id: string
  name: string
  avatar: string
  amount: number
  isOwner?: boolean
  hasSigned?: boolean
}

interface SignatureModalProps {
  isOpen: boolean
  onClose: () => void
  total: number
  users: User[]
  onSign: () => void
  currentUserId: string
}

export default function SignatureModal({
  isOpen,
  onClose,
  total,
  users,
  onSign,
  currentUserId
}: SignatureModalProps) {
  const [localUsers, setLocalUsers] = useState(users)
  const [isPaymentComplete, setIsPaymentComplete] = useState(false)
  const currentUser = localUsers.find(user => user.id === currentUserId)
  const isOwner = currentUser?.isOwner
  const allOthersHaveSigned = localUsers
    .filter(user => !user.isOwner)
    .every(user => user.hasSigned)
  const canSign = isOwner && allOthersHaveSigned

  useEffect(() => {
    setLocalUsers(users.map(user => ({
      ...user,
      hasSigned: user.isOwner ? false : true
    })))
  }, [users])

  const handleSign = () => {
    setLocalUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === currentUserId ? { ...user, hasSigned: true } : user
      )
    )
    if (isOwner) {
      setIsPaymentComplete(true)
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
    }
    onSign()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-purple-800">
            {isPaymentComplete ? 'Payment Complete' : 'Checkout'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {isPaymentComplete ? (
            <div className="text-center space-y-4">
              <div className="text-4xl font-bold text-green-500">
                🎉 Payment Complete! 🎉
              </div>
              <p className="text-gray-600">
                The bill has been successfully split and paid.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2 text-center">
                <div className="text-2xl font-medium text-purple-600">Total {total} U</div>
                <div className="text-sm text-gray-500">Number of Users: {localUsers.length}</div>
              </div>

              <ScrollArea className="h-[300px] rounded-md border p-4">
                <div className="space-y-4">
                  {localUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>{user.name[0]}</AvatarFallback>
                          </Avatar>
                          {user.isOwner && (
                            <Home className="absolute -top-1 -right-1 h-4 w-4 text-blue-500 bg-white rounded-full p-0.5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.amount} U</p>
                        </div>
                      </div>
                      <div>
                        {user.hasSigned ? (
                          <Check className="h-6 w-6 text-green-500" />
                        ) : (
                          <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
        <DialogFooter>
          {isPaymentComplete ? (
            <Button onClick={onClose} className="w-full bg-green-500 hover:bg-green-600 text-white">
              Close
            </Button>
          ) : (
            <Button
              onClick={handleSign}
              disabled={!canSign}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-300"
            >
              {isOwner ? 'Confirm Payment' : 'Sign'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

