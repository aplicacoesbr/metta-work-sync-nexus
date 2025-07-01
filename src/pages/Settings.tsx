
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, Bell, Shield, Database, Palette } from 'lucide-react';

const Settings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configurações</h1>
        <p className="text-gray-600 dark:text-gray-400">Gerencie as configurações do sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card className="corporate-card dark:corporate-card-dark">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center space-x-2">
              <SettingsIcon className="h-5 w-5 text-blue-600" />
              <span>Configurações Gerais</span>
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Configurações básicas do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-gray-900 dark:text-white">Modo Escuro</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Interface em tema escuro</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="bg-gray-200 dark:bg-slate-600" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-gray-900 dark:text-white">Auto-save</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Salvar automaticamente as alterações</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="bg-gray-200 dark:bg-slate-600" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-gray-900 dark:text-white">Compactação de dados</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Otimizar uso de dados</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="corporate-card dark:corporate-card-dark">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center space-x-2">
              <Bell className="h-5 w-5 text-green-600" />
              <span>Notificações</span>
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Configure suas preferências de notificação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-gray-900 dark:text-white">Email de lembretes</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Receber lembretes por email</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="bg-gray-200 dark:bg-slate-600" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-gray-900 dark:text-white">Notificações push</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Alertas no navegador</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="bg-gray-200 dark:bg-slate-600" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-gray-900 dark:text-white">Relatórios semanais</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Resumo semanal por email</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="corporate-card dark:corporate-card-dark">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center space-x-2">
              <Shield className="h-5 w-5 text-red-600" />
              <span>Segurança</span>
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Configurações de segurança e privacidade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-gray-900 dark:text-white">Autenticação de dois fatores</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Segurança adicional para login</p>
              </div>
              <Switch />
            </div>
            <Separator className="bg-gray-200 dark:bg-slate-600" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-gray-900 dark:text-white">Logout automático</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sair após inatividade</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="bg-gray-200 dark:bg-slate-600" />
            <Button variant="outline" className="w-full border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700">
              Alterar Senha
            </Button>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="corporate-card dark:corporate-card-dark">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center space-x-2">
              <Database className="h-5 w-5 text-purple-600" />
              <span>Dados</span>
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Gerenciamento e backup de dados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button variant="outline" className="w-full border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700">
                Exportar Dados
              </Button>
              <Button variant="outline" className="w-full border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700">
                Fazer Backup
              </Button>
              <Button variant="destructive" className="w-full">
                Limpar Cache
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
