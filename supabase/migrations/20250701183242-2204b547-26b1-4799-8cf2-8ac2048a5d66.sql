
-- Remover todas as políticas conflitantes e recriar de forma mais simples
DROP POLICY IF EXISTS "CRUD" ON public.projetos;
DROP POLICY IF EXISTS "Users can view all projects" ON public.projetos;
DROP POLICY IF EXISTS "Users can create projects" ON public.projetos;
DROP POLICY IF EXISTS "Users can update their projects or admins can update any" ON public.projetos;

-- Política única e simples para projetos
CREATE POLICY "Enable all operations for authenticated users" ON public.projetos
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Corrigir políticas para etapas
DROP POLICY IF EXISTS "CRUD" ON public.etapas;
DROP POLICY IF EXISTS "Users can view all etapas" ON public.etapas;
DROP POLICY IF EXISTS "Authenticated users can create etapas" ON public.etapas;
DROP POLICY IF EXISTS "Etapa creators and admins can update etapas" ON public.etapas;
DROP POLICY IF EXISTS "Users can view etapas from accessible projects" ON public.etapas;
DROP POLICY IF EXISTS "Users can create etapas in their projects" ON public.etapas;

CREATE POLICY "Enable all operations for authenticated users on etapas" ON public.etapas
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Corrigir políticas para tarefas
DROP POLICY IF EXISTS "CRUD" ON public.tarefas;
DROP POLICY IF EXISTS "Users can view all tarefas" ON public.tarefas;
DROP POLICY IF EXISTS "Authenticated users can create tarefas" ON public.tarefas;
DROP POLICY IF EXISTS "Tarefa creators and admins can update tarefas" ON public.tarefas;
DROP POLICY IF EXISTS "Users can view tarefas from accessible etapas" ON public.tarefas;
DROP POLICY IF EXISTS "Users can create tarefas in accessible etapas" ON public.tarefas;

CREATE POLICY "Enable all operations for authenticated users on tarefas" ON public.tarefas
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Corrigir políticas para registros
DROP POLICY IF EXISTS "CRUD" ON public.registros;
DROP POLICY IF EXISTS "Users can manage their own registros" ON public.registros;

CREATE POLICY "Enable all operations for authenticated users on registros" ON public.registros
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Corrigir políticas para horasponto
DROP POLICY IF EXISTS "CRUD" ON public.horasponto;
DROP POLICY IF EXISTS "Users can manage their own horasponto" ON public.horasponto;

CREATE POLICY "Enable all operations for authenticated users on horasponto" ON public.horasponto
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Corrigir políticas para profiles
DROP POLICY IF EXISTS "CRUD" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Enable all operations for authenticated users on profiles" ON public.profiles
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);
