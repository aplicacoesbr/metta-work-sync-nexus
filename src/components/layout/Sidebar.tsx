
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Calendar, 
  FolderOpen, 
  Users, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Calendário', href: '/dashboard', icon: Calendar },
  { name: 'Projetos', href: '/projetos', icon: FolderOpen },
  { name: 'Usuários', href: '/usuarios', icon: Users },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className={cn(
      "bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700 transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <Clock className="h-6 w-6 text-blue-400" />
              <span className="text-xl font-bold text-white">
                Work<span className="text-blue-400">Sync</span>
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-400 hover:text-white"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg" 
                    : "text-gray-300 hover:bg-slate-700 hover:text-white",
                  collapsed && "justify-center"
                )}
              >
                <item.icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
                {!collapsed && item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
