
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useUserPermissions = () => {
  const { user } = useAuth();

  const { data: userRole, isLoading } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data?.role || 'colaborador';
    },
    enabled: !!user?.id,
  });

  const isAdmin = userRole === 'administrador';
  const isManagerOrAdmin = userRole === 'gestor' || userRole === 'administrador';
  const isCollaborator = userRole === 'colaborador';

  return {
    userRole,
    isAdmin,
    isManagerOrAdmin,
    isCollaborator,
    isLoading,
  };
};
