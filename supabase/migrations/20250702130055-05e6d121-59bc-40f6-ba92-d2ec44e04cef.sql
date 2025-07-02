
-- Primeiro, garantir que a conta aplicacoes@mettabr.com seja administrador
UPDATE public.profiles 
SET role = 'administrador' 
WHERE email = 'aplicacoes@mettabr.com';

-- Se o perfil não existir, criar um (caso o usuário ainda não tenha feito login)
INSERT INTO public.profiles (id, email, nome_completo, role)
SELECT 
  gen_random_uuid(),
  'aplicacoes@mettabr.com',
  'Aplicações',
  'administrador'
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE email = 'aplicacoes@mettabr.com'
);

-- Remover todas as políticas existentes e criar políticas mais específicas
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.projetos;
DROP POLICY IF EXISTS "Enable all operations for authenticated users on etapas" ON public.etapas;
DROP POLICY IF EXISTS "Enable all operations for authenticated users on tarefas" ON public.tarefas;
DROP POLICY IF EXISTS "Enable all operations for authenticated users on registros" ON public.registros;
DROP POLICY IF EXISTS "Enable all operations for authenticated users on horasponto" ON public.horasponto;
DROP POLICY IF EXISTS "Enable all operations for authenticated users on profiles" ON public.profiles;

-- Políticas para PROJETOS
CREATE POLICY "Anyone can view projects" ON public.projetos
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create projects" ON public.projetos
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins and project creators can update projects" ON public.projetos
FOR UPDATE TO authenticated
USING (
  auth.uid() = created_by OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'administrador')
);

CREATE POLICY "Admins can delete projects" ON public.projetos
FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'administrador')
);

-- Políticas para ETAPAS
CREATE POLICY "Anyone can view stages" ON public.etapas
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create stages" ON public.etapas
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Stage creators and admins can update stages" ON public.etapas
FOR UPDATE TO authenticated
USING (
  auth.uid() = created_by OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'administrador')
);

CREATE POLICY "Stage creators and admins can delete stages" ON public.etapas
FOR DELETE TO authenticated
USING (
  auth.uid() = created_by OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'administrador')
);

-- Políticas para TAREFAS
CREATE POLICY "Anyone can view tasks" ON public.tarefas
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create tasks" ON public.tarefas
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Task creators and admins can update tasks" ON public.tarefas
FOR UPDATE TO authenticated
USING (
  auth.uid() = created_by OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'administrador')
);

CREATE POLICY "Task creators and admins can delete tasks" ON public.tarefas
FOR DELETE TO authenticated
USING (
  auth.uid() = created_by OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'administrador')
);

-- Políticas para REGISTROS
CREATE POLICY "Users can view their own records" ON public.registros
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own records" ON public.registros
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own records" ON public.registros
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own records" ON public.registros
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Políticas para HORASPONTO
CREATE POLICY "Users can view their own hours" ON public.horasponto
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own hours" ON public.horasponto
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hours" ON public.horasponto
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hours" ON public.horasponto
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Políticas para PROFILES
CREATE POLICY "Users can view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile" ON public.profiles
FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'administrador')
);

CREATE POLICY "Admins can create profiles" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'administrador')
);
