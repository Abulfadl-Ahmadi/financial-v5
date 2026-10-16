import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Receipt } from '../data/schema'
import { FileText, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TomanIcon } from '@/components/ui/toman-icon'

type ReceiptImageDialogProps = {
  receipt?: Receipt | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReceiptImageDialog({
  receipt,
  open,
  onOpenChange,
}: ReceiptImageDialogProps) {
  if (!receipt || !receipt.receipt_image) return null

  // Ensure full URL if it's relative path /media/...
  const imageUrl = receipt.receipt_image.startsWith('http')
    ? receipt.receipt_image
    : `${receipt.receipt_image}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md max-h-[90vh] flex flex-col p-4'>
        <DialogHeader className='text-start pb-2 border-b border-border'>
          <DialogTitle className='text-base flex items-center justify-between'>
            <span className='flex items-center gap-2'>
              <FileText className='h-4 w-4 text-primary' /> Receipt Image - #{receipt.tracking_code}
            </span>
            <Button
              variant='ghost'
              size='sm'
              className='h-7 text-xs gap-1'
              asChild
            >
              <a href={imageUrl} target='_blank' rel='noopener noreferrer'>
                <ExternalLink className='h-3 w-3' /> Open Full
              </a>
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className='flex-1 overflow-auto flex items-center justify-center p-2 bg-muted/20 rounded-md mt-2 min-h-64'>
          <img
            src={imageUrl}
            alt={`Receipt ${receipt.tracking_code}`}
            className='max-h-[65vh] w-auto max-w-full rounded-md object-contain border border-border shadow-xs'
            onError={(e) => {
              // If relative URL failed (e.g. without proxy), try absolute backend URL
              if (!receipt.receipt_image?.startsWith('http') && !e.currentTarget.src.includes(':8000')) {
                const cleanPath = receipt.receipt_image?.startsWith('/')
                  ? receipt.receipt_image
                  : `/${receipt.receipt_image}`
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'
                e.currentTarget.src = `${backendUrl}${cleanPath}`
              }
            }}
          />
        </div>
        <div className='flex justify-between items-center text-xs text-muted-foreground pt-2'>
          <span className='flex items-center gap-1'>
            Amount: <b className='text-foreground font-mono font-bold'>{Number(receipt.amount).toLocaleString()}</b>
            <TomanIcon className='size-3 text-muted-foreground' />
          </span>
          <span>Date: {receipt.date_jalali}</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
