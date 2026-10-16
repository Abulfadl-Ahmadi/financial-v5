import * as React from 'react'
import {
  getBankByCardNumber,
  formatCardNumber,
  normalizeCardNumber,
  validateIranianCard,
  type IranianBankInfo,
} from '@/lib/bank-utils'
import { cn } from '@/lib/utils'
import { CreditCard, CheckCircle2, AlertCircle } from 'lucide-react'

export interface BankCardInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: string
  onChange?: (value: string) => void
  onBankChange?: (bank: IranianBankInfo | undefined) => void
  separator?: string
  showBadge?: boolean
}

export const BankCardInput = React.forwardRef<HTMLInputElement, BankCardInputProps>(
  (
    {
      value = '',
      onChange,
      onBankChange,
      separator = '-',
      showBadge = true,
      className,
      placeholder = '---- ---- ---- ----',
      disabled,
      ...props
    },
    ref
  ) => {
    const rawDigits = normalizeCardNumber(value)
    const formatted = formatCardNumber(rawDigits, separator)
    const bank = getBankByCardNumber(rawDigits)
    const isValid = validateIranianCard(rawDigits)
    const isComplete = rawDigits.length === 16

    React.useEffect(() => {
      onBankChange?.(bank)
    }, [bank, onBankChange])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputVal = e.target.value
      const clean = normalizeCardNumber(inputVal)
      onChange?.(clean)
    }

    return (
      <div className='space-y-1.5 w-full'>
        <div className='relative flex items-center w-full'>
          {/* Input field */}
          <input
            ref={ref}
            type='text'
            inputMode='numeric'
            dir='ltr'
            value={formatted}
            onChange={handleChange}
            placeholder={placeholder}
            maxLength={19} // 16 digits + 3 separators
            disabled={disabled}
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-background ps-10 pe-11 py-2 font-mono text-sm tracking-widest text-foreground shadow-xs transition-colors',
              'file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/60',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring',
              'disabled:cursor-not-allowed disabled:opacity-50',
              isComplete && (isValid ? 'border-emerald-500/60 focus-visible:ring-emerald-500' : 'border-amber-500/60 focus-visible:ring-amber-500'),
              className
            )}
            {...props}
          />

          {/* Left Icon (Bank SVG Logo / Credit Card fallback) */}
          <div className='absolute start-2.5 flex items-center justify-center pointer-events-none w-6 h-6 rounded-full bg-muted/60 p-0.5 border border-border/40 overflow-hidden shadow-2xs'>
            {bank?.iconFile ? (
              <img
                src={bank.iconFile}
                alt={bank.nameFa}
                className='w-full h-full object-contain transition-all duration-300'
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <CreditCard className='h-3.5 w-3.5 text-muted-foreground' />
            )}
          </div>

          {/* Right Status Indicator (Validation icon) */}
          <div className='absolute end-3 flex items-center pointer-events-none'>
            {isComplete ? (
              isValid ? (
                <CheckCircle2 className='h-4 w-4 text-emerald-500 animate-in fade-in zoom-in-75 duration-200' />
              ) : (
                <AlertCircle className='h-4 w-4 text-amber-500 animate-in fade-in zoom-in-75 duration-200' />
              )
            ) : (
              <span className='text-[10px] font-mono text-muted-foreground/60 font-medium'>
                {rawDigits.length}/16
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Bank Name & Validation Sub-badge */}
        {showBadge && (bank || rawDigits.length >= 6) && (
          <div className='flex items-center justify-between px-1 text-xs transition-all duration-300'>
            <div className='flex items-center gap-1.5' dir='rtl'>
              <span
                style={{ fontFamily: "'Vazirmatn', sans-serif" }}
                className='font-medium text-foreground/90'
              >
                {bank?.nameFa || 'بانک شتاب'}
              </span>
              {bank?.nameEn && (
                <span className='text-[11px] text-muted-foreground font-sans' dir='ltr'>
                  ({bank.nameEn})
                </span>
              )}
            </div>

            {isComplete && (
              <span
                className={cn(
                  'text-[11px] font-medium',
                  isValid ? 'text-emerald-500' : 'text-amber-500'
                )}
                dir='rtl'
              >
                {isValid ? 'شماره کارت معتبر است ✓' : 'الگوریتم کارت نامعتبر است'}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }
)

BankCardInput.displayName = 'BankCardInput'
