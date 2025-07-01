
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
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Calendar },
  { name: 'Projetos', href: '/projetos', icon: FolderOpen },
  { name: 'Usuários', href: '/usuarios', icon: Users },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className={cn(
      "bg-slate-900 border-r border-slate-700 transition-all duration-300 flex flex-col",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-blue-500" />
            <div>
              <span className="text-xl font-bold text-white">
                Work<span className="text-blue-500">Sync</span>
              </span>
              <p className="text-xs text-gray-400 mt-0.5">Corporate System</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-white hover:bg-slate-800"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25" 
                  : "text-gray-300 hover:bg-slate-800 hover:text-white",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-700">
        <div className={cn(
          "text-xs text-gray-500 text-center",
          collapsed ? "px-1" : "px-3"
        )}>
          {collapsed ? "WS" : "WorkSync v1.0"}
        </div>
      </div>
    </div>
  );
};
