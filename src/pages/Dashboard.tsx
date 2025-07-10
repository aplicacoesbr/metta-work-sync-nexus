
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/calendar/Calendar';
import { useAuth } from '@/hooks/useAuth';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Bem-vindo ao seu painel de controle</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="corporate-card dark:corporate-card-dark">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">Horas Hoje</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Total de horas registradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">8h 30m</div>
          </CardContent>
        </Card>

        <Card className="corporate-card dark:corporate-card-dark">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">Projetos Ativos</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Projetos em andamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">12</div>
          </CardContent>
        </Card>

        <Card className="corporate-card dark:corporate-card-dark">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">Eficiência</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Meta mensal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">94%</div>
          </CardContent>
        </Card>
      </div>

      <Card className="corporate-card dark:corporate-card-dark">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Calendário de Horas</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Registre e visualize suas horas trabalhadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar />
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
