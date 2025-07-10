
-- Atualizar o usuário aplicacao@mettabr.com para ser administrador
UPDATE public.profiles 
SET role = 'administrador' 
WHERE email = 'aplicacao@mettabr.com';
