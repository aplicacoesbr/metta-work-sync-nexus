
-- Primeiro, vamos tornar a conta aplicacoes@mettabr.com um administrador
UPDATE public.profiles 
SET role = 'administrador' 
WHERE email = 'aplicacoes@mettabr.com';

-- Se o perfil não existir ainda, vamos criá-lo (caso o usuário ainda não tenha feito login)
INSERT INTO public.profiles (id, email, nome_completo, role)
SELECT 
  auth.users.id,
  'aplicacoes@mettabr.com',
  'Aplicações',
  'administrador'
FROM auth.users 
WHERE auth.users.email = 'aplicacoes@mettabr.com'
AND NOT EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE email = 'aplicacoes@mettabr.com'
);

-- Vamos simplificar as políticas RLS para projetos - permitir operações básicas
DROP POLICY IF EXISTS "Users can view all projects" ON public.projetos;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projetos;
DROP POLICY IF EXISTS "Project creators and admins can update projects" ON public.projetos;
DROP POLICY IF EXISTS "Users can view projects they created or are assigned to" ON public.projetos;
DROP POLICY IF EXISTS "Users can create projects" ON public.projetos;
DROP POLICY IF EXISTS "Users can update projects they created" ON public.projetos;

-- Políticas mais simples para projetos
CREATE POLICY "Users can view all projects" ON public.projetos
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can create projects" ON public.projetos
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their projects or admins can update any" ON public.projetos
FOR UPDATE TO authenticated
USING (auth.uid() = created_by OR get_user_role(auth.uid()) = 'administrador');

-- Simplificar políticas para horasponto
DROP POLICY IF EXISTS "Users can view their own horasponto" ON public.horasponto;
DROP POLICY IF EXISTS "Users can create their own horasponto" ON public.horasponto;
DROP POLICY IF EXISTS "Users can update their own horasponto" ON public.horasponto;
DROP POLICY IF EXISTS "Users can delete their own horasponto" ON public.horasponto;
DROP POLICY IF EXISTS "Users can view their own horas ponto" ON public.horasponto;
DROP POLICY IF EXISTS "Users can insert their own horas ponto" ON public.horasponto;
DROP POLICY IF EXISTS "Users can update their own horas ponto" ON public.horasponto;

-- Políticas mais simples para horasponto
CREATE POLICY "Users can manage their own horasponto" ON public.horasponto
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Simplificar políticas para registros
DROP POLICY IF EXISTS "Users can view their own registros" ON public.registros;
DROP POLICY IF EXISTS "Users can create their own registros" ON public.registros;
DROP POLICY IF EXISTS "Users can update their own registros" ON public.registros;
DROP POLICY IF EXISTS "Users can delete their own registros" ON public.registros;
DROP POLICY IF EXISTS "Users can insert their own registros" ON public.registros;

-- Políticas mais simples para registros
CREATE POLICY "Users can manage their own registros" ON public.registros
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
