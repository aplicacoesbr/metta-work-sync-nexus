import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Plus, Search, Trash2, FolderOpen, Calendar, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProjectDetailsModal } from '@/components/projects/ProjectDetailsModal';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
  created_at: string | null;
}

export default function Projects() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
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

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Projeto excluído com sucesso!",
        description: "O projeto foi removido do sistema.",
      });
      setShowDeleteConfirmation(false);
      setProjectToDelete(null);
    },
    onError: (error) => {
      console.error('Erro ao excluir projeto:', error);
      toast({
        title: "Erro ao excluir projeto",
        description: "Não foi possível excluir o projeto. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleNewProject = () => {
    setSelectedProjectId(null);
    setIsModalOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProjectId(project.id);
    setIsModalOpen(true);
  };

  const confirmDeleteProject = (project: Project) => {
    setProjectToDelete(project);
    setShowDeleteConfirmation(true);
  };

  const handleDeleteProject = () => {
    if (projectToDelete) {
      deleteProjectMutation.mutate(projectToDelete.id);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pausado':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'concluido':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projetos</h1>
            <p className="text-gray-600 dark:text-gray-400">Gerencie seus projetos e acompanhe o progresso</p>
          </div>
          <Button onClick={handleNewProject} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Novo Projeto
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Pesquisar projetos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'Nenhum projeto encontrado' : 'Nenhum projeto cadastrado'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchQuery ? 'Tente ajustar sua pesquisa' : 'Comece criando seu primeiro projeto'}
              </p>
              {!searchQuery && (
                <Button onClick={handleNewProject} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Projeto
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1" onClick={() => handleEditProject(project)}>
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {project.name}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className={getStatusColor(project.status)}>
                          {project.status || 'aberto'}
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {project.created_at && new Date(project.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDeleteProject(project);
                      }}
                      className="text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent onClick={() => handleEditProject(project)}>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {project.description || 'Sem descrição'}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>0 registros</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>0 colaboradores</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ProjectDetailsModal
        projectId={selectedProjectId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Projeto</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja excluir o projeto "{projectToDelete?.name}"? 
              Esta ação não pode ser desfeita e todos os registros de horas associados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProject}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteProjectMutation.isPending}
            >
              {deleteProjectMutation.isPending ? 'Excluindo...' : 'Sim, Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
