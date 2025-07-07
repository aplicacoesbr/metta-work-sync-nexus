
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectAnalysisData {
  project_id: string;
  project_name: string;
  total_hours: number;
  record_count: number;
  last_activity: string;
}

export const ProjectAnalysis = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date>(startOfMonth(new Date()));
  const [dateTo, setDateTo] = useState<Date>(endOfMonth(new Date()));
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useAuth();

  // Fetch projects for filter dropdown
  const { data: projects } = useQuery({
    queryKey: ['projects-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch project analysis data
  const { data: analysisData, isLoading } = useQuery({
    queryKey: ['project-analysis', user?.id, dateFrom, dateTo, selectedProject],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('records')
        .select(`
          project_id,
          worked_hours,
          date,
          projects!inner(name)
        `)
        .eq('user_id', user.id)
        .gte('date', format(dateFrom, 'yyyy-MM-dd'))
        .lte('date', format(dateTo, 'yyyy-MM-dd'));

      if (selectedProject !== 'all') {
        query = query.eq('project_id', selectedProject);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // Group by project and calculate totals
      const grouped = data.reduce((acc: { [key: string]: ProjectAnalysisData }, record) => {
        const projectId = record.project_id;
        const projectName = record.projects?.name || 'Projeto sem nome';
        
        if (!acc[projectId]) {
          acc[projectId] = {
            project_id: projectId,
            project_name: projectName,
            total_hours: 0,
            record_count: 0,
            last_activity: record.date,
          };
        }
        
        acc[projectId].total_hours += Number(record.worked_hours);
        acc[projectId].record_count += 1;
        
        // Update last activity if this record is more recent
        if (record.date > acc[projectId].last_activity) {
          acc[projectId].last_activity = record.date;
        }
        
        return acc;
      }, {});

      return Object.values(grouped).sort((a, b) => b.total_hours - a.total_hours);
    },
    enabled: !!user?.id,
  });

  // Filter data based on search term
  const filteredData = analysisData?.filter(item =>
    item.project_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const totalHours = filteredData.reduce((sum, item) => sum + item.total_hours, 0);

  return (
    <Card className="corporate-card dark:corporate-card-dark">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-gray-900 dark:text-white">Análise de Projetos</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Análise detalhada do tempo dedicado a cada projeto
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="border-gray-300 dark:border-gray-600"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>

        {showFilters && (
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search" className="text-gray-700 dark:text-gray-300">
                  Buscar Projeto
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Nome do projeto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-700 dark:text-gray-300">Projeto Específico</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder="Todos os projetos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os projetos</SelectItem>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-gray-700 dark:text-gray-300">De</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600",
                          !dateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={(date) => date && setDateFrom(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Até</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600",
                          !dateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, "dd/MM/yyyy") : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={(date) => date && setDateTo(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="font-medium text-gray-900 dark:text-white">
                Total de Horas no Período:
              </span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {totalHours.toFixed(1)}h
              </span>
            </div>

            <div className="space-y-3">
              {filteredData.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Nenhum projeto encontrado no período selecionado.
                </div>
              ) : (
                filteredData.map((item) => (
                  <div
                    key={item.project_id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {item.project_name}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>{item.record_count} registros</span>
                        <span>•</span>
                        <span>
                          Última atividade: {format(new Date(item.last_activity), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {item.total_hours.toFixed(1)}h
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {((item.total_hours / totalHours) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
