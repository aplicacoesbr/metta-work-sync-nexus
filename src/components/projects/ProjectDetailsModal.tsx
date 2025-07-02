
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, FolderOpen, List } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ProjectDetailsModalProps {
  projectId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface Stage {
  id: string;
  nome: string;
  projeto_id: string;
}

interface Task {
  id: string;
  nome: string;
  etapa_id: string;
}

export const ProjectDetailsModal = ({ projectId, isOpen, onClose }: ProjectDetailsModalProps) => {
  const [newStageName, setNewStageName] = useState('');
  const [newTaskNames, setNewTaskNames] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch project details
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from('projetos')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch stages
  const { data: stages = [] } = useQuery({
    queryKey: ['stages', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('etapas')
        .select('*')
        .eq('projeto_id', projectId)
        .order('nome');
      
      if (error) throw error;
      return data as Stage[];
    },
    enabled: !!projectId,
  });

  // Fetch tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      if (!projectId || stages.length === 0) return [];
      const { data, error } = await supabase
        .from('tarefas')
        .select('*')
        .in('etapa_id', stages.map(s => s.id))
        .order('nome');
      
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!projectId && stages.length > 0,
  });

  // Add stage mutation
  const addStageMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!projectId || !user) throw new Error('Projeto ou usuário não encontrado');
      
      const { error } = await supabase
        .from('etapas')
        .insert({
          nome: name,
          projeto_id: projectId,
          created_by: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stages', projectId] });
      setNewStageName('');
      toast({
        title: "Etapa adicionada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar etapa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: async ({ name, stageId }: { name: string; stageId: string }) => {
      if (!user) throw new Error('Usuário não encontrado');
      
      const { error } = await supabase
        .from('tarefas')
        .insert({
          nome: name,
          etapa_id: stageId,
          created_by: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      setNewTaskNames({});
      toast({
        title: "Tarefa adicionada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar tarefa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete stage mutation
  const deleteStageMutation = useMutation({
    mutationFn: async (stageId: string) => {
      const { error } = await supabase
        .from('etapas')
        .delete()
        .eq('id', stageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stages', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast({
        title: "Etapa removida com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover etapa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tarefas')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast({
        title: "Tarefa removida com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover tarefa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddStage = () => {
    if (newStageName.trim()) {
      addStageMutation.mutate(newStageName.trim());
    }
  };

  const handleAddTask = (stageId: string) => {
    const taskName = newTaskNames[stageId];
    if (taskName?.trim()) {
      addTaskMutation.mutate({ name: taskName.trim(), stageId });
    }
  };

  const getTasksForStage = (stageId: string) => {
    return tasks.filter(task => task.etapa_id === stageId);
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-gray-900 dark:text-white max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center space-x-2 text-gray-900 dark:text-white">
            <FolderOpen className="h-5 w-5 text-blue-600" />
            <span>Gerenciar Projeto: {project.nome}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Stage */}
          <Card className="corporate-card dark:corporate-card-dark">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 dark:text-white">Adicionar Nova Etapa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-3">
                <div className="flex-1">
                  <Input
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    placeholder="Nome da etapa"
                    className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-gray-900 dark:text-white"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddStage()}
                  />
                </div>
                <Button
                  onClick={handleAddStage}
                  disabled={!newStageName.trim() || addStageMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Etapa
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stages and Tasks Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stages Column */}
            <Card className="corporate-card dark:corporate-card-dark">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center space-x-2">
                  <FolderOpen className="h-5 w-5 text-blue-600" />
                  <span>Etapas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stages.length === 0 ? (
                  <div className="text-center text-gray-600 dark:text-gray-400 py-8">
                    Nenhuma etapa adicionada ainda.
                  </div>
                ) : (
                  stages.map((stage) => (
                    <div
                      key={stage.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">{stage.nome}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteStageMutation.mutate(stage.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Tasks Column */}
            <Card className="corporate-card dark:corporate-card-dark">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center space-x-2">
                  <List className="h-5 w-5 text-green-600" />
                  <span>Tarefas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stages.length === 0 ? (
                  <div className="text-center text-gray-600 dark:text-gray-400 py-8">
                    Adicione etapas primeiro para criar tarefas.
                  </div>
                ) : (
                  stages.map((stage) => (
                    <div key={stage.id} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">{stage.nome}</h4>
                        <Separator className="flex-1 bg-slate-300 dark:bg-slate-600" />
                      </div>
                      
                      {/* Add Task Input */}
                      <div className="flex space-x-2">
                        <Input
                          value={newTaskNames[stage.id] || ''}
                          onChange={(e) => setNewTaskNames(prev => ({ ...prev, [stage.id]: e.target.value }))}
                          placeholder="Nova tarefa"
                          className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-gray-900 dark:text-white text-sm"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddTask(stage.id)}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddTask(stage.id)}
                          disabled={!newTaskNames[stage.id]?.trim() || addTaskMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Tasks List */}
                      <div className="space-y-1">
                        {getTasksForStage(stage.id).map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800"
                          >
                            <span className="text-sm text-gray-900 dark:text-white">{task.nome}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTaskMutation.mutate(task.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Close Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
