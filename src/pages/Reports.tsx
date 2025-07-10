
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectAnalysis } from '@/components/dashboard/ProjectAnalysis';
import { BarChart3 } from 'lucide-react';

const Reports = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <BarChart3 className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
          <p className="text-gray-600 dark:text-gray-400">Análise detalhada de projetos e produtividade</p>
        </div>
      </div>

      <Card className="corporate-card dark:corporate-card-dark">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Análise de Projetos</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Visão completa do desempenho e métricas dos projetos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectAnalysis />
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
