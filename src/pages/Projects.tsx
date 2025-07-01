
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Users, Clock, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

interface Project {
  id: string;
  nome: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

const Projects = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // Fetch projects
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projetos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Project[];
    },
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (nome: string) => {
      const { data, error } = await supabase
        .from('projetos')
        .insert([{ nome, created_by: user?.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsDialogOpen(false);
      setNewProjectName('');
      toast({
        title: "Projeto criado com sucesso!",
        description: "O novo projeto foi adicionado ao sistema.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar projeto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createProjectMutation.mutate(newProjectName.trim());
    }
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projetos</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie todos os projetos da equipe</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Projeto
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-slate-800">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">Criar Novo Projeto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="projectName" className="text-gray-700 dark:text-gray-300">Nome do Projeto</Label>
                <Input
                  id="projectName"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Digite o nome do projeto"
                  className="mt-1"
                />
              </div>
              <Button 
                onClick={handleCreateProject} 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={createProjectMutation.isPending}
              >
                {createProjectMutation.isPending ? 'Criando...' : 'Criar Projeto'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects?.map((project) => (
          <Card key={project.id} className="corporate-card dark:corporate-card-dark hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-900 dark:text-white">{project.nome}</CardTitle>
                <Badge className="bg-blue-600 text-white">
                  Ativo
                </Badge>
              </div>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Projeto criado em {new Date(project.created_at).toLocaleDateString('pt-BR')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span>Em andamento</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <Users className="h-4 w-4 text-green-500" />
                  <span>Equipe ativa</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {projects?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 text-lg">Nenhum projeto encontrado</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Crie seu primeiro projeto para começar</p>
        </div>
      )}
    </div>
  );
};

export default Projects;
