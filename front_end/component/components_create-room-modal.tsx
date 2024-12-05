import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Coins } from 'lucide-react'

interface CreateRoomModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateRoom: (stake: number) => void
}

export default function CreateRoomModal({ isOpen, onClose, onCreateRoom }: CreateRoomModalProps) {
  const [stake, setStake] = useState<number>(0)

  const handleCreateRoom = () => {
    if (stake > 0) {
      onCreateRoom(stake)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-purple-800 flex items-center justify-center">
            <Coins className="mr-2 h-6 w-6 text-purple-600" />
            Create New Room
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stake" className="text-right text-purple-700">
              Stake Amount
            </Label>
            <Input
              id="stake"
              type="number"
              value={stake}
              onChange={(e) => setStake(Number(e.target.value))}
              className="col-span-3 border-purple-300 focus:border-purple-500 focus:ring-purple-500"
              placeholder="Enter stake amount"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
            Cancel
          </Button>
          <Button onClick={handleCreateRoom} disabled={stake <= 0} className="bg-purple-600 hover:bg-purple-700 text-white">
            Create Room
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

