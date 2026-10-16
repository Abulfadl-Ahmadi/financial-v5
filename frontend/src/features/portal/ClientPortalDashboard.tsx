import { useState, useEffect } from 'react'
import { ContractOrder } from './types'
import { apiClient } from '@/lib/api-client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ClientPortalDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [orders, setOrders] = useState<ContractOrder[]>([])
  
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      setIsLoggedIn(true)
      fetchOrders()
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await apiClient.post('/users/portal/client/login', { username, password })
      localStorage.setItem('access_token', res.data.access)
      setIsLoggedIn(true)
      setError('')
      fetchOrders()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    setIsLoggedIn(false)
    setOrders([])
  }

  const fetchOrders = async () => {
    try {
      const res = await apiClient.get('/sewing/portal/client/orders')
      setOrders(res.data)
    } catch (err: any) {
      console.error(err)
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout()
      }
    }
  }

  const renderStepper = (status: string) => {
    const steps = [
      { id: 'RECEIVED', label: 'تحویل پارچه' },
      { id: 'IN_PRODUCTION', label: 'دوخت خیاطی' },
      { id: 'BUTTONS', label: 'دکمه و مادگی (جانومه)' }, // Assuming intermediate steps are mapped from status or just visual
      { id: 'IRONING', label: 'خط اتو' },
      { id: 'DELIVERED', label: 'آماده تحویل' }
    ]
    
    // Simplistic mapping for the stepper
    let currentStepIndex = 0
    if (status === 'RECEIVED') currentStepIndex = 0
    else if (status === 'IN_PRODUCTION') currentStepIndex = 1
    else if (status === 'DELIVERED' || status === 'SETTLED') currentStepIndex = 4

    return (
      <div className="flex items-center justify-between w-full mt-4 text-sm">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex flex-col items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${idx <= currentStepIndex ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {idx + 1}
            </div>
            <span className="mt-1 text-xs text-center">{step.label}</span>
          </div>
        ))}
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>ورود پیمانکاران (کارفرمایان)</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input placeholder="نام کاربری" value={username} onChange={e => setUsername(e.target.value)} />
              <Input type="password" placeholder="رمز عبور" value={password} onChange={e => setPassword(e.target.value)} />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button type="submit" className="w-full">ورود</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">پرتال پیمانکاران</h1>
        <Button variant="outline" onClick={handleLogout}>خروج</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>سفارشات شما</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.map(order => (
            <div key={order.id} className="mb-6 p-4 border rounded-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">{order.apparel_type} (کد: {order.order_code})</h3>
                  <p className="text-sm text-gray-500">تاریخ دریافت: {order.received_date_jalali}</p>
                </div>
                <div>
                  <Badge variant={order.status === 'SETTLED' ? 'default' : 'secondary'}>
                    {order.status}
                  </Badge>
                </div>
              </div>

              {renderStepper(order.status)}

              <div className="mt-6 flex justify-between items-center border-t pt-4">
                <div>
                  <span className="text-sm text-gray-500">تعداد کل:</span> {order.total_received_pieces}
                </div>
                <div>
                  <span className="text-sm text-gray-500">مبلغ کل:</span> {order.total_revenue?.toLocaleString()} تومان
                </div>
                <Button variant="outline" size="sm" onClick={() => alert('دانلود فاکتور: در دست ساخت')}>
                  دانلود فاکتور
                </Button>
              </div>
            </div>
          ))}
          {orders.length === 0 && <p className="text-center py-4">سفارشی یافت نشد.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
