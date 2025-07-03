
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

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      console.log('Fetching projects...');
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching projects:', error);
        throw error;
      }
      console.log('Projects fetched:', data);
      return data as Project[];
    },
    enabled: isOpen,
  });

  // Fetch stages
  const { data: stages = [] } = useQuery({
    queryKey: ['stages'],
    queryFn: async () => {
      console.log('Fetching stages...');
      const { data, error } = await supabase
        .from('stages')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching stages:', error);
        throw error;
      }
      console.log('Stages fetched:', data);
      return data as Stage[];
    },
    enabled: isOpen,
  });

  // Fetch tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      console.log('Fetching tasks...');
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }
      console.log('Tasks fetched:', data);
      return data as Task[];
    },
    enabled: isOpen,
  });

  // Save hours mutation
  const saveHoursMutation = useMutation({
    mutationFn: async (entries: TimeEntry[]) => {
      if (!date || !user?.id) {
        console.error('Missing date or user:', { date, userId: user?.id });
        throw new Error('Data ou usuário não encontrado');
      }

      const dateStr = format(date, 'yyyy-MM-dd');
      console.log('Saving hours for date:', dateStr, 'User:', user.id);
      
      try {
        // Save to horasponto table first
        console.log('Inserting horasponto record...');
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
          console.error('Error saving horasponto:', horaspontoError);
          throw horaspontoError;
        }
        console.log('Horasponto saved:', horaspontoData);

        // Save individual entries to records table
        for (const entry of entries) {
          if (entry.projeto && entry.horas > 0) {
            console.log('Inserting record:', entry);
            const { data: recordData, error: recordError } = await supabase
              .from('records')
              .insert({
                user_id: user.id,
                date: dateStr,
                project_id: entry.projeto,
                stage_id: entry.etapa || null,
                task_id: entry.tarefa || null,
                worked_hours: entry.horas,
              })
              .select()
              .single();

            if (recordError) {
              console.error('Error saving record:', recordError);
              throw recordError;
            }
            console.log('Record saved:', recordData);
          }
        }
      } catch (error) {
        console.error('Save operation failed:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('Save successful');
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
      console.error('Save failed:', error);
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
  };

  const removeTimeEntry = (id: string) => {
    setTimeEntries(timeEntries.filter(entry => entry.id !== id));
  };

  const updateTimeEntry = (id: string, field: keyof TimeEntry, value: string | number) => {
    setTimeEntries(timeEntries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const getTotalDistributedHours = () => {
    return timeEntries.reduce((sum, entry) => sum + entry.horas, 0);
  };

  const handleSave = async () => {
    console.log('Handle save called');
    console.log('Time entries:', timeEntries);
    console.log('Total hours:', totalHours);
    console.log('User:', user);

    if (timeEntries.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos uma entrada de horas",
        variant: "destructive",
      });
      return;
    }

    if (totalHours <= 0) {
      toast({
        title: "Erro",
        description: "Digite o total de horas trabalhadas",
        variant: "destructive",
      });
      return;
    }

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
      setTimeEntries([]);
      setTotalHours(0);
    }
  }, [isOpen]);

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
