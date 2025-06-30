
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Users, Clock } from 'lucide-react';

const Projects = () => {
  // Mock data for projects
  const projects = [
    {
      id: '1',
      nome: 'Sistema de Gestão',
      status: 'Em Desenvolvimento',
      etapas: 5,
      membros: 4,
      horasGastas: 120,
      prazo: '2024-03-15',
    },
    {
      id: '2',
      nome: 'App Mobile',
      status: 'Planejamento',
      etapas: 3,
      membros: 2,
      horasGastas: 45,
      prazo: '2024-04-30',
    },
    {
      id: '3',
      nome: 'Website Corporativo',
      status: 'Finalizado',
      etapas: 4,
      membros: 3,
      horasGastas: 89,
      prazo: '2024-01-20',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Em Desenvolvimento':
        return 'bg-blue-600';
      case 'Planejamento':
        return 'bg-yellow-600';
      case 'Finalizado':
        return 'bg-green-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Projetos</h1>
          <p className="text-gray-400">Gerencie todos os projetos da equipe</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">{project.nome}</CardTitle>
                <Badge className={`${getStatusColor(project.status)} text-white`}>
                  {project.status}
                </Badge>
              </div>
              <CardDescription className="text-gray-400">
                Projeto em {project.status.toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2 text-gray-300">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <span>{new Date(project.prazo).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-300">
                  <Users className="h-4 w-4 text-green-400" />
                  <span>{project.membros} membros</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-300">
                  <Clock className="h-4 w-4 text-purple-400" />
                  <span>{project.horasGastas}h gastas</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-300">
                  <div className="w-4 h-4 bg-orange-400 rounded" />
                  <span>{project.etapas} etapas</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                  Ver Detalhes
                </Button>
                <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Projects;
