import { useState, useRef, useEffect } from 'react'
import {
  Sparkles,
  Send,
  Loader2,
  Mic,
  MicOff,
  Image as ImageIcon,
  Bot,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { ReceiptDraftCard } from './receipt-draft-card'
import { ExpenseDraftCard } from './expense-draft-card'
import { type ChatMessage } from '../types'

interface AssistantDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const QUICK_CHIPS = [
  { label: '📊 گزارش سود و زیان کارگاه', prompt: 'گزارش سود و زیان و هزینه‌های این ماه کارگاه را به من بگو' },
  { label: '⚡ ثبت قبض برق کارگاه', prompt: 'قبض برق کارگاه به مبلغ 850,000 تومان پرداخت شد' },
  { label: '🧵 واریز دستمزد خیاط', prompt: 'واریز دستمزد خیاط زهرا مرادی به مبلغ 2,500,000 تومان پیگیری 778899' },
  { label: '🔥 قبض گاز دیگ بخار', prompt: 'قبض گاز مصرفی دیگ بخار 420,000 تومان' },
]

export function AssistantDrawer({ open, onOpenChange }: AssistantDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'سلام! من دستیار هوشمند مالی کارگاه خیاطی شما هستم. می‌توانید متن پیامک بانکی را اینجا پیست کنید، دستور ثبت قبض صادر کنید، یا گزارش سود و هزینه‌ها را بخواهید.',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (open) {
      setTimeout(scrollToBottom, 100)
    }
  }, [open, messages])

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim()
    if (!textToSend || loading) return

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await apiClient.post('/ai/chat', {
        message: textToSend,
        session_id: sessionId,
      })

      setSessionId(res.data.session_id)

      const assistantMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: res.data.reply,
        activeDraft: res.data.active_draft,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'system',
        content: err.response?.data?.detail || 'متأسفانه در برقراری ارتباط با دستیار خطایی رخ داد.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error('مرورگر شما از ورودی صوتی پشتیبانی نمی‌کند.')
      return
    }

    if (isRecording) {
      setIsRecording(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = 'fa-IR'
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onstart = () => {
        setIsRecording(true)
        toast.info('میکروفون فعال شد. لطفاً پیام خود را به فارسی بفرمایید...')
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript))
      }

      recognition.onerror = () => {
        setIsRecording(false)
        toast.error('خطا در دریافت صدا.')
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognition.start()
    } catch {
      setIsRecording(false)
      toast.error('عدم دسترسی به میکروفون.')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      toast.info(`تصویر «${file.name}» دریافت شد. در حال خواندن مشخصات فیش با بینایی ماشین...`)
      handleSend(`تصویر فیش واریزی پیوست شد: ${file.name}. لطفاً مبلغ و شماره پیگیری را استخراج بفرمایید.`)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='right'
        className='w-full sm:max-w-md p-0 flex flex-col gap-0 border-s border-border'
        dir='rtl'
      >
        <SheetHeader className='p-4 border-b border-border text-start flex flex-row items-center justify-between space-y-0'>
          <div>
            <SheetTitle className='text-sm font-bold flex items-center gap-2'>
              <Sparkles className='h-4 w-4 text-primary animate-pulse' />
              دستیار هوشمند مالی کارگاه خیاطی
            </SheetTitle>
            <SheetDescription className='text-[11px] mt-0.5 text-muted-foreground'>
              تحلیل پیامک بانک، پیش‌نویس با تایید انسانی (HITL)، و پاسخ به سوالات مالی
            </SheetDescription>
          </div>
        </SheetHeader>

        {/* Message Thread Scroll Area */}
        <ScrollArea className='flex-1 p-4'>
          <div className='space-y-4'>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-start flex-row-reverse' : 'justify-start'}`}
              >
                <div
                  className={`size-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : m.role === 'system'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-muted text-foreground'
                  }`}
                >
                  {m.role === 'user' ? <User className='size-3.5' /> : <Bot className='size-3.5' />}
                </div>

                <div className='max-w-[85%] space-y-2'>
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-xs'
                        : m.role === 'system'
                          ? 'bg-destructive/10 text-destructive border border-destructive/20 rounded-bl-xs'
                          : 'bg-muted/80 text-foreground border border-border/40 rounded-bl-xs'
                    }`}
                  >
                    <p className='whitespace-pre-wrap'>{m.content}</p>
                  </div>

                  {/* Render Generative Draft Cards */}
                  {m.activeDraft && m.activeDraft.action_type === 'CREATE_RECEIPT' && (
                    <ReceiptDraftCard draft={m.activeDraft} />
                  )}

                  {m.activeDraft && m.activeDraft.action_type === 'CREATE_EXPENSE' && (
                    <ExpenseDraftCard draft={m.activeDraft} />
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className='flex gap-2.5 items-center text-xs text-muted-foreground'>
                <div className='size-7 rounded-full bg-muted flex items-center justify-center'>
                  <Bot className='size-3.5 animate-spin' />
                </div>
                <span>دستیار در حال تفکر و پردازش ابزار...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Quick Action Chips */}
        <div className='px-3 py-2 border-t border-border/40 bg-muted/10'>
          <div className='flex gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none'>
            {QUICK_CHIPS.map((chip) => (
              <Button
                key={chip.label}
                variant='outline'
                size='sm'
                onClick={() => handleSend(chip.prompt)}
                disabled={loading}
                className='h-6 text-[10px] px-2 rounded-full whitespace-nowrap bg-background hover:bg-primary/10 hover:text-primary'
              >
                {chip.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className='p-3 border-t border-border bg-background'>
          <div className='flex flex-col gap-2'>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder='متن پیامک بانک را پیست کنید یا بنویسید (مثلاً: قبض برق کارگاه ۸۵۰ هزار تومان پرداخت شد)...'
              className='min-h-[70px] max-h-[140px] text-xs resize-none'
              dir='rtl'
            />

            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-1'>
                <Button
                  type='button'
                  variant={isRecording ? 'destructive' : 'ghost'}
                  size='icon'
                  onClick={handleVoiceInput}
                  className='size-7'
                  title='ورودی صوتی فارسی'
                >
                  {isRecording ? <MicOff className='size-3.5 animate-pulse' /> : <Mic className='size-3.5' />}
                </Button>

                <label className='cursor-pointer'>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={handleImageUpload}
                    className='hidden'
                  />
                  <div className='size-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground'>
                    <ImageIcon className='size-3.5' />
                  </div>
                </label>
              </div>

              <Button
                size='sm'
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className='h-7 text-xs gap-1.5 px-3'
              >
                {loading ? <Loader2 className='size-3 animate-spin' /> : <Send className='size-3' />}
                ارسال
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
