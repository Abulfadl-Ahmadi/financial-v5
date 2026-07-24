import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useReceipts } from './receipts-provider'

export function ReceiptsPrimaryButtons() {
  const { setOpen } = useReceipts()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>Add Receipt</span> <Plus size={18} />
      </Button>
    </div>
  )
}
