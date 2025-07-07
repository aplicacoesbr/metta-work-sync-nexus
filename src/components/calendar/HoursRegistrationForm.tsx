
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Clock, FolderOpen, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { parseTimeInput, formatTimeToDisplay, formatTimeToDecimal } from '@/utils/timeUtils';

interface HoursRegistrationFormProps {
  date: Date | null;
  isVisible: boolean;
  onClose: () => void;
}

interface TimeEntry {
  id: string;
  projeto: string;
  etapa: string;
  tarefa: string;
  horas: number;
  horasInput: string;
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

export const HoursRegistrationForm = ({ date, isVisible, onClose }: HoursRegistrationFormProps) => {
  const [totalHoursInput, setTotalHoursInput] = useState<string>('');
  const [totalHours, setTotalHours] = useState<number>(0);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Project[];
    },
    enabled: isVisible && !!user,
  });

  // Fetch stages
  const { data: stages = [] } = useQuery({
    queryKey: ['stages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stages')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Stage[];
    },
    enabled: isVisible && !!user,
  });

  // Fetch tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Task[];
    },
    enabled: isVisible && !!user,
  });

  // Save hours mutation
  const saveHoursMutation = useMutation({
    mutationFn: async (data: { totalHours: number; entries: TimeEntry[] }) => {
      if (!date || !user?.id) {
        throw new Error('Data ou usuário não encontrado');
      }

      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Insert into horasponto
      const { error: horaspontoError } = await supabase
        .from('horasponto')
        .upsert({
          user_id: user.id,
          date: dateStr,
          total_hours: formatTimeToDecimal(data.totalHours),
        });

      if (horaspontoError) throw horaspontoError;

      // Insert records
      for (const entry of data.entries) {
        if (entry.projeto && entry.horas > 0) {
          const { error: recordError } = await supabase
            .from('records')
            .insert({
              user_id: user.id,
              date: dateStr,
              project_id: entry.projeto,
              stage_id: entry.etapa || null,
              task_id: entry.tarefa || null,
              worked_hours: formatTimeToDecimal(entry.horas),
            });

          if (recordError) throw recordError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Horas registradas com sucesso!",
        description: `Registrado ${formatTimeToDisplay(getTotalDistributedHours())} de ${formatTimeToDisplay(totalHours)} para ${date ? format(date, 'dd/MM/yyyy') : ''}`,
      });
      resetForm();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro ao registrar horas",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTotalHoursInput('');
    setTotalHours(0);
    setTimeEntries([]);
  };

  const handleTotalHoursChange = (input: string) => {
    setTotalHoursInput(input);
    const parsed = parseTimeInput(input);
    setTotalHours(parsed);
  };

  const addTimeEntry = () => {
    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      projeto: '',
      etapa: '',
      tarefa: '',
      horas: 0,
      horasInput: '',
    };
    setTimeEntries([...timeEntries, newEntry]);
  };

  const removeTimeEntry = (id: string) => {
    setTimeEntries(timeEntries.filter(entry => entry.id !== id));
  };

  const updateTimeEntry = (id: string, field: keyof TimeEntry, value: string | number) => {
    setTimeEntries(timeEntries.map(entry => {
      if (entry.id === id) {
        if (field === 'horasInput') {
          const parsed = parseTimeInput(value as string);
          return { ...entry, horasInput: value as string, horas: parsed };
        }
        return { ...entry, [field]: value };
      }
      return entry;
    }));
  };

  const getTotalDistributedHours = () => {
    return timeEntries.reduce((sum, entry) => sum + entry.horas, 0);
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
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

    saveHoursMutation.mutate({ totalHours, entries: timeEntries });
  };

  const getFilteredStages = (projectId: string) => {
    return stages.filter(stage => stage.project_id === projectId);
  };

  const getFilteredTasks = (stageId: string) => {
    return tasks.filter(task => task.stage_id === stageId);
  };

  const isDataComplete = totalHours > 0 && Math.abs(getTotalDistributedHours() - totalHours) < 0.01;

  useEffect(() => {
    if (!isVisible) {
      resetForm();
    }
  }, [isVisible]);

  if (!isVisible || !date) return null;

  return (
    <div className="w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 h-full overflow-y-auto">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-bold">Registro de Horas</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          {format(date, 'dd \'de\' MMMM \'de\' yyyy', { locale: ptBR })}
        </div>

        <Tabs defaultValue="ponto" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ponto">Ponto</TabsTrigger>
            <TabsTrigger value="projetos">Projetos</TabsTrigger>
          </TabsList>

          <TabsContent value="ponto" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total de Horas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="totalHours">Horas trabalhadas</Label>
                  <Input
                    id="totalHours"
                    value={totalHoursInput}
                    onChange={(e) => handleTotalHoursChange(e.target.value)}
                    placeholder="Ex: 8 ou 730 (7:30)"
                  />
                  {totalHours > 0 && (
                    <div className="text-sm text-gray-600">
                      = {formatTimeToDisplay(totalHours)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projetos" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Distribuição por Projeto</CardTitle>
                <Button onClick={addTimeEntry} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {timeEntries.length === 0 ? (
                  <div className="text-center text-gray-600 py-8">
                    Nenhuma distribuição de horas.
                    <br />
                    Clique em "Adicionar" para começar.
                  </div>
                ) : (
                  timeEntries.map((entry, index) => (
                    <div key={entry.id} className="space-y-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Entrada #{index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTimeEntry(entry.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label>Projeto</Label>
                          <Select onValueChange={(value) => updateTimeEntry(entry.id, 'projeto', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecionar projeto" />
                            </SelectTrigger>
                            <SelectContent>
                              {projects.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Etapa</Label>
                          <Select onValueChange={(value) => updateTimeEntry(entry.id, 'etapa', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecionar etapa" />
                            </SelectTrigger>
                            <SelectContent>
                              {getFilteredStages(entry.projeto).map((stage) => (
                                <SelectItem key={stage.id} value={stage.id}>
                                  {stage.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Tarefa</Label>
                          <Select onValueChange={(value) => updateTimeEntry(entry.id, 'tarefa', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecionar tarefa" />
                            </SelectTrigger>
                            <SelectContent>
                              {getFilteredTasks(entry.etapa).map((task) => (
                                <SelectItem key={task.id} value={task.id}>
                                  {task.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Horas</Label>
                          <Input
                            value={entry.horasInput}
                            onChange={(e) => updateTimeEntry(entry.id, 'horasInput', e.target.value)}
                            placeholder="Ex: 2 ou 130 (1:30)"
                          />
                          {entry.horas > 0 && (
                            <div className="text-sm text-gray-600 mt-1">
                              = {formatTimeToDisplay(entry.horas)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {timeEntries.length > 0 && (
                  <>
                    <Separator />
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        Diferença: {formatTimeToDisplay(Math.abs(totalHours - getTotalDistributedHours()))}
                      </span>
                      <span className={`font-bold ${isDataComplete ? 'text-green-600' : 'text-red-600'}`}>
                        Status: {isDataComplete ? 'Completo' : 'Incompleto'}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveHoursMutation.isPending || totalHours <= 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saveHoursMutation.isPending ? 'Salvando...' : 'Salvar Horas'}
          </Button>
        </div>
      </div>
    </div>
  );
};
