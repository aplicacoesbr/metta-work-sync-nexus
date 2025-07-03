
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface HoursModalProps {
  date: Date | null;
  isOpen: boolean;
  onClose: () => void;
}

interface TimeEntry {
  id: string;
  projeto: string;
  etapa: string;
  tarefa: string;
  horas: number;
}

interface Project {
  id: string;
  name: string;
}

interface Stage {
  id: string;
  name: string;
  project_id: string;
}

interface Task {
  id: string;
  name: string;
  stage_id: string;
}

export const HoursModal = ({ date, isOpen, onClose }: HoursModalProps) => {
  const [totalHours, setTotalHours] = useState<number>(0);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  console.log('HoursModal - Current user:', user);

  // Função para testar permissões básicas
  const testPermissions = async () => {
    if (!user) {
      console.log('No user logged in');
      return;
    }

    try {
      console.log('Testing basic permissions...');
      
      // Test 1: Check current user session
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      console.log('Current session:', session, 'Error:', sessionError);

      // Test 2: Try to access profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      console.log('Profile query result:', profileData, 'Error:', profileError);

      // Test 3: Try simple projects query
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name')
        .limit(1);
      console.log('Projects query result:', projectsData, 'Error:', projectsError);

    } catch (error) {
      console.error('Permission test failed:', error);
    }
  };

  // Executar teste de permissões quando o modal abrir
  useEffect(() => {
    if (isOpen && user) {
      testPermissions();
    }
  }, [isOpen, user]);

  // Fetch projects com tratamento de erro melhorado
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      console.log('Fetching projects...');
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('name');
        
        if (error) {
          console.error('Error fetching projects:', error);
          throw error;
        }
        console.log('Projects fetched successfully:', data);
        return data as Project[];
      } catch (error) {
        console.error('Projects query failed:', error);
        throw error;
      }
    },
    enabled: isOpen && !!user,
  });

  // Fetch stages com tratamento de erro melhorado
  const { data: stages = [] } = useQuery({
    queryKey: ['stages'],
    queryFn: async () => {
      console.log('Fetching stages...');
      try {
        const { data, error } = await supabase
          .from('stages')
          .select('*')
          .order('name');
        
        if (error) {
          console.error('Error fetching stages:', error);
          throw error;
        }
        console.log('Stages fetched successfully:', data);
        return data as Stage[];
      } catch (error) {
        console.error('Stages query failed:', error);
        throw error;
      }
    },
    enabled: isOpen && !!user,
  });

  // Fetch tasks com tratamento de erro melhorado
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      console.log('Fetching tasks...');
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('name');
        
        if (error) {
          console.error('Error fetching tasks:', error);
          throw error;
        }
        console.log('Tasks fetched successfully:', data);
        return data as Task[];
      } catch (error) {
        console.error('Tasks query failed:', error);
        throw error;
      }
    },
    enabled: isOpen && !!user,
  });

  // Save hours mutation com logs mais detalhados
  const saveHoursMutation = useMutation({
    mutationFn: async (entries: TimeEntry[]) => {
      if (!date || !user?.id) {
        console.error('Missing date or user:', { date, userId: user?.id });
        throw new Error('Data ou usuário não encontrado');
      }

      const dateStr = format(date, 'yyyy-MM-dd');
      console.log('=== STARTING SAVE OPERATION ===');
      console.log('Date:', dateStr);
      console.log('User ID:', user.id);
      console.log('Total hours:', totalHours);
      console.log('Entries:', entries);
      
      try {
        // Primeiro, vamos testar se conseguimos inserir apenas na tabela horasponto
        console.log('Step 1: Inserting into horasponto...');
        const { data: horaspontoData, error: horaspontoError } = await supabase
          .from('horasponto')
          .upsert({
            user_id: user.id,
            date: dateStr,
            total_hours: totalHours,
          })
          .select()
          .single();

        if (horaspontoError) {
          console.error('Error in horasponto insert:', horaspontoError);
          throw horaspontoError;
        }
        console.log('Horasponto inserted successfully:', horaspontoData);

        // Se chegou até aqui, vamos tentar inserir os records
        console.log('Step 2: Inserting records...');
        for (const entry of entries) {
          if (entry.projeto && entry.horas > 0) {
            console.log('Inserting record:', entry);
            
            const recordToInsert = {
              user_id: user.id,
              date: dateStr,
              project_id: entry.projeto,
              stage_id: entry.etapa || null,
              task_id: entry.tarefa || null,
              worked_hours: entry.horas,
            };
            
            console.log('Record data to insert:', recordToInsert);
            
            const { data: recordData, error: recordError } = await supabase
              .from('records')
              .insert(recordToInsert)
              .select()
              .single();

            if (recordError) {
              console.error('Error inserting record:', recordError);
              throw recordError;
            }
            console.log('Record inserted successfully:', recordData);
          }
        }
        
        console.log('=== SAVE OPERATION COMPLETED SUCCESSFULLY ===');
      } catch (error) {
        console.error('=== SAVE OPERATION FAILED ===');
        console.error('Error details:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('Save mutation successful');
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Horas salvas com sucesso!",
        description: `Registrado ${getTotalDistributedHours()}h de ${totalHours}h para ${date ? format(date, 'dd/MM/yyyy') : ''}`,
      });
      setTimeEntries([]);
      setTotalHours(0);
      onClose();
    },
    onError: (error) => {
      console.error('Save mutation failed:', error);
      toast({
        title: "Erro ao salvar horas",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addTimeEntry = () => {
    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      projeto: '',
      etapa: '',
      tarefa: '',
      horas: 0,
    };
    setTimeEntries([...timeEntries, newEntry]);
    console.log('Added new time entry:', newEntry);
  };

  const removeTimeEntry = (id: string) => {
    setTimeEntries(timeEntries.filter(entry => entry.id !== id));
    console.log('Removed time entry:', id);
  };

  const updateTimeEntry = (id: string, field: keyof TimeEntry, value: string | number) => {
    setTimeEntries(timeEntries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
    console.log('Updated time entry:', id, field, value);
  };

  const getTotalDistributedHours = () => {
    return timeEntries.reduce((sum, entry) => sum + entry.horas, 0);
  };

  const handleSave = async () => {
    console.log('=== HANDLE SAVE CALLED ===');
    console.log('Time entries:', timeEntries);
    console.log('Total hours:', totalHours);
    console.log('User:', user);

    if (!user) {
      console.error('No user logged in');
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    if (timeEntries.length === 0) {
      console.log('No time entries');
      toast({
        title: "Erro",
        description: "Adicione pelo menos uma entrada de horas",
        variant: "destructive",
      });
      return;
    }

    if (totalHours <= 0) {
      console.log('No total hours');
      toast({
        title: "Erro",
        description: "Digite o total de horas trabalhadas",
        variant: "destructive",
      });
      return;
    }

    console.log('All validations passed, starting mutation...');
    saveHoursMutation.mutate(timeEntries);
  };

  const isDataComplete = totalHours > 0 && getTotalDistributedHours() === totalHours;

  const getFilteredStages = (projectId: string) => {
    return stages.filter(stage => stage.project_id === projectId);
  };

  const getFilteredTasks = (stageId: string) => {
    return tasks.filter(task => task.stage_id === stageId);
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      console.log('Modal closed, resetting form');
      setTimeEntries([]);
      setTotalHours(0);
    }
  }, [isOpen]);

  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-gray-900 dark:text-white">
          <DialogHeader>
            <DialogTitle>Erro de Autenticação</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center">
            <p>Usuário não autenticado. Por favor, faça login novamente.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-gray-900 dark:text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center space-x-2 text-gray-900 dark:text-white">
            <Clock className="h-5 w-5 text-blue-600" />
            <span>
              Horas Trabalhadas - {date ? format(date, 'dd \'de\' MMMM \'de\' yyyy', { locale: ptBR }) : ''}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Debug Info */}
          {process.env.NODE_ENV === 'development' && (
            <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <CardHeader>
                <CardTitle className="text-sm text-yellow-800 dark:text-yellow-200">Debug Info</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-yellow-700 dark:text-yellow-300">
                <p>User ID: {user?.id}</p>
                <p>Projects loaded: {projects.length}</p>
                <p>Stages loaded: {stages.length}</p>
                <p>Tasks loaded: {tasks.length}</p>
              </CardContent>
            </Card>
          )}

          {/* Total Hours Input */}
          <Card className="corporate-card dark:corporate-card-dark">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 dark:text-white">Total de Horas Trabalhadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Label htmlFor="totalHours" className="text-gray-700 dark:text-gray-300">Horas Totais</Label>
                  <Input
                    id="totalHours"
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={totalHours}
                    onChange={(e) => setTotalHours(parseFloat(e.target.value) || 0)}
                    className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-gray-900 dark:text-white"
                    placeholder="8.0"
                  />
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Distribuído</div>
                  <div className={`text-lg font-bold ${getTotalDistributedHours() === totalHours ? 'text-green-600' : 'text-red-600'}`}>
                    {getTotalDistributedHours()}h
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Entries */}
          <Card className="corporate-card dark:corporate-card-dark">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-gray-900 dark:text-white">Distribuição por Projeto</CardTitle>
              <Button
                onClick={addTimeEntry}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {timeEntries.length === 0 ? (
                <div className="text-center text-gray-600 dark:text-gray-400 py-8">
                  Nenhuma distribuição de horas adicionada.
                  <br />
                  Clique em "Adicionar" para começar.
                </div>
              ) : (
                timeEntries.map((entry, index) => (
                  <div key={entry.id} className="space-y-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 dark:text-white">Entrada #{index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTimeEntry(entry.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Projeto</Label>
                        <Select onValueChange={(value) => updateTimeEntry(entry.id, 'projeto', value)}>
                          <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                            <SelectValue placeholder="Selecionar projeto" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                            {projects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Etapa</Label>
                        <Select onValueChange={(value) => updateTimeEntry(entry.id, 'etapa', value)}>
                          <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                            <SelectValue placeholder="Selecionar etapa" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                            {getFilteredStages(entry.projeto).map((stage) => (
                              <SelectItem key={stage.id} value={stage.id}>
                                {stage.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Tarefa</Label>
                        <Select onValueChange={(value) => updateTimeEntry(entry.id, 'tarefa', value)}>
                          <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                            <SelectValue placeholder="Selecionar tarefa" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                            {getFilteredTasks(entry.etapa).map((task) => (
                              <SelectItem key={task.id} value={task.id}>
                                {task.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Horas</Label>
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          value={entry.horas}
                          onChange={(e) => updateTimeEntry(entry.id, 'horas', parseFloat(e.target.value) || 0)}
                          className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-gray-900 dark:text-white"
                          placeholder="0.0"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}

              {timeEntries.length > 0 && (
                <>
                  <Separator className="bg-slate-300 dark:bg-slate-600" />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Diferença: {(totalHours - getTotalDistributedHours()).toFixed(1)}h
                    </span>
                    <span className={`font-bold ${isDataComplete ? 'text-green-600' : 'text-red-600'}`}>
                      Status: {isDataComplete ? 'Completo' : 'Incompleto'}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveHoursMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saveHoursMutation.isPending ? 'Salvando...' : 'Salvar Horas'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
