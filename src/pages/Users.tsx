
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Mail, Clock, Shield } from 'lucide-react';

const Users = () => {
  // Mock data for users
  const users = [
    {
      id: '1',
      nome_completo: 'João Silva',
      email: 'joao.silva@mettabr.com',
      role: 'administrador',
      department: 'TI',
      horasSemanais: 40,
      status: 'Ativo',
    },
    {
      id: '2',
      nome_completo: 'Maria Santos',
      email: 'maria.santos@mettabr.com',
      role: 'gestor',
      department: 'Desenvolvimento',
      horasSemanais: 38,
      status: 'Ativo',
    },
    {
      id: '3',
      nome_completo: 'Pedro Costa',
      email: 'pedro.costa@mettabr.com',
      role: 'colaborador',
      department: 'Desenvolvimento',
      horasSemanais: 40,
      status: 'Ativo',
    },
    {
      id: '4',
      nome_completo: 'Ana Oliveira',
      email: 'ana.oliveira@mettabr.com',
      role: 'colaborador',
      department: 'Design',
      horasSemanais: 35,
      status: 'Férias',
    },
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'administrador':
        return 'bg-red-600';
      case 'gestor':
        return 'bg-blue-600';
      case 'colaborador':
        return 'bg-green-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'administrador':
        return 'Admin';
      case 'gestor':
        return 'Gestor';
      case 'colaborador':
        return 'Colaborador';
      default:
        return role;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Usuários</h1>
          <p className="text-gray-400">Gerencie a equipe e permissões</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <Card key={user.id} className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12 bg-blue-600">
                  <AvatarFallback className="bg-blue-600 text-white">
                    {getInitials(user.nome_completo)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-white text-lg">{user.nome_completo}</CardTitle>
                  <CardDescription className="text-gray-400">
                    {user.department}
                  </CardDescription>
                </div>
                <Badge className={`${getRoleColor(user.role)} text-white`}>
                  {getRoleLabel(user.role)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-gray-300 text-sm">
                  <Mail className="h-4 w-4 text-blue-400" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-300 text-sm">
                  <Clock className="h-4 w-4 text-green-400" />
                  <span>{user.horasSemanais}h/semana</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-300 text-sm">
                  <Shield className="h-4 w-4 text-purple-400" />
                  <span>Status: {user.status}</span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                  Ver Perfil
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

export default Users;
