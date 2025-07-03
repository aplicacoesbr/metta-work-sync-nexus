
-- Corrigir políticas para a tabela profiles
DROP POLICY IF EXISTS "Usuarios veem seus perfis" ON public.profiles;
DROP POLICY IF EXISTS "Admin atualiza perfis" ON public.profiles;

-- Políticas mais simples para profiles
CREATE POLICY "profiles_select_all" ON public.profiles
FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own_or_admin" ON public.profiles
FOR UPDATE TO authenticated 
USING (auth.uid() = id OR EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'administrador'
));

-- Corrigir políticas para records - permitir acesso mais amplo
DROP POLICY IF EXISTS "Usuarios inserem seus registros" ON public.records;
DROP POLICY IF EXISTS "Usuarios atualizam seus registros" ON public.records;
DROP POLICY IF EXISTS "Usuarios acessam seus registros ou gestores/admins veem todos" ON public.records;

CREATE POLICY "records_select_own_or_manager" ON public.records
FOR SELECT TO authenticated 
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role IN ('gestor', 'administrador')
));

CREATE POLICY "records_insert_own" ON public.records
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "records_update_own" ON public.records
FOR UPDATE TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "records_delete_own" ON public.records
FOR DELETE TO authenticated 
USING (auth.uid() = user_id);

-- Corrigir políticas para horasponto
DROP POLICY IF EXISTS "Usuarios acessam suas horasponto" ON public.horasponto;
DROP POLICY IF EXISTS "Usuarios inserem suas horasponto" ON public.horasponto;
DROP POLICY IF EXISTS "Usuarios atualizam suas horasponto" ON public.horasponto;

CREATE POLICY "horasponto_select_own" ON public.horasponto
FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "horasponto_insert_own" ON public.horasponto
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "horasponto_update_own" ON public.horasponto
FOR UPDATE TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "horasponto_delete_own" ON public.horasponto
FOR DELETE TO authenticated 
USING (auth.uid() = user_id);

-- Simplificar políticas para projetos, etapas e tarefas
DROP POLICY IF EXISTS "Todos podem visualizar projetos" ON public.projects;
DROP POLICY IF EXISTS "Gestores e admins podem gerenciar projetos" ON public.projects;

CREATE POLICY "projects_select_all" ON public.projects
FOR SELECT TO authenticated USING (true);

CREATE POLICY "projects_insert_authenticated" ON public.projects
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "projects_update_authenticated" ON public.projects
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "projects_delete_authenticated" ON public.projects
FOR DELETE TO authenticated USING (true);

-- Políticas similares para stages
DROP POLICY IF EXISTS "Todos podem visualizar etapas" ON public.stages;
DROP POLICY IF EXISTS "Gestores e admins podem gerenciar etapas" ON public.stages;

CREATE POLICY "stages_select_all" ON public.stages
FOR SELECT TO authenticated USING (true);

CREATE POLICY "stages_insert_authenticated" ON public.stages
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "stages_update_authenticated" ON public.stages
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "stages_delete_authenticated" ON public.stages
FOR DELETE TO authenticated USING (true);

-- Políticas similares para tasks
DROP POLICY IF EXISTS "Todos podem visualizar tarefas" ON public.tasks;
DROP POLICY IF EXISTS "Gestores e admins podem gerenciar tarefas" ON public.tasks;

CREATE POLICY "tasks_select_all" ON public.tasks
FOR SELECT TO authenticated USING (true);

CREATE POLICY "tasks_insert_authenticated" ON public.tasks
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "tasks_update_authenticated" ON public.tasks
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "tasks_delete_authenticated" ON public.tasks
FOR DELETE TO authenticated USING (true);
