
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WeekCalendar } from '@/components/calendar/WeekCalendar';
import { ProjectAnalysis } from '@/components/dashboard/ProjectAnalysis';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, FolderOpen, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Dashboard = () => {
  const { user } = useAuth();

  // Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data: projects } = await supabase
        .from('projects')
        .select('id');

      const { data: users } = await supabase
        .from('profiles')
        .select('id');

      const today = new Date().toISOString().split('T')[0];
      const { data: todayHours } = await supabase
        .from('records')
        .select('worked_hours')
        .eq('user_id', user?.id)
        .eq('date', today);

      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString().split('T')[0];
      const { data: monthHours } = await supabase
        .from('records')
        .select('worked_hours')
        .eq('user_id', user?.id)
        .gte('date', startOfMonth);

      const totalTodayHours = todayHours?.reduce((sum, record) => sum + Number(record.worked_hours), 0) || 0;
      const totalMonthHours = monthHours?.reduce((sum, record) => sum + Number(record.worked_hours), 0) || 0;

      return {
        projectsCount: projects?.length || 0,
        usersCount: users?.length || 0,
        todayHours: totalTodayHours,
        monthHours: totalMonthHours,
      };
    },
  });

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="corporate-card dark:corporate-card-dark border-l-4 border-l-blue-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Horas Hoje</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.todayHours?.toFixed(1) || '0.0'}h
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Total de horas trabalhadas hoje
            </p>
          </CardContent>
        </Card>

        <Card className="corporate-card dark:corporate-card-dark border-l-4 border-l-green-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Projetos Ativos</CardTitle>
            <FolderOpen className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.projectsCount || 0}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Projetos no sistema
            </p>
          </CardContent>
        </Card>

        <Card className="corporate-card dark:corporate-card-dark border-l-4 border-l-purple-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Equipe</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.usersCount || 0}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Usuários cadastrados
            </p>
          </CardContent>
        </Card>

        <Card className="corporate-card dark:corporate-card-dark border-l-4 border-l-orange-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Horas do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.monthHours?.toFixed(1) || '0.0'}h
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Total este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Project Analysis */}
      <ProjectAnalysis />

      {/* Week Calendar Component */}
      <Card className="corporate-card dark:corporate-card-dark">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Calendário Semanal</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Visualize e registre suas horas trabalhadas por semana
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <WeekCalendar />
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
