import { Badge } from '@/components/ui/badge'
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
  orderCode: string
  clientName: string
  apparelType: string
  totalPieces: number
  completedPieces: number
  unitPrice: number
  status: 'RECEIVED' | 'IN_PRODUCTION' | 'DELIVERED' | 'SETTLED'
  deliveryDate: string
}

const mockOrders: ContractOrder[] = [
  {
    id: 1,
    orderCode: 'ORD-2026-001',
    clientName: 'Tehran Garments Co.',
    apparelType: 'Women Blouse (شومیز زنانه)',
    totalPieces: 600,
    completedPieces: 450,
    unitPrice: 35000,
    status: 'IN_PRODUCTION',
    deliveryDate: '1405/06/15',
  },
  {
    id: 2,
    orderCode: 'ORD-2026-002',
    clientName: 'Aria Mode Studio',
    apparelType: 'Formal Trousers (شلوار راسته)',
    totalPieces: 400,
    completedPieces: 400,
    unitPrice: 42000,
    status: 'DELIVERED',
    deliveryDate: '1405/06/10',
  },
  {
    id: 3,
    orderCode: 'ORD-2026-003',
    clientName: 'Ziba Poushan Brand',
    apparelType: 'Linen Overcoat (مانتو لنین)',
    totalPieces: 500,
    completedPieces: 210,
    unitPrice: 55000,
    status: 'IN_PRODUCTION',
    deliveryDate: '1405/06/20',
  },
  {
    id: 4,
    orderCode: 'ORD-2026-004',
    clientName: 'Niloufar Boutique',
    apparelType: 'Pleated Skirt (دامن پلیسه)',
    totalPieces: 350,
    completedPieces: 0,
    unitPrice: 28000,
    status: 'RECEIVED',
    deliveryDate: '1405/06/28',
  },
]

export function ActiveContractOrders() {
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
          {mockOrders.map((order) => {
            const progress = Math.round((order.completedPieces / order.totalPieces) * 100)
            return (
              <TableRow key={order.id} className='hover:bg-muted/30'>
                <TableCell className='font-mono font-medium text-xs'>
                  {order.orderCode}
                </TableCell>
                <TableCell className='font-medium'>
                  {order.clientName}
                </TableCell>
                <TableCell className='text-sm text-muted-foreground'>
                  {order.apparelType}
                </TableCell>
                <TableCell className='min-w-[140px]'>
                  <div className='flex flex-col gap-1'>
                    <div className='flex justify-between text-[11px] text-muted-foreground'>
                      <span>{order.completedPieces} / {order.totalPieces} pcs</span>
                      <span className='font-medium'>{progress}%</span>
                    </div>
                    <div className='h-1.5 w-full bg-secondary rounded-full overflow-hidden'>
                      <div
                        className='h-full bg-primary transition-all duration-300'
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell className='text-right font-medium text-xs'>
                  {order.unitPrice.toLocaleString()} T
                </TableCell>
                <TableCell className='text-center'>
                  {getStatusBadge(order.status)}
                </TableCell>
                <TableCell className='text-right font-mono text-xs text-muted-foreground'>
                  {order.deliveryDate}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
