
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Home, 
  Calendar, 
  FolderOpen, 
  Users, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserPermissions } from '@/hooks/useUserPermissions';

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { isManagerOrAdmin, isAdmin, isLoading } = useUserPermissions();

  const navigationItems = [
    {
      title: 'Dashboard',
      href: '/',
      icon: Home,
      show: true,
    },
    {
      title: 'Calendário',
      href: '/calendar',
      icon: Calendar,
      show: true,
    },
    {
      title: 'Projetos',
      href: '/projects',
      icon: FolderOpen,
      show: true,
    },
    {
      title: 'Relatórios',
      href: '/reports',
      icon: BarChart3,
      show: isManagerOrAdmin,
    },
    {
      title: 'Usuários',
      href: '/users',
      icon: Users,
      show: isAdmin,
    },
    {
      title: 'Configurações',
      href: '/settings',
      icon: Settings,
      show: isAdmin,
    },
  ];

  // Filter items based on permissions
  const visibleItems = navigationItems.filter(item => item.show);

  if (isLoading) {
    return (
      <div className={cn(
        "bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <div className="p-4">
          <div className="animate-pulse bg-gray-200 h-8 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        {!isCollapsed && (
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Metta Sync
          </h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-100 text-blue-900 dark:bg-blue-900/50 dark:text-blue-100"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span>{item.title}</span>}
              </NavLink>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
};
