
-- Primeiro, vamos remover todas as políticas existentes e recriá-las de forma mais simples
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;

DROP POLICY IF EXISTS "projects_select_all" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_authenticated" ON public.projects;
DROP POLICY IF EXISTS "projects_update_authenticated" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_authenticated" ON public.projects;

DROP POLICY IF EXISTS "stages_select_all" ON public.stages;
DROP POLICY IF EXISTS "stages_insert_authenticated" ON public.stages;
DROP POLICY IF EXISTS "stages_update_authenticated" ON public.stages;
DROP POLICY IF EXISTS "stages_delete_authenticated" ON public.stages;

DROP POLICY IF EXISTS "tasks_select_all" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_authenticated" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_authenticated" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_authenticated" ON public.tasks;

DROP POLICY IF EXISTS "records_select_own_or_manager" ON public.records;
DROP POLICY IF EXISTS "records_insert_own" ON public.records;
DROP POLICY IF EXISTS "records_update_own" ON public.records;
DROP POLICY IF EXISTS "records_delete_own" ON public.records;

DROP POLICY IF EXISTS "horasponto_select_own" ON public.horasponto;
DROP POLICY IF EXISTS "horasponto_insert_own" ON public.horasponto;
DROP POLICY IF EXISTS "horasponto_update_own" ON public.horasponto;
DROP POLICY IF EXISTS "horasponto_delete_own" ON public.horasponto;

-- Criar políticas mais simples e funcionais

-- Políticas para profiles - todos usuários autenticados podem ver e editar
CREATE POLICY "authenticated_users_profiles" ON public.profiles
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Políticas para projects - todos usuários autenticados podem acessar
CREATE POLICY "authenticated_users_projects" ON public.projects
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Políticas para stages - todos usuários autenticados podem acessar
CREATE POLICY "authenticated_users_stages" ON public.stages
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Políticas para tasks - todos usuários autenticados podem acessar
CREATE POLICY "authenticated_users_tasks" ON public.tasks
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Políticas para records - usuários só podem ver/editar seus próprios registros
CREATE POLICY "users_own_records" ON public.records
FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Políticas para horasponto - usuários só podem ver/editar seus próprios registros
CREATE POLICY "users_own_horasponto" ON public.horasponto
FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Garantir que o usuário atual tenha um perfil
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', raw_user_meta_data->>'full_name', email),
  'colaborador'
FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
