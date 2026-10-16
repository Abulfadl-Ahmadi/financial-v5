import { useState, useEffect } from 'react'
import { Sparkles, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { AssistantDrawer } from './assistant-drawer'

export function FloatingAssistantButton() {
  const [open, setOpen] = useState(false)

  // Listen to keyboard shortcut (Ctrl + J or Cmd + J)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <div className='fixed bottom-5 start-5 z-40' dir='ltr'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setOpen(true)}
              size='icon'
              className='size-12 rounded-full shadow-lg bg-primary text-primary-foreground hover:scale-105 transition-all duration-200 relative group border-2 border-background'
            >
              <Bot className='size-5 group-hover:hidden transition-all' />
              <Sparkles className='size-5 hidden group-hover:block transition-all text-amber-300 animate-pulse' />
              <span className='sr-only'>دستیار هوشمند مالی کارگاه (Ctrl+J)</span>
              <span className='absolute -top-0.5 -right-0.5 size-3 bg-emerald-500 rounded-full border-2 border-background animate-pulse' />
            </Button>
          </TooltipTrigger>
          <TooltipContent side='top' align='start' dir='rtl'>
            <p className='text-xs font-medium'>دستیار هوشمند مالی کارگاه (Ctrl+J)</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <AssistantDrawer open={open} onOpenChange={setOpen} />
    </>
  )
}
