import * as React from 'react'
import { getBankByCardNumber, formatCardNumber, validateIranianCard } from '@/lib/bank-utils'
import { cn } from '@/lib/utils'
import { Copy, Check, CreditCard } from 'lucide-react'
import { toast } from 'sonner'

export interface BankCardBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  cardNumber?: string | null
  bankName?: string | null
  holderName?: string | null
  mono?: boolean
  showCopy?: boolean
  size?: 'sm' | 'default' | 'lg'
}

export function BankCardBadge({
  cardNumber,
  bankName,
  holderName,
  mono = false,
  showCopy = false,
  size = 'default',
  className,
  ...props
}: BankCardBadgeProps) {
  const [copied, setCopied] = React.useState(false)

  if (!cardNumber) {
    return (
      <span className='text-xs text-muted-foreground italic flex items-center gap-1'>
        <CreditCard className='h-3.5 w-3.5 opacity-50' /> بدون کارت
      </span>
    )
  }

  const masked = cardNumber.includes('*')
  const bank = masked ? undefined : getBankByCardNumber(cardNumber)
  const formatted = masked ? cardNumber : formatCardNumber(cardNumber, '-')
  const isValid = masked || validateIranianCard(cardNumber)
  const displayName = holderName || bank?.nameFa || bankName || 'بانک شتاب'
  const monoSrc = bank?.id ? `/banks/mono/${bank.id}.svg` : null

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (masked) return
    const rawDigits = cardNumber.replace(/\D/g, '')
    navigator.clipboard.writeText(rawDigits)
    setCopied(true)
    toast.success(`شماره کارت ${formatted} کپی شد.`)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      dir='ltr'
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border bg-card/60 backdrop-blur-sm font-sans transition-all hover:bg-accent/40 shadow-xs',
        isValid ? 'border-border/80' : 'border-amber-500/40',
        size === 'sm' ? 'px-2 py-1 text-xs' : size === 'lg' ? 'px-3.5 py-2 text-sm' : 'px-2.5 py-1.5 text-xs',
        className
      )}
      {...props}
    >
      {/* Bank SVG Logo (Dynamic Mono with CSS mask or Color) */}
      <div
        className={cn(
          'flex items-center justify-center shrink-0 w-5 h-5 rounded-full p-0.5 border overflow-hidden shadow-2xs transition-colors',
          mono
            ? 'bg-muted/70 border-border/80 text-foreground'
            : 'bg-background/80 border-border/50'
        )}
      >
        {bank ? (
          mono && monoSrc ? (
            <div
              role='img'
              aria-label={bank.nameFa}
              className='w-3.5 h-3.5 bg-foreground transition-colors duration-200 shrink-0'
              style={{
                maskImage: `url(${monoSrc})`,
                WebkitMaskImage: `url(${monoSrc})`,
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center',
              }}
            />
          ) : (
            <img
              src={bank.iconFile}
              alt={bank.nameFa}
              className='w-full h-full object-contain'
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          )
        ) : (
          <CreditCard className='h-3.5 w-3.5 text-muted-foreground' />
        )}
      </div>

      {/* Account Holder Name (or Bank Name) in Persian + Card Number in LTR Monospace */}
      <div className='flex flex-col items-start leading-tight'>
        <span
          dir='rtl'
          style={{ fontFamily: "'Vazirmatn', sans-serif" }}
          className='text-[11px] font-medium text-foreground/90 leading-tight max-w-44 truncate'
        >
          {displayName}
        </span>
        <span className='font-mono text-[12px] font-semibold tracking-wider text-primary/90 select-all'>
          {formatted}
        </span>
      </div>

      {/* Copy Action */}
      {showCopy && !masked && (
        <button
          type='button'
          onClick={copyToClipboard}
          className='ms-auto shrink-0 p-1 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-primary'
          title='کپی شماره کارت'
        >
          {copied ? (
            <Check className='h-3.5 w-3.5 text-emerald-500' />
          ) : (
            <Copy className='h-3.5 w-3.5 opacity-70 hover:opacity-100' />
          )}
        </button>
      )}
    </div>
  )
}
