
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Clock, FolderOpen, Plus, Trash2, X } from 'lucide-react';
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
  descricao: string;
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
      const { data: horaspontoData, error: horaspontoError } = await supabase
        .from('horasponto')
        .upsert({
          user_id: user.id,
          date: dateStr,
          total_hours: formatTimeToDecimal(data.totalHours),
        })
        .select()
        .single();

      if (horaspontoError) throw horaspontoError;

      // Clear existing records for this date
      await supabase
        .from('records')
        .delete()
        .eq('user_id', user.id)
        .eq('date', dateStr);

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
              description: entry.descricao || null,
              horasponto_id: horaspontoData.id,
            });

          if (recordError) throw recordError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-data'] });
      toast({
        title: "Horas registradas com sucesso!",
        description: `Registrado ${formatTimeToDisplay(getTotalDistributedHours())} de ${formatTimeToDisplay(totalHours)} para ${date ? format(date, 'dd/MM/yyyy') : ''}`,
      });
      resetForm();
      onClose();
    },
    onError: (error) => {
      console.error('Erro ao salvar horas:', error);
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
      descricao: '',
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
        if (field === 'projeto') {
          // Reset etapa and tarefa when project changes
          return { ...entry, projeto: value as string, etapa: '', tarefa: '' };
        }
        if (field === 'etapa') {
          // Reset tarefa when stage changes
          return { ...entry, etapa: value as string, tarefa: '' };
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
  const remainingHours = totalHours - getTotalDistributedHours();

  useEffect(() => {
    if (!isVisible) {
      resetForm();
    }
  }, [isVisible]);

  if (!isVisible || !date) return null;

  return (
    <div className="w-[500px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 h-full overflow-y-auto shadow-xl">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Registro de Horas</h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Tabs defaultValue="ponto" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="ponto" className="text-base">Registro de Ponto</TabsTrigger>
            <TabsTrigger value="projetos" className="text-base">Distribuição de Horas</TabsTrigger>
          </TabsList>

          <TabsContent value="ponto" className="space-y-6 mt-8">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span>Total de Horas Trabalhadas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="totalHours" className="text-base font-medium">Horas trabalhadas no dia</Label>
                  <Input
                    id="totalHours"
                    value={totalHoursInput}
                    onChange={(e) => handleTotalHoursChange(e.target.value)}
                    placeholder="Ex: 8 ou 730 (7:30)"
                    className="h-12 text-lg"
                  />
                  {totalHours > 0 && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Equivale a:</span>
                      <span className="text-lg font-semibold text-blue-600">
                        {formatTimeToDisplay(totalHours)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <p><strong>Dicas:</strong></p>
                  <p>• Digite "8" para 8:00 horas</p>
                  <p>• Digite "730" para 7:30 horas</p>
                  <p>• Digite "1030" para 10:30 horas</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projetos" className="space-y-6 mt-8">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-xl flex items-center space-x-2">
                  <FolderOpen className="h-5 w-5 text-blue-600" />
                  <span>Distribuição por Projeto</span>
                </CardTitle>
                <Button onClick={addTimeEntry} size="sm" className="bg-blue-600 hover:bg-blue-700 h-10 px-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Projeto
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {totalHours > 0 && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-amber-800 dark:text-amber-200">
                        Total disponível: <strong>{formatTimeToDisplay(totalHours)}</strong>
                      </span>
                      <span className="text-amber-800 dark:text-amber-200">
                        Restante: <strong>{formatTimeToDisplay(Math.max(0, remainingHours))}</strong>
                      </span>
                    </div>
                    {remainingHours < 0 && (
                      <p className="text-red-600 text-sm mt-2">
                        ⚠️ Você distribuiu {formatTimeToDisplay(Math.abs(remainingHours))} a mais que o total
                      </p>
                    )}
                  </div>
                )}

                {timeEntries.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-base mb-2">
                      Nenhuma distribuição de horas
                    </p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm">
                      Clique em "Adicionar Projeto" para começar
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {timeEntries.map((entry, index) => (
                      <Card key={entry.id} className="bg-gray-50 dark:bg-slate-800 border-l-4 border-l-blue-500">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-6">
                            <h4 className="font-semibold text-lg text-gray-900 dark:text-white">
                              Projeto #{index + 1}
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTimeEntry(entry.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                              <Label className="text-base font-medium">Projeto *</Label>
                              <Select value={entry.projeto} onValueChange={(value) => updateTimeEntry(entry.id, 'projeto', value)}>
                                <SelectTrigger className="h-12">
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

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-base font-medium">Etapa</Label>
                                <Select 
                                  value={entry.etapa} 
                                  onValueChange={(value) => updateTimeEntry(entry.id, 'etapa', value)}
                                  disabled={!entry.projeto}
                                >
                                  <SelectTrigger className="h-12">
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

                              <div className="space-y-2">
                                <Label className="text-base font-medium">Tarefa</Label>
                                <Select 
                                  value={entry.tarefa} 
                                  onValueChange={(value) => updateTimeEntry(entry.id, 'tarefa', value)}
                                  disabled={!entry.etapa}
                                >
                                  <SelectTrigger className="h-12">
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
                            </div>

                            <div className="space-y-2">
                              <Label className="text-base font-medium">Horas Trabalhadas *</Label>
                              <Input
                                value={entry.horasInput}
                                onChange={(e) => updateTimeEntry(entry.id, 'horasInput', e.target.value)}
                                placeholder="Ex: 2 ou 130 (1:30)"
                                className="h-12 text-lg"
                              />
                              {entry.horas > 0 && (
                                <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                                  <span className="text-sm text-gray-600 dark:text-gray-400">Equivale a:</span>
                                  <span className="font-semibold text-blue-600">
                                    {formatTimeToDisplay(entry.horas)}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label className="text-base font-medium">Descrição (opcional)</Label>
                              <Textarea
                                value={entry.descricao}
                                onChange={(e) => updateTimeEntry(entry.id, 'descricao', e.target.value)}
                                placeholder="Descreva as atividades realizadas..."
                                className="min-h-[80px] resize-none"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {timeEntries.length > 0 && (
                  <>
                    <Separator />
                    <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total distribuído:</span>
                          <span className="font-semibold">{formatTimeToDisplay(getTotalDistributedHours())}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total do ponto:</span>
                          <span className="font-semibold">{formatTimeToDisplay(totalHours)}</span>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                        isDataComplete 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {isDataComplete ? '✓ Completo' : '⚠ Incompleto'}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button variant="outline" onClick={onClose} className="h-12 px-6">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveHoursMutation.isPending || totalHours <= 0}
            className="bg-blue-600 hover:bg-blue-700 h-12 px-6"
          >
            {saveHoursMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              'Salvar Horas'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
