
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { HoursRegistrationForm } from './HoursRegistrationForm';

interface DayData {
  date: Date;
  totalHours: number;
  distributedHours: number;
  hasRecords: boolean;
}

export const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const { user } = useAuth();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Calculate the days to show (including prev/next month days for complete weeks)
  const startDate = new Date(monthStart);
  const startDay = getDay(monthStart);
  startDate.setDate(startDate.getDate() - startDay);

  const endDate = new Date(monthEnd);
  const endDay = getDay(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - endDay));

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  // Fetch calendar data
  const { data: calendarData = [] } = useQuery({
    queryKey: ['calendar-data', format(monthStart, 'yyyy-MM'), user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const startStr = format(startDate, 'yyyy-MM-dd');
      const endStr = format(endDate, 'yyyy-MM-dd');

      // Fetch horasponto data
      const { data: horaspontoData, error: horaspontoError } = await supabase
        .from('horasponto')
        .select('date, total_hours')
        .eq('user_id', user.id)
        .gte('date', startStr)
        .lte('date', endStr);

      if (horaspontoError) throw horaspontoError;

      // Fetch records data
      const { data: recordsData, error: recordsError } = await supabase
        .from('records')
        .select('date, worked_hours')
        .eq('user_id', user.id)
        .gte('date', startStr)
        .lte('date', endStr);

      if (recordsError) throw recordsError;

      // Combine data by date
      const dataByDate: { [key: string]: DayData } = {};

      calendarDays.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        dataByDate[dateStr] = {
          date: day,
          totalHours: 0,
          distributedHours: 0,
          hasRecords: false,
        };
      });

      horaspontoData?.forEach(hp => {
        if (dataByDate[hp.date]) {
          dataByDate[hp.date].totalHours = hp.total_hours;
          dataByDate[hp.date].hasRecords = true;
        }
      });

      recordsData?.forEach(record => {
        if (dataByDate[record.date]) {
          dataByDate[record.date].distributedHours += record.worked_hours;
        }
      });

      return Object.values(dataByDate);
    },
    enabled: !!user?.id,
  });

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDayData = (date: Date): DayData | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return calendarData.find(d => format(d.date, 'yyyy-MM-dd') === dateStr);
  };

  const getDayStatus = (date: Date) => {
    const dayData = getDayData(date);

    if (!dayData || !dayData.hasRecords) {
      return 'none'; // Gray
    }

    if (dayData.totalHours === dayData.distributedHours && dayData.totalHours > 0) {
      return 'complete'; // Blue - horas completas e distribuídas
    }

    if (dayData.distributedHours > 0 || dayData.totalHours > 0) {
      return 'partial'; // Red - parcial ou pendente
    }

    return 'none';
  };

  const getDayColorClass = (date: Date) => {
    const status = getDayStatus(date);
    const isCurrentMonth = isSameMonth(date, currentDate);
    const isCurrentDay = isToday(date);

    let baseClass = "relative w-full h-12 p-2 rounded-lg transition-all duration-200 hover:scale-105 cursor-pointer ";

    if (!isCurrentMonth) {
      baseClass += "text-gray-500 bg-slate-800/30 ";
    } else {
      switch (status) {
        case 'complete':
          baseClass += "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg ";
          break;
        case 'partial':
          baseClass += "bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg ";
          break;
        default:
          baseClass += "bg-slate-700 text-gray-300 hover:bg-slate-600 ";
      }
    }

    if (isCurrentDay) {
      baseClass += "ring-2 ring-blue-400 ";
    }

    return baseClass;
  };

  const handleDayClick = (date: Date) => {
    if (isSameMonth(date, currentDate)) {
      setSelectedDate(date);
      setIsFormVisible(true);
    }
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="flex space-x-6">
      {/* Calendar */}
      <div className="flex-1 space-y-6">
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-white">
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                >
                  Hoje
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-4 max-w-2xl mx-auto">
              {/* Week day headers */}
              {weekDays.map((day) => (
                <div key={day} className="text-center font-medium text-gray-400 py-2">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {calendarDays.map((date) => {
                const dayData = getDayData(date);
                return (
                  <div
                    key={date.toISOString()}
                    className={getDayColorClass(date)}
                    onClick={() => handleDayClick(date)}
                  >
                    <div className="text-sm font-medium">
                      {format(date, 'd')}
                    </div>
                    {dayData?.hasRecords && (
                      <div className="absolute bottom-1 right-1">
                        <div className="w-1.5 h-1.5 bg-white rounded-full opacity-80" />
                      </div>
                    )}
                    {dayData?.totalHours > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 text-xs text-center text-white opacity-75">
                        {dayData.totalHours}h
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded" />
                <span className="text-gray-300">Horas Completas</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gradient-to-br from-red-600 to-red-700 rounded" />
                <span className="text-gray-300">Parcial/Pendente</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-slate-700 rounded" />
                <span className="text-gray-300">Sem Registros</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hours Registration Form */}
      <HoursRegistrationForm
        date={selectedDate}
        isVisible={isFormVisible}
        onClose={() => setIsFormVisible(false)}
      />
    </div>
  );
};
