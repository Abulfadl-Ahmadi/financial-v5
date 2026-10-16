import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Wrench, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'

interface MachineAsset {
  code: string
  name: string
  category: 'LOCKSTITCH' | 'SERGER' | 'BUTTONHOLE' | 'STEAM_IRON' | 'STEAM_BOILER'
  operator: string
  status: 'ACTIVE' | 'STANDBY' | 'MAINTENANCE_DUE'
  lastServiceDate: string
  nextServiceDate: string
}

const mockFleet: MachineAsset[] = [
  { code: 'SEW-001', name: 'Jack A4 Lockstitch #1', category: 'LOCKSTITCH', operator: 'Maryam Rezaei (Sewer 1)', status: 'ACTIVE', lastServiceDate: '1405/05/10', nextServiceDate: '1405/06/10' },
  { code: 'SEW-002', name: 'Jack A4 Lockstitch #2', category: 'LOCKSTITCH', operator: 'Fatemeh Hosseini (Sewer 2)', status: 'ACTIVE', lastServiceDate: '1405/05/12', nextServiceDate: '1405/06/12' },
  { code: 'SEW-003', name: 'Jack A4 Lockstitch #3', category: 'LOCKSTITCH', operator: 'Zahra Moradi (Sewer 3)', status: 'ACTIVE', lastServiceDate: '1405/05/15', nextServiceDate: '1405/06/15' },
  { code: 'SEW-004', name: 'Jack A4 Lockstitch #4', category: 'LOCKSTITCH', operator: 'Narges Mohammadi (Sewer 4)', status: 'ACTIVE', lastServiceDate: '1405/05/18', nextServiceDate: '1405/06/18' },
  { code: 'SEW-005', name: 'Jack F4 Lockstitch #5', category: 'LOCKSTITCH', operator: 'Somayeh Karimi (Sewer 5)', status: 'ACTIVE', lastServiceDate: '1405/05/20', nextServiceDate: '1405/06/20' },
  { code: 'SEW-006', name: 'Jack F4 Lockstitch #6', category: 'LOCKSTITCH', operator: 'Zeinab Rostami (Sewer 6)', status: 'ACTIVE', lastServiceDate: '1405/05/22', nextServiceDate: '1405/06/22' },
  { code: 'SEW-007', name: 'Jack F4 Lockstitch #7', category: 'LOCKSTITCH', operator: 'Unassigned (Reserve)', status: 'STANDBY', lastServiceDate: '1405/04/01', nextServiceDate: '1405/07/01' },
  { code: 'SEW-008', name: 'Jack F4 Lockstitch #8', category: 'LOCKSTITCH', operator: 'Unassigned (Reserve)', status: 'STANDBY', lastServiceDate: '1405/04/01', nextServiceDate: '1405/07/01' },
  { code: 'SEW-009', name: 'Brother Lockstitch #9', category: 'LOCKSTITCH', operator: 'Unassigned (Reserve)', status: 'STANDBY', lastServiceDate: '1405/04/01', nextServiceDate: '1405/07/01' },
  { code: 'SEW-010', name: 'Brother Lockstitch #10', category: 'LOCKSTITCH', operator: 'Unassigned (Reserve)', status: 'STANDBY', lastServiceDate: '1405/04/01', nextServiceDate: '1405/07/01' },
  { code: 'SRG-001', name: 'Siruba 4-Thread Serger #1', category: 'SERGER', operator: 'Rotating Sewer', status: 'ACTIVE', lastServiceDate: '1405/05/05', nextServiceDate: '1405/06/05' },
  { code: 'SRG-002', name: 'Siruba 5-Thread Serger #2', category: 'SERGER', operator: 'Rotating Sewer', status: 'ACTIVE', lastServiceDate: '1405/05/08', nextServiceDate: '1405/06/08' },
  { code: 'JAN-001', name: 'Janome Buttonhole & Button Machine', category: 'BUTTONHOLE', operator: 'Finishing Specialist', status: 'ACTIVE', lastServiceDate: '1405/05/14', nextServiceDate: '1405/06/14' },
  { code: 'IRN-001', name: 'Silter Industrial Steam Iron #1', category: 'STEAM_IRON', operator: 'Ali Kazemi (Master Ironer)', status: 'ACTIVE', lastServiceDate: '1405/05/25', nextServiceDate: '1405/06/25' },
  { code: 'IRN-002', name: 'Silter Industrial Steam Iron #2', category: 'STEAM_IRON', operator: 'Ali Kazemi (Master Ironer)', status: 'ACTIVE', lastServiceDate: '1405/05/25', nextServiceDate: '1405/06/25' },
  { code: 'IRN-003', name: 'Silter Industrial Steam Iron #3', category: 'STEAM_IRON', operator: 'Ali Kazemi (Master Ironer)', status: 'ACTIVE', lastServiceDate: '1405/05/25', nextServiceDate: '1405/06/25' },
  { code: 'BLR-001', name: 'Central Industrial Steam Boiler', category: 'STEAM_BOILER', operator: 'Central Boiler Operator', status: 'MAINTENANCE_DUE', lastServiceDate: '1405/04/15', nextServiceDate: '1405/06/01' },
]

