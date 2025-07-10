
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, isToday } from 'date-fns';
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
  records: any[];
}

export const WeekCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [startWithProjectsTab, setStartWithProjectsTab] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data: weekData = [], refetch: refetchWeekData } = useQuery({
    queryKey: ['week-data', format(weekStart, 'yyyy-MM-dd'), user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const startStr = format(weekStart, 'yyyy-MM-dd');
      const endStr = format(weekEnd, 'yyyy-MM-dd');

      const { data: horaspontoData, error: horaspontoError } = await supabase
        .from('horasponto')
        .select('date, total_hours')
        .eq('user_id', user.id)
        .gte('date', startStr)
        .lte('date', endStr);

      if (horaspontoError) throw horaspontoError;

      const { data: recordsData, error: recordsError } = await supabase
        .from('records')
        .select(`
          *,
          projects(name, description)
        `)
        .eq('user_id', user.id)
        .gte('date', startStr)
        .lte('date', endStr);

      if (recordsError) throw recordsError;

      const dataByDate: { [key: string]: DayData } = {};

      weekDays.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        dataByDate[dateStr] = {
          date: day,
          totalHours: 0,
          distributedHours: 0,
          hasRecords: false,
          records: [],
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
          dataByDate[record.date].records.push(record);
        }
      });

      return Object.values(dataByDate);
    },
    enabled: !!user?.id,
  });

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      if (direction === 'prev') {
        return subWeeks(prev, 1);
      } else {
        return addWeeks(prev, 1);
      }
    });
  };

  const getDayData = (date: Date): DayData | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return weekData.find(d => format(d.date, 'yyyy-MM-dd') === dateStr);
  };

  const handleDayClick = (date: Date) => {
    const dayData = getDayData(date);
    setSelectedDate(date);
    
    if (dayData && dayData.totalHours > 0) {
      setStartWithProjectsTab(true);
    } else {
      setStartWithProjectsTab(false);
    }
    
    setIsFormVisible(true);
  };

  const handleFormClose = () => {
    setIsFormVisible(false);
    refetchWeekData();
  };

  const handleProjectAdded = () => {
    refetchWeekData();
  };

  const timeSlots = Array.from({ length: 24 }, (_, i) => i);

  const getRecordForTimeSlot = (date: Date, hour: number) => {
    const dayData = getDayData(date);
    if (!dayData) return null;
    
    return dayData.records.find(record => {
      const recordHour = new Date(`${record.date}T${record.start_time || '09:00'}`).getHours();
      return recordHour === hour;
    });
  };

  const filteredRecords = weekData.flatMap(day => 
    day.records.filter(record => 
      !searchTerm || 
      record.projects?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Sidebar */}
      <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <div className="flex items-center space-x-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('prev')}
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 flex-1"
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('next')}
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar projetos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Today's events */}
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-sm font-medium text-gray-300 mb-2 uppercase tracking-wide">
            Hoje {format(new Date(), 'dd/MM/yyyy')}
          </h3>
          <div className="space-y-2">
            {filteredRecords
              .filter(record => isSameDay(new Date(record.date), new Date()))
              .map((record, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-white">{record.projects?.name || 'Projeto sem nome'}</span>
                  <span className="text-gray-400">{record.worked_hours}h</span>
                </div>
              ))}
          </div>
        </div>

        {/* Upcoming events */}
        <div className="p-4 flex-1 overflow-y-auto">
          <h3 className="text-sm font-medium text-gray-300 mb-2 uppercase tracking-wide">
            Esta Semana
          </h3>
          <div className="space-y-3">
            {weekDays.map(day => {
              const dayData = getDayData(day);
              if (!dayData || dayData.records.length === 0) return null;

              return (
                <div key={day.toISOString()}>
                  <h4 className="text-xs font-medium text-gray-400 mb-1">
                    {format(day, 'EEEE dd/MM', { locale: ptBR }).toUpperCase()}
                  </h4>
                  {dayData.records.map((record, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm mb-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-white text-xs">{record.projects?.name || 'Projeto'}</span>
                      <span className="text-gray-400 text-xs">{record.worked_hours}h</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Calendar */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                className="bg-red-600 hover:bg-red-700 text-white border-red-600"
              >
                Semana
              </Button>
              <Button
                variant="outline"
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                Mês
              </Button>
            </div>
            <div className="text-right">
              <div className="text-lg font-medium text-white">
                {format(weekStart, 'dd MMM', { locale: ptBR })} - {format(weekEnd, 'dd MMM yyyy', { locale: ptBR })}
              </div>
            </div>
          </div>
        </div>

        {/* Week Header */}
        <div className="bg-slate-800 border-b border-slate-700">
          <div className="grid grid-cols-8 gap-px bg-slate-700">
            <div className="bg-slate-800 p-2"></div>
            {weekDays.map(day => (
              <div key={day.toISOString()} className="bg-slate-800 p-2 text-center">
                <div className="text-xs text-gray-400 uppercase">
                  {format(day, 'EEE', { locale: ptBR })}
                </div>
                <div className={cn(
                  "text-lg font-medium mt-1",
                  isToday(day) ? "text-blue-400" : "text-white"
                )}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-8 gap-px bg-slate-700 min-h-full">
            {/* Time column */}
            <div className="bg-slate-800">
              {timeSlots.map(hour => (
                <div key={hour} className="h-16 border-b border-slate-700 p-2 text-right">
                  <span className="text-xs text-gray-400">
                    {hour.toString().padStart(2, '0')}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map(day => (
              <div key={day.toISOString()} className="bg-slate-900 relative">
                {timeSlots.map(hour => {
                  const record = getRecordForTimeSlot(day, hour);
                  return (
                    <div 
                      key={hour} 
                      className="h-16 border-b border-slate-700 p-1 hover:bg-slate-800 cursor-pointer relative"
                      onClick={() => handleDayClick(day)}
                    >
                      {record && (
                        <div className="bg-green-600 text-white text-xs p-1 rounded truncate">
                          {record.projects?.name || 'Projeto'}
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* Day total hours indicator */}
                {(() => {
                  const dayData = getDayData(day);
                  if (dayData && dayData.totalHours > 0) {
                    return (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        {dayData.totalHours}h
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hours Registration Form */}
      <HoursRegistrationForm
        date={selectedDate}
        isVisible={isFormVisible}
        onClose={handleFormClose}
        onProjectAdded={handleProjectAdded}
        startWithProjectsTab={startWithProjectsTab}
      />
    </div>
  );
};
