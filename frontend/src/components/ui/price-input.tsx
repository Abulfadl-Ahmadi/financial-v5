'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { TomanIcon } from './toman-icon'

export interface PriceInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: number | string | null
  onChange?: (value: number) => void
  onValueChange?: (value: number) => void
  showCurrency?: boolean
  currencyText?: string
}

function normalizeDigits(text: string): string {
  if (!text) return ''
  return text
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
}

function formatWithCommas(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return ''
  const num = typeof val === 'string' ? Number(normalizeDigits(val).replace(/\D/g, '')) : val
  if (isNaN(num) || num === 0) return ''
  return num.toLocaleString('en-US')
}

export const PriceInput = React.forwardRef<HTMLInputElement, PriceInputProps>(
  (
    {
      value,
      onChange,
      onValueChange,
      showCurrency = true,
      className,
      placeholder = '0',
      disabled,
      ...props
    },
    ref
  ) => {
    const [displayVal, setDisplayVal] = React.useState<string>(
      value ? formatWithCommas(value) : ''
    )

    React.useEffect(() => {
      if (value === 0 || value === '0' || !value) {
        setDisplayVal('')
      } else {
        setDisplayVal(formatWithCommas(value))
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target
      const cursor = input.selectionStart ?? input.value.length
      const cleanDigits = normalizeDigits(input.value).replace(/\D/g, '')

      if (!cleanDigits) {
        setDisplayVal('')
        onChange?.(0)
        onValueChange?.(0)
        return
      }

      const num = Number(cleanDigits)
      const formatted = num.toLocaleString('en-US')

      // Calculate cursor shift after formatting with commas
      const digitsBeforeCursor = (normalizeDigits(input.value.slice(0, cursor)).match(/\d/g) || []).length
      setDisplayVal(formatted)
      onChange?.(num)
      onValueChange?.(num)

      // Restore cursor position
      requestAnimationFrame(() => {
        let seenDigits = 0
        let newPos = formatted.length
        for (let i = 0; i < formatted.length; i++) {
          if (/\d/.test(formatted[i])) {
            seenDigits++
            if (seenDigits === digitsBeforeCursor) {
              newPos = i + 1
              break
            }
          }
        }
        input.setSelectionRange(newPos, newPos)
      })
    }

    return (
      <div className='relative flex items-center w-full'>
        <input
          ref={ref}
          type='text'
          inputMode='numeric'
          dir='ltr'
          value={displayVal}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background ps-3 pe-12 py-2 font-mono text-sm font-semibold tracking-wider text-foreground shadow-xs transition-colors',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/60',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        />

        {showCurrency && (
          <div className='absolute end-2.5 flex items-center gap-1 pointer-events-none text-muted-foreground select-none'>
            <TomanIcon className='size-3.5 opacity-80' />
          </div>
        )}
      </div>
    )
  }
)

PriceInput.displayName = 'PriceInput'
