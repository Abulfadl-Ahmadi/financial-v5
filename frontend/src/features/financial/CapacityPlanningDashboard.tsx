import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GrowthSimulatorModal } from './GrowthSimulatorModal';
import { CapacityMetrics } from './types';

// Mock data
const initialMetrics: CapacityMetrics = {
  activeMachines: 6,
  totalMachines: 10,
  samProduced: 12000,
  availableMinutes: 14400,
  efficiencyScore: 83.3, // (12000 / 14400) * 100
  averageTurnaroundTimeDays: 4.5,
};

export function CapacityPlanningDashboard() {
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const metrics = initialMetrics;
  const utilizationPercentage = (metrics.activeMachines / metrics.totalMachines) * 100;
  const reservedMachines = metrics.totalMachines - metrics.activeMachines;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">داشبورد برنامه‌ریزی ظرفیت</h2>
        <Button onClick={() => setIsSimulatorOpen(true)}>
          شبیه‌ساز رشد یک‌ساله
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              بهره‌وری چرخ‌های خیاطی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between mb-2">
              <div className="text-2xl font-bold">{metrics.activeMachines} از {metrics.totalMachines}</div>
              <Badge variant="outline">{Math.round(utilizationPercentage)}% ظرفیت فعال</Badge>
            </div>
            {/* Custom Progress Bar */}
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-in-out" 
                style={{ width: `${utilizationPercentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {reservedMachines} چرخ رزرو برای رشد آینده
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              امتیاز کارایی کارگاه (SAM)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.efficiencyScore.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              دقایق تولید شده: {metrics.samProduced.toLocaleString()} / ظرفیت: {metrics.availableMinutes.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              متوسط زمان تحویل هر پارت
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics.averageTurnaroundTimeDays} روز
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              از زمان برش تا تحویل به مشتری
            </p>
          </CardContent>
        </Card>
      </div>

      <GrowthSimulatorModal 
        open={isSimulatorOpen} 
        onOpenChange={setIsSimulatorOpen} 
        baseCapacity={metrics}
      />
    </div>
  );
}
