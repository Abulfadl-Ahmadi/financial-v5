'use client'

import * as React from 'react'
import {
  JALALI_MONTH_NAMES,
  JALALI_WEEK_DAYS,
  getJalaliMonthDays,
  getJalaliFirstDayOfWeek,
  getTodayJalali,
  getCurrentTime,
  parseJalaliString,
  formatJalali,
} from '@/lib/jalali-date'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import { Calendar, Clock, ChevronLeft, ChevronRight, Check, X, Sparkles } from 'lucide-react'

export interface DateTimePickerProps {
  dateValue?: string | null
  onDateChange?: (date: string) => void
  timeValue?: string | null
  onTimeChange?: (time: string) => void
  includeTime?: boolean
  placeholder?: string
  className?: string
  disabled?: boolean
  id?: string
}

export function DateTimePicker({
  dateValue = '',
  onDateChange,
  timeValue = '',
  onTimeChange,
  includeTime = true,
  placeholder = 'انتخاب تاریخ و زمان',
  className,
  disabled = false,
}: DateTimePickerProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)

  const today = React.useMemo(() => getTodayJalali(), [])
  const parsedDate = React.useMemo(() => parseJalaliString(dateValue), [dateValue])

  // View state for the calendar navigator
  const [viewYear, setViewYear] = React.useState<number>(parsedDate?.year || today.year)
  const [viewMonth, setViewMonth] = React.useState<number>(parsedDate?.month || today.month)

  // Internal time state
  const [selectedHour, setSelectedHour] = React.useState<string>(() => {
    if (timeValue && timeValue.includes(':')) return timeValue.split(':')[0].padStart(2, '0')
    return getCurrentTime().split(':')[0]
  })
  const [selectedMinute, setSelectedMinute] = React.useState<string>(() => {
    if (timeValue && timeValue.includes(':')) return timeValue.split(':')[1].padStart(2, '0')
    return getCurrentTime().split(':')[1]
  })

  // Synchronize when dateValue or timeValue changes externally
  React.useEffect(() => {
    if (parsedDate) {
      setViewYear(parsedDate.year)
      setViewMonth(parsedDate.month)
    }
  }, [dateValue])

  React.useEffect(() => {
    if (timeValue && timeValue.includes(':')) {
      const [h, m] = timeValue.split(':')
      setSelectedHour(h.padStart(2, '0'))
      setSelectedMinute(m.padStart(2, '0'))
    }
  }, [timeValue])

  // Navigation handlers
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (viewMonth === 1) {
      setViewMonth(12)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (viewMonth === 12) {
      setViewMonth(1)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const handleSelectDay = (day: number) => {
    const formatted = formatJalali(viewYear, viewMonth, day)
    onDateChange?.(formatted)
    if (includeTime && !timeValue) {
      const curTime = `${selectedHour}:${selectedMinute}`
      onTimeChange?.(curTime)
    }
    if (!includeTime && !isMobile) {
      setOpen(false)
    }
  }

  const handleQuickPreset = (type: 'today' | 'yesterday' | 'weekAgo') => {
    if (type === 'today') {
      onDateChange?.(today.formatted)
      setViewYear(today.year)
      setViewMonth(today.month)
    } else if (type === 'yesterday') {
      let y = today.year
      let m = today.month
      let d = today.day - 1
      if (d < 1) {
        m = m - 1 < 1 ? 12 : m - 1
        if (m === 12) y--
        d = getJalaliMonthDays(y, m)
      }
      const formatted = formatJalali(y, m, d)
      onDateChange?.(formatted)
      setViewYear(y)
      setViewMonth(m)
    }
    if (includeTime) {
      const nowTime = getCurrentTime()
      onTimeChange?.(nowTime)
    }
    if (!includeTime && !isMobile) {
      setOpen(false)
    }
  }

  const handleTimeChange = (h: string, m: string) => {
    setSelectedHour(h)
    setSelectedMinute(m)
    onTimeChange?.(`${h}:${m}`)
  }

  const handleSetCurrentTime = () => {
    const [h, m] = getCurrentTime().split(':')
    handleTimeChange(h, m)
  }

  // Days calculations
  const totalDays = getJalaliMonthDays(viewYear, viewMonth)
  const firstDayOfWeek = getJalaliFirstDayOfWeek(viewYear, viewMonth) // 0 for Saturday .. 6 for Friday

  // Year options for quick select (1390..1415)
  const yearOptions = Array.from({ length: 26 }, (_, i) => 1390 + i)

  // Trigger Button
  const TriggerButton = (
    <button
      type='button'
      disabled={disabled}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs transition-colors',
        'hover:bg-accent/40 focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        !dateValue && 'text-muted-foreground',
        className
      )}
    >
      <div className='flex items-center gap-2 truncate'>
        <Calendar className='h-4 w-4 text-primary shrink-0' />
        {dateValue ? (
          <span className='font-mono font-medium tracking-wide'>
            {dateValue}
            {includeTime && timeValue ? ` - ${timeValue}` : ''}
          </span>
        ) : (
          <span className='text-muted-foreground text-xs'>{placeholder}</span>
        )}
      </div>

      <div className='flex items-center gap-1.5 ms-2'>
        {includeTime && (
          <Clock className='h-3.5 w-3.5 text-muted-foreground/60 shrink-0' />
        )}
      </div>
    </button>
  )

  // Shared Calendar & Time Picker Content
  const CalendarBody = (
    <div className='flex flex-col select-none' dir='rtl' style={{ fontFamily: "'Vazirmatn', sans-serif" }}>
      {/* Header: Month & Year Navigator */}
      <div className='flex items-center justify-between gap-1 pb-2 border-b border-border/70 mb-2'>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='h-8 w-8 rounded-lg'
          onClick={handleNextMonth}
          title='ماه بعد'
        >
          <ChevronRight className='h-4 w-4' />
        </Button>

        <div className='flex items-center gap-1.5'>
          {/* Month Select */}
          <select
            value={viewMonth}
            onChange={(e) => setViewMonth(Number(e.target.value))}
            className='h-8 rounded-md bg-muted/70 px-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer'
          >
            {JALALI_MONTH_NAMES.map((name, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>

          {/* Year Select */}
          <select
            value={viewYear}
            onChange={(e) => setViewYear(Number(e.target.value))}
            className='h-8 rounded-md bg-muted/70 px-2 font-mono text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer'
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='h-8 w-8 rounded-lg'
          onClick={handlePrevMonth}
          title='ماه قبل'
        >
          <ChevronLeft className='h-4 w-4' />
        </Button>
      </div>

      {/* Quick Presets */}
      <div className='flex items-center gap-2 mb-2 pb-2 border-b border-border/50'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='h-7 text-xs px-2.5 rounded-md bg-muted/40 hover:bg-primary/10 hover:text-primary'
          onClick={() => handleQuickPreset('today')}
        >
          <Sparkles className='h-3 w-3 ms-1 text-primary' /> امروز
        </Button>
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='h-7 text-xs px-2.5 rounded-md bg-muted/40 hover:bg-muted/80'
          onClick={() => handleQuickPreset('yesterday')}
        >
          دیروز
        </Button>
      </div>

      {/* Week Day Labels (Sat..Fri) */}
      <div className='grid grid-cols-7 gap-1 text-center mb-1'>
        {JALALI_WEEK_DAYS.map((wd, i) => (
          <span
            key={i}
            className={cn(
              'text-xs font-medium py-0.5 text-muted-foreground',
              i === 6 && 'text-rose-500 font-semibold'
            )}
          >
            {wd.short}
          </span>
        ))}
      </div>

      {/* Calendar Day Matrix */}
      <div className='grid grid-cols-7 gap-1 text-center'>
        {/* Empty cells before month start */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className='h-8 w-8 mx-auto' />
        ))}

        {/* Days of month */}
        {Array.from({ length: totalDays }).map((_, i) => {
          const dayNum = i + 1
          const isSelected =
            parsedDate?.year === viewYear &&
            parsedDate?.month === viewMonth &&
            parsedDate?.day === dayNum
          const isCurrentToday =
            today.year === viewYear && today.month === viewMonth && today.day === dayNum
          const isFriday = (firstDayOfWeek + i) % 7 === 6

          return (
            <button
              key={dayNum}
              type='button'
              onClick={() => handleSelectDay(dayNum)}
              className={cn(
                'h-8 w-8 mx-auto rounded-lg text-xs font-mono font-medium transition-all flex items-center justify-center',
                'hover:bg-primary/15 hover:text-primary focus:outline-none focus:ring-1 focus:ring-primary active:scale-95',
                isFriday && !isSelected && 'text-rose-500',
                isCurrentToday && !isSelected && 'border border-primary/50 text-primary font-bold bg-primary/5',
                isSelected && 'bg-primary text-primary-foreground font-bold shadow-xs hover:bg-primary hover:text-primary-foreground'
              )}
            >
              {dayNum}
            </button>
          )
        })}
      </div>

      {/* Time Picker Section */}
      {includeTime && (
        <div className='mt-3 pt-2.5 border-t border-border/70'>
          <div className='flex items-center justify-between mb-1.5'>
            <span className='text-xs font-medium text-muted-foreground flex items-center gap-1'>
              <Clock className='h-3.5 w-3.5 text-primary' /> زمان (ساعت : دقیقه)
            </span>
            <button
              type='button'
              onClick={handleSetCurrentTime}
              className='text-xs text-primary hover:underline font-medium'
            >
              زمان کنونی (الان)
            </button>
          </div>

          <div className='flex items-center justify-center gap-2' dir='ltr'>
            {/* Hour */}
            <select
              value={selectedHour}
              onChange={(e) => handleTimeChange(e.target.value, selectedMinute)}
              className='h-8 rounded-md bg-muted/70 px-3 font-mono text-sm font-bold text-center focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer'
            >
              {Array.from({ length: 24 }).map((_, i) => {
                const h = String(i).padStart(2, '0')
                return (
                  <option key={h} value={h}>
                    {h}
                  </option>
                )
              })}
            </select>

            <span className='font-bold font-mono text-muted-foreground'>:</span>

            {/* Minute */}
            <select
              value={selectedMinute}
              onChange={(e) => handleTimeChange(selectedHour, e.target.value)}
              className='h-8 rounded-md bg-muted/70 px-3 font-mono text-sm font-bold text-center focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer'
            >
              {Array.from({ length: 60 }).map((_, i) => {
                const m = String(i).padStart(2, '0')
                return (
                  <option key={m} value={m}>
                    {m}
                  </option>
                )
              })}
            </select>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className='mt-3.5 pt-2 border-t border-border/50 flex items-center justify-between'>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='h-8 text-xs text-muted-foreground hover:text-foreground px-2.5'
          onClick={() => {
            onDateChange?.('')
            onTimeChange?.('')
            setOpen(false)
          }}
        >
          <X className='h-3.5 w-3.5 ms-1' /> پاک کردن
        </Button>

        <Button
          type='button'
          size='sm'
          className='h-8 text-xs px-4'
          onClick={() => setOpen(false)}
        >
          <Check className='h-3.5 w-3.5 ms-1' /> تایید
        </Button>
      </div>
    </div>
  )

  // Mobile: Render as Bottom Drawer / Sheet
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{TriggerButton}</SheetTrigger>
        <SheetContent
          side='bottom'
          dir='rtl'
          className='rounded-t-2xl px-4 pb-6 pt-3 max-h-[85vh] overflow-y-auto border-t shadow-2xl'
        >
          {/* Drag Handle Indicator */}
          <div className='w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-3' />
          <SheetHeader className='text-right pb-2'>
            <SheetTitle className='text-sm font-semibold flex items-center gap-1.5'>
              <Calendar className='h-4 w-4 text-primary' /> {placeholder}
            </SheetTitle>
          </SheetHeader>
          <div className='mt-2 max-w-sm mx-auto w-full'>{CalendarBody}</div>
        </SheetContent>
      </Sheet>
    )
  }

  // Desktop: Render as Popover
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{TriggerButton}</PopoverTrigger>
      <PopoverContent
        align='start'
        dir='rtl'
        className='w-[330px] p-3 text-right bg-popover text-popover-foreground border-border shadow-xl rounded-xl z-50'
      >
        {CalendarBody}
      </PopoverContent>
    </Popover>
  )
}