export function MachineryFleetStatus() {
  const activeCount = mockFleet.filter(m => m.status === 'ACTIVE').length
  const standbyCount = mockFleet.filter(m => m.status === 'STANDBY').length
  const maintenanceDueCount = mockFleet.filter(m => m.status === 'MAINTENANCE_DUE').length

  const getStatusBadge = (status: MachineAsset['status']) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge variant='outline' className='text-emerald-600 border-emerald-500/40 bg-emerald-500/10 gap-1'>
            <CheckCircle2 className='h-3 w-3' /> Active
          </Badge>
        )
      case 'STANDBY':
        return (
          <Badge variant='secondary' className='gap-1 text-muted-foreground'>
            <Clock className='h-3 w-3' /> Reserve
          </Badge>
        )
      case 'MAINTENANCE_DUE':
        return (
          <Badge variant='outline' className='text-red-600 border-red-500/40 bg-red-500/10 gap-1 animate-pulse'>
            <AlertTriangle className='h-3 w-3' /> Service Due
          </Badge>
        )
    }
  }

  return (
    <Card className='border-border/60'>
      <CardHeader>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              <Wrench className='h-5 w-5 text-primary' />
              Workshop Machinery Fleet (17 Assets)
            </CardTitle>
            <CardDescription>
              10 Lockstitch, 2 Sergers, 1 Janome Buttonhole, 3 Steam Irons & Central Steam Boiler
            </CardDescription>
          </div>
          <div className='flex items-center gap-2'>
            <Badge variant='outline' className='text-emerald-600 bg-emerald-500/10'>
              {activeCount} Active
            </Badge>
            <Badge variant='secondary'>
              {standbyCount} Reserve
            </Badge>
            {maintenanceDueCount > 0 && (
              <Badge variant='destructive' className='animate-pulse'>
                {maintenanceDueCount} Maintenance Alert
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='rounded-md border border-border/60 overflow-hidden max-h-[380px] overflow-y-auto'>
          <Table>
            <TableHeader className='sticky top-0 bg-muted/90 backdrop-blur z-10'>
              <TableRow>
                <TableHead className='font-semibold'>Asset Code</TableHead>
                <TableHead className='font-semibold'>Machine Model</TableHead>
                <TableHead className='font-semibold'>Assigned Operator</TableHead>
                <TableHead className='font-semibold text-center'>Status</TableHead>
                <TableHead className='font-semibold text-right'>Next Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockFleet.map((machine) => (
                <TableRow key={machine.code} className='hover:bg-muted/30'>
                  <TableCell className='font-mono font-semibold text-xs'>
                    {machine.code}
                  </TableCell>
                  <TableCell className='font-medium text-xs'>
                    {machine.name}
                  </TableCell>
                  <TableCell className='text-xs text-muted-foreground'>
                    {machine.operator}
                  </TableCell>
                  <TableCell className='text-center'>
                    {getStatusBadge(machine.status)}
                  </TableCell>
                  <TableCell className={`text-right font-mono text-xs ${machine.status === 'MAINTENANCE_DUE' ? 'font-bold text-red-600' : 'text-muted-foreground'}`}>
                    {machine.nextServiceDate}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
