
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, loading, signInWithAzure } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Usuário já autenticado - redireciona para dashboard
        navigate('/dashboard', { replace: true });
      } else {
        // Usuário não autenticado - inicia redirecionamento automático para Azure
        const initiateAzureLogin = async () => {
          const { error } = await signInWithAzure();
          
          if (error) {
            console.error('Erro no redirecionamento Azure:', error);
            // Em caso de erro, redireciona para página de auth manual
            navigate('/auth', { replace: true });
          }
        };

        // Pequeno delay para mostrar a tela de carregamento
        const timer = setTimeout(() => {
          initiateAzureLogin();
        }, 1500);

        return () => clearTimeout(timer);
      }
    }
  }, [user, loading, navigate, signInWithAzure]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Work<span className="text-blue-400">Sync</span>
          </h1>
          <p className="text-xl text-gray-300">
            Gestão de Projetos & Controle de Horas
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-white">Redirecionando para autenticação Microsoft...</p>
          <div className="flex items-center justify-center space-x-2 text-gray-300">
            <span>Aguarde, você será redirecionado automaticamente</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
