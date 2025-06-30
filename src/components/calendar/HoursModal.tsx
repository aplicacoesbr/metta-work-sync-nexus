
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

export const HoursModal = ({ date, isOpen, onClose }: HoursModalProps) => {
  const [totalHours, setTotalHours] = useState<number>(0);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const { toast } = useToast();

  // Mock data for projects, stages, and tasks
  const mockProjects = [
    { id: '1', name: 'Projeto Alpha' },
    { id: '2', name: 'Projeto Beta' },
    { id: '3', name: 'Projeto Gamma' },
  ];

  const mockStages = [
    { id: '1', name: 'Planejamento', projectId: '1' },
    { id: '2', name: 'Desenvolvimento', projectId: '1' },
    { id: '3', name: 'Testes', projectId: '1' },
  ];

  const mockTasks = [
    { id: '1', name: 'Análise de Requisitos', stageId: '1' },
    { id: '2', name: 'Documentação', stageId: '1' },
    { id: '3', name: 'Codificação', stageId: '2' },
  ];

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
    // Here you would save to Supabase
    toast({
      title: "Horas salvas com sucesso!",
      description: `Registrado ${getTotalDistributedHours()}h de ${totalHours}h para ${date ? format(date, 'dd/MM/yyyy') : ''}`,
    });
    onClose();
  };

  const isDataComplete = totalHours > 0 && getTotalDistributedHours() === totalHours;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-400" />
            <span>
              Horas Trabalhadas - {date ? format(date, 'dd \'de\' MMMM \'de\' yyyy', { locale: ptBR }) : ''}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Total Hours Input */}
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader>
              <CardTitle className="text-lg">Total de Horas Trabalhadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Label htmlFor="totalHours" className="text-gray-300">Horas Totais</Label>
                  <Input
                    id="totalHours"
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={totalHours}
                    onChange={(e) => setTotalHours(parseFloat(e.target.value) || 0)}
                    className="bg-slate-600 border-slate-500 text-white"
                    placeholder="8.0"
                  />
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Distribuído</div>
                  <div className={`text-lg font-bold ${getTotalDistributedHours() === totalHours ? 'text-green-400' : 'text-red-400'}`}>
                    {getTotalDistributedHours()}h
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Entries */}
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Distribuição por Projeto</CardTitle>
              <Button
                onClick={addTimeEntry}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {timeEntries.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  Nenhuma distribuição de horas adicionada.
                  <br />
                  Clique em "Adicionar" para começar.
                </div>
              ) : (
                timeEntries.map((entry, index) => (
                  <div key={entry.id} className="space-y-4 p-4 bg-slate-600 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Entrada #{index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTimeEntry(entry.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-gray-300">Projeto</Label>
                        <Select onValueChange={(value) => updateTimeEntry(entry.id, 'projeto', value)}>
                          <SelectTrigger className="bg-slate-500 border-slate-400">
                            <SelectValue placeholder="Selecionar projeto" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-600 border-slate-500">
                            {mockProjects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-gray-300">Etapa</Label>
                        <Select onValueChange={(value) => updateTimeEntry(entry.id, 'etapa', value)}>
                          <SelectTrigger className="bg-slate-500 border-slate-400">
                            <SelectValue placeholder="Selecionar etapa" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-600 border-slate-500">
                            {mockStages.map((stage) => (
                              <SelectItem key={stage.id} value={stage.id}>
                                {stage.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-gray-300">Tarefa</Label>
                        <Select onValueChange={(value) => updateTimeEntry(entry.id, 'tarefa', value)}>
                          <SelectTrigger className="bg-slate-500 border-slate-400">
                            <SelectValue placeholder="Selecionar tarefa" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-600 border-slate-500">
                            {mockTasks.map((task) => (
                              <SelectItem key={task.id} value={task.id}>
                                {task.name}
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
                          value={entry.horas}
                          onChange={(e) => updateTimeEntry(entry.id, 'horas', parseFloat(e.target.value) || 0)}
                          className="bg-slate-500 border-slate-400 text-white"
                          placeholder="0.0"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}

              {timeEntries.length > 0 && (
                <>
                  <Separator className="bg-slate-600" />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">
                      Diferença: {(totalHours - getTotalDistributedHours()).toFixed(1)}h
                    </span>
                    <span className={`font-bold ${isDataComplete ? 'text-green-400' : 'text-red-400'}`}>
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
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Salvar Horas
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
