import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CapacityMetrics } from './types';

interface GrowthSimulatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  baseCapacity: CapacityMetrics;
}

export function GrowthSimulatorModal({ open, onOpenChange, baseCapacity }: GrowthSimulatorModalProps) {
  const [newTailors, setNewTailors] = useState<number>(0);

  const maxNewTailors = baseCapacity.totalMachines - baseCapacity.activeMachines;
  
  // Base constants for simulation
  const PIECES_PER_TAILOR_MONTH = 1500;
  const REVENUE_PER_PIECE = 50000; // Tomans
  const PAYROLL_PER_TAILOR_MONTH = 25000000; // Tomans
  const ADDITIONAL_OVERHEAD_PER_TAILOR = 2000000; // Tomans

  const basePieces = baseCapacity.activeMachines * PIECES_PER_TAILOR_MONTH;
  const additionalPieces = newTailors * PIECES_PER_TAILOR_MONTH;
  
  const percentageIncrease = basePieces > 0 ? (additionalPieces / basePieces) * 100 : 0;
  
  const additionalGrossRevenue = additionalPieces * REVENUE_PER_PIECE;
  const additionalPayroll = newTailors * PAYROLL_PER_TAILOR_MONTH;
  const additionalOverhead = newTailors * ADDITIONAL_OVERHEAD_PER_TAILOR;
  const projectedNetRevenue = additionalGrossRevenue - (additionalPayroll + additionalOverhead);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl">شبیه‌ساز رشد یک‌ساله</DialogTitle>
          <DialogDescription>
            تأثیر افزودن خیاطان جدید به ظرفیت خالی کارگاه را بررسی کنید.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-8">
          {/* Slider Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">تعداد خیاط جدید</label>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {newTailors} نفر
              </Badge>
            </div>
            
            <input 
              type="range" 
              min={0} 
              max={maxNewTailors} 
              step={1}
              value={newTailors}
              onChange={(e) => setNewTailors(parseInt(e.target.value))}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
            
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>0</span>
              <span>ظرفیت کامل ({maxNewTailors})</span>
            </div>
          </div>

          {/* Results Section */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">افزایش تولید ماهانه</div>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <span>+{percentageIncrease.toFixed(0)}%</span>
                  {newTailors > 0 && (
                    <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                      +{additionalPieces.toLocaleString()} تکه
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">سود خالص پیش‌بینی شده</div>
                <div className={`text-2xl font-bold ${projectedNetRevenue > 0 ? 'text-green-600' : 'text-foreground'}`}>
                  {projectedNetRevenue > 0 ? '+' : ''}{(projectedNetRevenue / 1000000).toLocaleString()} <span className="text-sm font-normal">میلیون تومان</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Breakdown */}
          {newTailors > 0 && (
            <div className="space-y-2 text-sm border-t pt-4">
              <div className="flex justify-between text-muted-foreground">
                <span>درآمد ناخالص اضافی:</span>
                <span>{(additionalGrossRevenue / 1000000).toLocaleString()} میلیون</span>
              </div>
              <div className="flex justify-between text-red-500">
                <span>هزینه دستمزد اضافی:</span>
                <span>-{(additionalPayroll / 1000000).toLocaleString()} میلیون</span>
              </div>
              <div className="flex justify-between text-red-500">
                <span>هزینه سربار اضافی:</span>
                <span>-{(additionalOverhead / 1000000).toLocaleString()} میلیون</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
