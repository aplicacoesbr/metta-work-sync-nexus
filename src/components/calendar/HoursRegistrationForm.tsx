import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Trash2, Clock, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface HoursRegistrationFormProps {
  date: Date | null;
  isVisible: boolean;
  onClose: () => void;
  onProjectAdded: () => void;
  startWithProjectsTab?: boolean;
}

interface ProjectRecord {
  id?: string;
  project_id: string;
  project_name?: string;
  stage_id?: string;
  stage_name?: string;
  task_id?: string;
  task_name?: string;
  worked_hours: number;
  description?: string;
  percentage?: number;
}

export const HoursRegistrationForm = ({ 
  date, 
  isVisible, 
  onClose, 
  onProjectAdded,
  startWithProjectsTab = false 
}: HoursRegistrationFormProps) => {
  const [totalHours, setTotalHours] = useState(0);
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [projectRecords, setProjectRecords] = useState<ProjectRecord[]>([]);
  const [activeTab, setActiveTab] = useState(startWithProjectsTab ? 'projects' : 'hours');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: existingData } = useQuery({
    queryKey: ['day-data', date?.toISOString().split('T')[0], user?.id],
    queryFn: async () => {
      if (!date || !user?.id) return null;

      const dateStr = format(date, 'yyyy-MM-dd');
      console.log('Fetching existing data for date:', dateStr, 'user:', user.id);

      try {
        const { data: horaspontoData, error: horaspontoError } = await supabase
          .from('horasponto')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', dateStr)
          .maybeSingle();

        if (horaspontoError && horaspontoError.code !== 'PGRST116') {
          console.error('Error fetching horasponto:', horaspontoError);
          throw horaspontoError;
        }

        const { data: recordsData, error: recordsError } = await supabase
          .from('records')
          .select(`
            *,
            projects!inner(name),
            stages(name),
            tasks(name)
          `)
          .eq('user_id', user.id)
          .eq('date', dateStr);

        if (recordsError) {
          console.error('Error fetching records:', recordsError);
          throw recordsError;
        }

        console.log('Existing data fetched:', { horaspontoData, recordsData });

        return {
          horasponto: horaspontoData,
          records: recordsData || []
        };
      } catch (error) {
        console.error('Error in existingData query:', error);
        throw error;
      }
    },
    enabled: !!date && !!user?.id && isVisible,
    retry: 3,
    retryDelay: 1000,
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      console.log('Fetching projects...');
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'aberto')
        .order('name');
      
      if (error) {
        console.error('Error fetching projects:', error);
        throw error;
      }
      
      console.log('Projects fetched:', data);
      return data;
    },
    retry: 3,
    retryDelay: 1000,
  });

  const { data: stages } = useQuery({
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
      return data;
    },
    retry: 3,
    retryDelay: 1000,
  });

  const { data: tasks } = useQuery({
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
      return data;
    },
    retry: 3,
    retryDelay: 1000,
  });

  useEffect(() => {
    if (existingData) {
      setTotalHours(existingData.horasponto?.total_hours || 0);
      setIsEditingHours(false);
      
      if (existingData.records.length > 0) {
        const mappedRecords = existingData.records.map(record => ({
          id: record.id,
          project_id: record.project_id || '',
          project_name: record.projects?.name || '',
          stage_id: record.stage_id || '',
          stage_name: record.stages?.name || '',
          task_id: record.task_id || '',
          task_name: record.tasks?.name || '',
          worked_hours: Number(record.worked_hours),
          description: record.description || '',
          percentage: Number(record.percentage) || 0,
        }));
        setProjectRecords(mappedRecords);
        setActiveTab('projects');
      }
    } else {
      setTotalHours(0);
      setProjectRecords([]);
      setIsEditingHours(false);
    }
  }, [existingData]);

  const saveHoursMutation = useMutation({
    mutationFn: async (hours: number) => {
      if (!date || !user?.id) throw new Error('Missing date or user');

      const dateStr = format(date, 'yyyy-MM-dd');
      console.log('Saving hours:', hours, 'for date:', dateStr);
      
      const { error } = await supabase
        .from('horasponto')
        .upsert({
          user_id: user.id,
          date: dateStr,
          total_hours: hours,
        });

      if (error) {
        console.error('Error saving hours:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Horas registradas com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['day-data'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-data'] });
      setIsEditingHours(false);
      onProjectAdded();
    },
    onError: (error) => {
      console.error('Error in saveHoursMutation:', error);
      toast.error('Erro ao registrar horas');
    },
  });

  const saveProjectsMutation = useMutation({
    mutationFn: async (records: ProjectRecord[]) => {
      if (!date || !user?.id) throw new Error('Missing date or user');

      const dateStr = format(date, 'yyyy-MM-dd');
      console.log('Saving projects for date:', dateStr, 'records:', records);

      await supabase
        .from('records')
        .delete()
        .eq('user_id', user.id)
        .eq('date', dateStr);

      const recordsToInsert = records.map(record => ({
        user_id: user.id,
        date: dateStr,
        project_id: record.project_id || null,
        stage_id: record.stage_id || null,
        task_id: record.task_id || null,
        worked_hours: record.worked_hours,
        description: record.description || null,
        percentage: record.percentage || null,
      }));

      const { error } = await supabase
        .from('records')
        .insert(recordsToInsert);

      if (error) {
        console.error('Error saving projects:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Projetos salvos com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['day-data'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-data'] });
      onProjectAdded();
    },
    onError: (error) => {
      console.error('Error in saveProjectsMutation:', error);
      toast.error('Erro ao salvar projetos');
    },
  });

  const handleSaveHours = () => {
    saveHoursMutation.mutate(totalHours);
  };

  const handleSaveProjects = () => {
    if (projectRecords.length === 0) {
      toast.error('Adicione pelo menos um projeto');
      return;
    }

    const totalDistributedHours = projectRecords.reduce((sum, record) => sum + record.worked_hours, 0);
    
    if (totalDistributedHours === 0 && totalHours > 0) {
      const hoursPerProject = totalHours / projectRecords.length;
      const updatedRecords = projectRecords.map(record => ({
        ...record,
        worked_hours: hoursPerProject,
      }));
      setProjectRecords(updatedRecords);
      saveProjectsMutation.mutate(updatedRecords);
    } else {
      saveProjectsMutation.mutate(projectRecords);
    }
  };

  const addProjectRecord = () => {
    setProjectRecords([...projectRecords, {
      project_id: '',
      worked_hours: 0,
      description: '',
    }]);
  };

  const updateProjectRecord = (index: number, field: keyof ProjectRecord, value: any) => {
    const updated = [...projectRecords];
    updated[index] = { ...updated[index], [field]: value };
    setProjectRecords(updated);
  };

  const removeProjectRecord = (index: number) => {
    setProjectRecords(projectRecords.filter((_, i) => i !== index));
  };

  if (!isVisible || !date) return null;

  const hasExistingHours = existingData?.horasponto?.total_hours > 0;

  return (
    <div className="w-[450px]">
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold text-white">
            {format(date, "d 'de' MMMM, yyyy", { locale: ptBR })}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-700">
              <TabsTrigger value="hours" className="text-white data-[state=active]:bg-blue-600">
                Ponto
              </TabsTrigger>
              <TabsTrigger value="projects" className="text-white data-[state=active]:bg-blue-600">
                Projetos
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="hours" className="space-y-4">
              {hasExistingHours && !isEditingHours ? (
                <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-400" />
                    <span className="text-white font-medium">
                      {existingData.horasponto.total_hours}h registradas
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingHours(true)}
                    className="p-2 text-gray-400 hover:text-white"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="totalHours" className="text-gray-300">
                      Total de Horas
                    </Label>
                    <Input
                      id="totalHours"
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      value={totalHours}
                      onChange={(e) => setTotalHours(Number(e.target.value))}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="8.0"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleSaveHours}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      disabled={saveHoursMutation.isPending}
                    >
                      {saveHoursMutation.isPending ? 'Salvando...' : 'Salvar Horas'}
                    </Button>
                    {isEditingHours && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditingHours(false);
                          setTotalHours(existingData?.horasponto?.total_hours || 0);
                        }}
                        className="border-slate-600 text-gray-300 hover:bg-slate-700"
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="projects" className="space-y-4">
              {!hasExistingHours && (
                <div className="p-3 bg-yellow-900/50 border border-yellow-600 rounded-lg">
                  <p className="text-yellow-200 text-sm">
                    ⚠️ Registre primeiro as horas do ponto para distribuir entre projetos.
                  </p>
                </div>
              )}
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {projectRecords.map((record, index) => (
                  <div key={index} className="p-4 bg-slate-700 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-white font-medium">Projeto {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProjectRecord(index)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-gray-300">Projeto</Label>
                        <Select
                          value={record.project_id}
                          onValueChange={(value) => {
                            const project = projects?.find(p => p.id === value);
                            updateProjectRecord(index, 'project_id', value);
                            updateProjectRecord(index, 'project_name', project?.name || '');
                          }}
                        >
                          <SelectTrigger className="bg-slate-600 border-slate-500 text-white">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {projects?.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-gray-300">Horas</Label>
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          value={record.worked_hours}
                          onChange={(e) => updateProjectRecord(index, 'worked_hours', Number(e.target.value))}
                          className="bg-slate-600 border-slate-500 text-white"
                          placeholder="0.0"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-300">Descrição (opcional)</Label>
                      <Input
                        value={record.description || ''}
                        onChange={(e) => updateProjectRecord(index, 'description', e.target.value)}
                        className="bg-slate-600 border-slate-500 text-white"
                        placeholder="Descreva o trabalho realizado..."
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <Button
                  onClick={addProjectRecord}
                  variant="outline"
                  className="w-full border-slate-600 text-gray-300 hover:bg-slate-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Projeto
                </Button>

                {projectRecords.length > 0 && (
                  <Button 
                    onClick={handleSaveProjects}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={saveProjectsMutation.isPending}
                  >
                    {saveProjectsMutation.isPending ? 'Salvando...' : 'Salvar Projetos'}
                  </Button>
                )}
              </div>

              {totalHours > 0 && projectRecords.length > 0 && (
                <div className="p-3 bg-slate-700 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Total disponível:</span>
                    <span className="text-white">{totalHours}h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Total distribuído:</span>
                    <span className="text-white">
                      {projectRecords.reduce((sum, record) => sum + record.worked_hours, 0)}h
                    </span>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
