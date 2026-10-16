import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfitabilitySummary, ExpenseCategoryLabels } from './types';
import { financialServices } from './services';

// A mapping for category colors
const CategoryColors: Record<string, string> = {
  RENT: 'bg-blue-500',
  ELECTRICITY: 'bg-yellow-500',
  WATER: 'bg-cyan-500',
  GAS: 'bg-orange-500',
  SUPPLIES: 'bg-purple-500',
  MAINTENANCE: 'bg-red-500',
  WELFARE: 'bg-green-500',
  CLEANING: 'bg-teal-500',
  OTHER: 'bg-gray-500',
};

export function NetProfitDashboard() {
  const [data, setData] = useState<ProfitabilitySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await financialServices.getProfitabilitySummary();
        setData(result);
      } catch (error) {
        console.error('Failed to fetch profitability summary', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-6 text-center rtl" dir="rtl">در حال بارگذاری...</div>;
  }

  if (!data) {
    return <div className="p-6 text-center rtl text-red-500" dir="rtl">خطا در دریافت اطلاعات</div>;
  }

  return (
    <div className="p-6 rtl" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">داشبورد سودآوری کارگاه</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">درآمد کل از پیمانکار 💵</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.totalRevenue.toLocaleString('fa-IR')} <span className="text-sm font-normal">تومان</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">کارمزد خیاط‌ها و اتوکار 🧵</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {data.totalPayroll.toLocaleString('fa-IR')} <span className="text-sm font-normal">تومان</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">هزینه‌های جاری و سربار 🏠</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data.totalOverhead.toLocaleString('fa-IR')} <span className="text-sm font-normal">تومان</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">سود خالص کارگاه 📈</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.netProfit.toLocaleString('fa-IR')} <span className="text-sm font-normal">تومان</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ترکیب هزینه‌های سربار</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-6 w-full flex rounded-full overflow-hidden mb-6">
            {data.overheadBreakdown.map((item, idx) => (
              <div 
                key={idx}
                className={`h-full ${CategoryColors[item.category] || 'bg-gray-500'}`}
                style={{ width: `${item.percentage}%` }}
                title={`${ExpenseCategoryLabels[item.category]}: %${item.percentage}`}
              />
            ))}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.overheadBreakdown.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${CategoryColors[item.category] || 'bg-gray-500'}`} />
                <span className="text-sm">
                  {ExpenseCategoryLabels[item.category]}: %{item.percentage}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
