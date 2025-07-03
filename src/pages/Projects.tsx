
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, FolderOpen, Calendar, User, Settings, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ProjectDetailsModal } from '@/components/projects/ProjectDetailsModal';

interface Project {
  id: string;
  name: string;
  description?: string;
  status?: string;
  created_at: string;
}

const Projects = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch projects
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Project[];
    },
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      console.log('Creating project:', {
        name,
        userId: user.id,
        userEmail: user.email
      });
      
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: name,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        throw error;
      }
      
      console.log('Project created successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setNewProjectName('');
      setIsCreateModalOpen(false);
      toast({
        title: "Projeto criado com sucesso!",
        description: "Você pode agora adicionar etapas e tarefas ao projeto.",
      });
    },
    onError: (error) => {
      console.error('Project creation failed:', error);
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
          <p className="text-gray-600 dark:text-gray-400">Gerencie seus projetos, etapas e tarefas</p>
          {user && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Logado como: {user.email}
            </p>
          )}
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Novo Projeto
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700">
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
                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-gray-900 dark:text-white"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-gray-900 dark:text-white"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim() || createProjectMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {createProjectMutation.isPending ? 'Criando...' : 'Criar Projeto'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects?.map((project) => (
          <Card key={project.id} className="corporate-card dark:corporate-card-dark hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FolderOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-900 dark:text-white text-lg">{project.name}</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      Criado em {new Date(project.created_at).toLocaleDateString('pt-BR')}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                  {project.status || 'Ativo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 text-sm">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span>Atualizado em {new Date(project.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700"
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Gerenciar
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Detalhes
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {projects?.length === 0 && (
        <div className="text-center py-12">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <FolderOpen className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">Nenhum projeto encontrado</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm">Crie seu primeiro projeto para começar</p>
        </div>
      )}

      <ProjectDetailsModal
        projectId={selectedProjectId}
        isOpen={!!selectedProjectId}
        onClose={() => setSelectedProjectId(null)}
      />
    </div>
  );
};

export default Projects;
