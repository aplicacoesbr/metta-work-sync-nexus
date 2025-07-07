import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
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
import { Clock, FolderOpen, Plus, Trash2, X, Edit } from 'lucide-react';
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
  startWithProjectsTab?: boolean;
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

export const HoursRegistrationForm = ({ date, isVisible, onClose, startWithProjectsTab = false }: HoursRegistrationFormProps) => {
  const [totalHoursInput, setTotalHoursInput] = useState<string>('');
  const [totalHours, setTotalHours] = useState<number>(0);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [showEditConfirmation, setShowEditConfirmation] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('ponto');
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch existing data for the selected date
  const { data: existingData } = useQuery({
    queryKey: ['day-data', date ? format(date, 'yyyy-MM-dd') : null, user?.id],
    queryFn: async () => {
      if (!date || !user?.id) return null;

      const dateStr = format(date, 'yyyy-MM-dd');

      // Fetch horasponto data
      const { data: horaspontoData } = await supabase
        .from('horasponto')
        .select('total_hours')
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .maybeSingle();

      // Fetch records data
      const { data: recordsData } = await supabase
        .from('records')
        .select('id, project_id, stage_id, task_id, worked_hours, description')
        .eq('user_id', user.id)
        .eq('date', dateStr);

      return {
        totalHours: horaspontoData?.total_hours || 0,
        records: recordsData || []
      };
    },
    enabled: isVisible && !!date && !!user?.id,
  });

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

  // Load existing data when component opens
  useEffect(() => {
    if (existingData && isVisible) {
      if (existingData.totalHours > 0) {
        setTotalHours(existingData.totalHours);
        setTotalHoursInput(formatTimeToDisplay(existingData.totalHours));
      }

      if (existingData.records.length > 0) {
        const entries = existingData.records.map((record: any) => ({
          id: record.id,
          projeto: record.project_id || '',
          etapa: record.stage_id || '',
          tarefa: record.task_id || '',
          horas: record.worked_hours,
          horasInput: formatTimeToDisplay(record.worked_hours),
          descricao: record.description || '',
        }));
        setTimeEntries(entries);
      }

      // Set initial tab based on prop
      if (startWithProjectsTab && existingData.totalHours > 0) {
        setActiveTab('projetos');
      } else {
        setActiveTab('ponto');
      }
    }
  }, [existingData, isVisible, startWithProjectsTab]);

  // Save hours mutation
  const saveHoursMutation = useMutation({
    mutationFn: async (data: { totalHours: number; entries: TimeEntry[] }) => {
      if (!date || !user?.id) {
        throw new Error('Data ou usuário não encontrado');
      }

      const dateStr = format(date, 'yyyy-MM-dd');
      
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

      await supabase
        .from('records')
        .delete()
        .eq('user_id', user.id)
        .eq('date', dateStr);

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
      queryClient.invalidateQueries({ queryKey: ['day-data'] });
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

  const handleEditPointHours = () => {
    setShowEditConfirmation(true);
  };

  const confirmEditPointHours = () => {
    setActiveTab('ponto');
    setShowEditConfirmation(false);
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

  const confirmRemoveTimeEntry = (id: string) => {
    setEntryToDelete(id);
    setShowDeleteConfirmation(true);
  };

  const removeTimeEntry = () => {
    if (entryToDelete) {
      setTimeEntries(timeEntries.filter(entry => entry.id !== entryToDelete));
      setEntryToDelete(null);
      setShowDeleteConfirmation(false);
    }
  };

  const updateTimeEntry = (id: string, field: keyof TimeEntry, value: string | number) => {
    setTimeEntries(timeEntries.map(entry => {
      if (entry.id === id) {
        if (field === 'horasInput') {
          const parsed = parseTimeInput(value as string);
          return { ...entry, horasInput: value as string, horas: parsed };
        }
        if (field === 'projeto') {
          return { ...entry, projeto: value as string, etapa: '', tarefa: '' };
        }
        if (field === 'etapa') {
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
    <>
      {/* Expanded form width */}
      <div className="w-[600px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 h-full overflow-y-auto shadow-xl">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Registro de Horas</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-10">
              <TabsTrigger value="ponto">Registro de Ponto</TabsTrigger>
              <TabsTrigger value="projetos">Distribuição de Horas</TabsTrigger>
            </TabsList>

            <TabsContent value="ponto" className="space-y-4 mt-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span>Total de Horas Trabalhadas</span>
                    </CardTitle>
                    {existingData?.totalHours > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditPointHours}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {existingData?.totalHours > 0 && activeTab === 'ponto' ? (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between">
                        <span className="text-green-800 dark:text-green-200 font-medium">
                          Horas já registradas: {formatTimeToDisplay(existingData.totalHours)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="totalHours" className="font-medium">Horas trabalhadas no dia</Label>
                        <Input
                          id="totalHours"
                          value={totalHoursInput}
                          onChange={(e) => handleTotalHoursChange(e.target.value)}
                          placeholder="Ex: 8 ou 730 (7:30)"
                          className="h-10"
                        />
                        {totalHours > 0 && (
                          <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Equivale a:</span>
                            <span className="font-semibold text-blue-600">
                              {formatTimeToDisplay(totalHours)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        <p><strong>Dicas:</strong></p>
                        <p>• Digite "8" para 8:00 horas</p>
                        <p>• Digite "730" para 7:30 horas</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="projetos" className="space-y-4 mt-6">
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <FolderOpen className="h-4 w-4 text-blue-600" />
                    <span>Distribuição por Projeto</span>
                  </CardTitle>
                  <Button onClick={addTimeEntry} size="sm" className="bg-blue-600 hover:bg-blue-700 h-8 px-3">
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {totalHours > 0 && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-amber-800 dark:text-amber-200">
                          Total: <strong>{formatTimeToDisplay(totalHours)}</strong>
                        </span>
                        <span className="text-amber-800 dark:text-amber-200">
                          Restante: <strong>{formatTimeToDisplay(Math.max(0, remainingHours))}</strong>
                        </span>
                      </div>
                      {remainingHours < 0 && (
                        <p className="text-red-600 text-xs mt-1">
                          ⚠️ Distribuído {formatTimeToDisplay(Math.abs(remainingHours))} a mais
                        </p>
                      )}
                    </div>
                  )}

                  {timeEntries.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-slate-800 rounded">
                      <FolderOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                        Nenhuma distribuição de horas
                      </p>
                      <p className="text-gray-500 dark:text-gray-500 text-xs">
                        Clique em "Adicionar" para começar
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {timeEntries.map((entry, index) => (
                        <Card key={entry.id} className="bg-gray-50 dark:bg-slate-800 border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                Projeto #{index + 1}
                              </h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => confirmRemoveTimeEntry(entry.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 h-6 w-6 p-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4">
                              <div className="space-y-1">
                                <Label className="text-sm font-medium">Projeto *</Label>
                                <Select value={entry.projeto} onValueChange={(value) => updateTimeEntry(entry.id, 'projeto', value)}>
                                  <SelectTrigger className="h-9">
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

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-sm font-medium">Etapa</Label>
                                  <Select 
                                    value={entry.etapa} 
                                    onValueChange={(value) => updateTimeEntry(entry.id, 'etapa', value)}
                                    disabled={!entry.projeto}
                                  >
                                    <SelectTrigger className="h-9">
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

                                <div className="space-y-1">
                                  <Label className="text-sm font-medium">Tarefa</Label>
                                  <Select 
                                    value={entry.tarefa} 
                                    onValueChange={(value) => updateTimeEntry(entry.id, 'tarefa', value)}
                                    disabled={!entry.etapa}
                                  >
                                    <SelectTrigger className="h-9">
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

                              <div className="space-y-1">
                                <Label className="text-sm font-medium">Horas Trabalhadas *</Label>
                                <Input
                                  value={entry.horasInput}
                                  onChange={(e) => updateTimeEntry(entry.id, 'horasInput', e.target.value)}
                                  placeholder="Ex: 2 ou 130 (1:30)"
                                  className="h-9"
                                />
                                {entry.horas > 0 && (
                                  <div className="flex items-center justify-between p-1 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                                    <span className="text-gray-600 dark:text-gray-400">Equivale a:</span>
                                    <span className="font-semibold text-blue-600">
                                      {formatTimeToDisplay(entry.horas)}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-1">
                                <Label className="text-sm font-medium">Descrição</Label>
                                <Textarea
                                  value={entry.descricao}
                                  onChange={(e) => updateTimeEntry(entry.id, 'descricao', e.target.value)}
                                  placeholder="Descreva as atividades..."
                                  className="min-h-[60px] resize-none text-sm"
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
                      <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded">
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Distribuído:</span>
                            <span className="font-semibold">{formatTimeToDisplay(getTotalDistributedHours())}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Total:</span>
                            <span className="font-semibold">{formatTimeToDisplay(totalHours)}</span>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-bold ${
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
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button variant="outline" onClick={onClose} className="h-9 px-4">
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveHoursMutation.isPending || totalHours <= 0}
              className="bg-blue-600 hover:bg-blue-700 h-9 px-4"
            >
              {saveHoursMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                'Salvar Horas'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Confirmation Dialog */}
      <AlertDialog open={showEditConfirmation} onOpenChange={setShowEditConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Editar Horas de Ponto</AlertDialogTitle>
            <AlertDialogDescription>
              Você deseja editar as horas de ponto já registradas para este dia? 
              Esta ação permitirá que você altere o total de horas trabalhadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEditPointHours}>
              Sim, Editar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Distribuição</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja excluir esta distribuição de horas? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={removeTimeEntry}
              className="bg-red-600 hover:bg-red-700"
            >
              Sim, Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
