
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Mail, Clock, Shield, Edit, UserCheck } from 'lucide-react';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

const Users = () => {
  // Fetch users
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as User[];
    },
  });

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Usuários</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie a equipe e permissões</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users?.map((user) => (
          <Card key={user.id} className="corporate-card dark:corporate-card-dark hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12 bg-blue-600">
                  <AvatarFallback className="bg-blue-600 text-white font-semibold">
                    {getInitials(user.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-gray-900 dark:text-white text-lg">{user.full_name}</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Usuário do sistema
                  </CardDescription>
                </div>
                <Badge className={`${getRoleColor(user.role)} text-white`}>
                  {getRoleLabel(user.role)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 text-sm">
                  <Mail className="h-4 w-4 text-blue-500" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 text-sm">
                  <UserCheck className="h-4 w-4 text-green-500" />
                  <span>Ativo desde {new Date(user.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 text-sm">
                  <Shield className="h-4 w-4 text-purple-500" />
                  <span>Nível: {getRoleLabel(user.role)}</span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Ver Perfil
                </Button>
                <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {users?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 text-lg">Nenhum usuário encontrado</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Os usuários aparecerão aqui após o primeiro login</p>
        </div>
      )}
    </div>
  );
};

export default Users;
