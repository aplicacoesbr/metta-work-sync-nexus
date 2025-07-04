
-- Desabilitar RLS temporariamente para limpeza
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.horasponto DISABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "authenticated_users_profiles" ON public.profiles;
DROP POLICY IF EXISTS "authenticated_users_projects" ON public.projects;
DROP POLICY IF EXISTS "authenticated_users_stages" ON public.stages;
DROP POLICY IF EXISTS "authenticated_users_tasks" ON public.tasks;
DROP POLICY IF EXISTS "users_own_records" ON public.records;
DROP POLICY IF EXISTS "users_own_horasponto" ON public.horasponto;

-- Recriar políticas com nomes únicos e estrutura mais simples
CREATE POLICY "allow_authenticated_profiles_access" ON public.profiles
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_authenticated_projects_access" ON public.projects
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_authenticated_stages_access" ON public.stages
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_authenticated_tasks_access" ON public.tasks
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_user_own_records_access" ON public.records
FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_user_own_horasponto_access" ON public.horasponto
FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Reabilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horasponto ENABLE ROW LEVEL SECURITY;

-- Garantir que existe um perfil para o usuário atual
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  auth.uid(),
  auth.email(),
  COALESCE(
    (auth.jwt()->>'user_metadata'->>'name'),
    (auth.jwt()->>'user_metadata'->>'full_name'),
    auth.email()
  ),
  'colaborador'
WHERE auth.uid() IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = now();

-- Verificar se as políticas foram criadas corretamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
