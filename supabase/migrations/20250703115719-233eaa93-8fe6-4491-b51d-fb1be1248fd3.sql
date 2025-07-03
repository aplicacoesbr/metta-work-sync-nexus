
-- Desabilitar RLS temporariamente para debug
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projetos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.etapas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.horasponto DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Anyone can view projects" ON public.projetos;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projetos;
DROP POLICY IF EXISTS "Admins and project creators can update projects" ON public.projetos;
DROP POLICY IF EXISTS "Admins can delete projects" ON public.projetos;

DROP POLICY IF EXISTS "Anyone can view stages" ON public.etapas;
DROP POLICY IF EXISTS "Authenticated users can create stages" ON public.etapas;
DROP POLICY IF EXISTS "Stage creators and admins can update stages" ON public.etapas;
DROP POLICY IF EXISTS "Stage creators and admins can delete stages" ON public.etapas;

DROP POLICY IF EXISTS "Anyone can view tasks" ON public.tarefas;
DROP POLICY IF EXISTS "Authenticated users can create tasks" ON public.tarefas;
DROP POLICY IF EXISTS "Task creators and admins can update tasks" ON public.tarefas;
DROP POLICY IF EXISTS "Task creators and admins can delete tasks" ON public.tarefas;

DROP POLICY IF EXISTS "Users can view their own records" ON public.registros;
DROP POLICY IF EXISTS "Users can create their own records" ON public.registros;
DROP POLICY IF EXISTS "Users can update their own records" ON public.registros;
DROP POLICY IF EXISTS "Users can delete their own records" ON public.registros;

DROP POLICY IF EXISTS "Users can view their own hours" ON public.horasponto;
DROP POLICY IF EXISTS "Users can create their own hours" ON public.horasponto;
DROP POLICY IF EXISTS "Users can update their own hours" ON public.horasponto;
DROP POLICY IF EXISTS "Users can delete their own hours" ON public.horasponto;

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can create profiles" ON public.profiles;

-- Garantir que o perfil do aplicacoes existe
INSERT INTO public.profiles (id, email, nome_completo, role)
SELECT 
  u.id,
  'aplicacoes@mettabr.com',
  'Aplicações',
  'administrador'
FROM auth.users u
WHERE u.email = 'aplicacoes@mettabr.com'
AND NOT EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE email = 'aplicacoes@mettabr.com'
);

-- Atualizar role se já existir
UPDATE public.profiles 
SET role = 'administrador' 
WHERE email = 'aplicacoes@mettabr.com';

-- Reabilitar RLS com políticas simples
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horasponto ENABLE ROW LEVEL SECURITY;

-- Políticas simples para PROFILES
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE TO authenticated USING (true);

-- Políticas simples para PROJETOS
CREATE POLICY "projetos_select_policy" ON public.projetos
FOR SELECT TO authenticated USING (true);

CREATE POLICY "projetos_insert_policy" ON public.projetos
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "projetos_update_policy" ON public.projetos
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "projetos_delete_policy" ON public.projetos
FOR DELETE TO authenticated USING (true);

-- Políticas simples para ETAPAS
CREATE POLICY "etapas_select_policy" ON public.etapas
FOR SELECT TO authenticated USING (true);

CREATE POLICY "etapas_insert_policy" ON public.etapas
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "etapas_update_policy" ON public.etapas
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "etapas_delete_policy" ON public.etapas
FOR DELETE TO authenticated USING (true);

-- Políticas simples para TAREFAS
CREATE POLICY "tarefas_select_policy" ON public.tarefas
FOR SELECT TO authenticated USING (true);

CREATE POLICY "tarefas_insert_policy" ON public.tarefas
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "tarefas_update_policy" ON public.tarefas
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "tarefas_delete_policy" ON public.tarefas
FOR DELETE TO authenticated USING (true);

-- Políticas simples para REGISTROS
CREATE POLICY "registros_select_policy" ON public.registros
FOR SELECT TO authenticated USING (true);

CREATE POLICY "registros_insert_policy" ON public.registros
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "registros_update_policy" ON public.registros
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "registros_delete_policy" ON public.registros
FOR DELETE TO authenticated USING (true);

-- Políticas simples para HORASPONTO
CREATE POLICY "horasponto_select_policy" ON public.horasponto
FOR SELECT TO authenticated USING (true);

CREATE POLICY "horasponto_insert_policy" ON public.horasponto
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "horasponto_update_policy" ON public.horasponto
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "horasponto_delete_policy" ON public.horasponto
FOR DELETE TO authenticated USING (true);
