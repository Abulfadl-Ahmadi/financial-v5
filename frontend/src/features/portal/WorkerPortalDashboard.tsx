import { useState, useEffect } from 'react'
import { SewingJob } from './types'
import { apiClient } from '@/lib/api-client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'

export default function WorkerPortalDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [jobs, setJobs] = useState<SewingJob[]>([])
  
  useEffect(() => {
    const token = localStorage.getItem('worker_token')
    if (token) {
      setIsLoggedIn(true)
      fetchJobs()
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await apiClient.post('/users/portal/worker/login', { username, password })
      localStorage.setItem('worker_token', res.data.access)
      setIsLoggedIn(true)
      setError('')
      fetchJobs()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('worker_token')
    setIsLoggedIn(false)
    setJobs([])
  }

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('worker_token')
      const res = await apiClient.get('/sewing/portal/worker/jobs', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setJobs(res.data)
    } catch (err: any) {
      console.error(err)
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout()
      }
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>ورود پرسنل (خیاط / اتوکار)</CardTitle>
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
        <h1 className="text-2xl font-bold">پرتال پرسنل</h1>
        <Button variant="outline" onClick={handleLogout}>خروج</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>کارهای ارجاع شده به شما</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">کد کار</TableHead>
                <TableHead className="text-right">تعداد ارجاعی</TableHead>
                <TableHead className="text-right">تکمیل شده</TableHead>
                <TableHead className="text-right">اجرت واحد (تومان)</TableHead>
                <TableHead className="text-right">مبلغ قابل پرداخت (تومان)</TableHead>
                <TableHead className="text-right">وضعیت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>{job.job_code}</TableCell>
                  <TableCell>{job.assigned_pieces}</TableCell>
                  <TableCell className="font-bold text-green-600">{job.completed_pieces}</TableCell>
                  <TableCell>{job.unit_sewing_price.toLocaleString()}</TableCell>
                  <TableCell>{job.total_payable_amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={job.status === 'COMPLETED' ? 'default' : 'secondary'}>
                      {job.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {jobs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">هیچ کاری به شما ارجاع نشده است.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
