import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api-client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ContractOrder {
  id: number
  order_code: string
  client_name: string
  apparel_type: string
  total_received_pieces: number
  unit_contractor_price: number
  status: 'RECEIVED' | 'IN_PRODUCTION' | 'DELIVERED' | 'SETTLED'
  received_date_jalali: string
  delivery_date_jalali?: string
  total_revenue?: number
}

export function ActiveContractOrders() {
  const [orders, setOrders] = useState<ContractOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/sewing/contract-orders')
      .then((res) => {
        setOrders(res.data || [])
      })
      .catch(() => {
        setOrders([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])
  const getStatusBadge = (status: ContractOrder['status']) => {
    switch (status) {
      case 'RECEIVED':
        return <Badge variant='outline' className='text-amber-600 border-amber-500/40 bg-amber-500/10'>Received</Badge>
      case 'IN_PRODUCTION':
        return <Badge variant='outline' className='text-blue-600 border-blue-500/40 bg-blue-500/10'>Sewing</Badge>
      case 'DELIVERED':
        return <Badge variant='outline' className='text-emerald-600 border-emerald-500/40 bg-emerald-500/10'>Delivered</Badge>
      case 'SETTLED':
        return <Badge variant='secondary'>Settled</Badge>
      default:
        return <Badge variant='outline'>{status}</Badge>
    }
  }

  return (
    <div className='rounded-md border border-border/60 overflow-hidden'>
      <Table>
        <TableHeader>
          <TableRow className='bg-muted/40'>
            <TableHead className='font-semibold'>Order Code</TableHead>
            <TableHead className='font-semibold'>Contractor Client</TableHead>
            <TableHead className='font-semibold'>Garment Item</TableHead>
            <TableHead className='font-semibold text-center'>Progress</TableHead>
            <TableHead className='font-semibold text-right'>Fee / Unit</TableHead>
            <TableHead className='font-semibold text-center'>Status</TableHead>
            <TableHead className='font-semibold text-right'>Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} className='h-24 text-center text-muted-foreground text-xs'>
                در حال بارگذاری سفارشات فعال...
              </TableCell>
            </TableRow>
          ) : orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className='h-24 text-center text-muted-foreground text-xs'>
                هیچ سفارش فعال دوزندگی ثبت نشده است.
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => {
              const unitPrice = Number(order.unit_contractor_price) || 0
              return (
                <TableRow key={order.id} className='hover:bg-muted/30'>
                  <TableCell className='font-mono font-medium text-xs'>
                    {order.order_code}
                  </TableCell>
                  <TableCell className='font-medium'>
                    {order.client_name}
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    {order.apparel_type}
                  </TableCell>
                  <TableCell className='min-w-[140px]'>
                    <div className='flex flex-col gap-1'>
                      <div className='flex justify-between text-[11px] text-muted-foreground'>
                        <span>{order.total_received_pieces} pcs</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className='text-right font-medium text-xs'>
                    {unitPrice.toLocaleString()} T
                  </TableCell>
                  <TableCell className='text-center'>
                    {getStatusBadge(order.status)}
                  </TableCell>
                  <TableCell className='text-right font-mono text-xs text-muted-foreground'>
                    {order.delivery_date_jalali || order.received_date_jalali}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
