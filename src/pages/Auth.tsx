
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Clock, Users, BarChart3, Building2 } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoRedirecting, setAutoRedirecting] = useState(true);
  const { signIn, signUp, signInWithAzure, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirecionamento automático para Azure AD
  useEffect(() => {
    if (!user) {
      const timer = setTimeout(async () => {
        setLoading(true);
        const { error } = await signInWithAzure();
        
        if (error) {
          console.error('Erro no redirecionamento Azure:', error);
          setAutoRedirecting(false);
          setLoading(false);
          toast({
            title: "Erro na autenticação automática",
            description: "Use o login manual abaixo ou tente novamente.",
            variant: "destructive",
          });
        }
      }, 2000); // 2 segundos de delay para mostrar a tela de carregamento

      return () => clearTimeout(timer);
    }
  }, [user, signInWithAzure, toast]);

  // Redirecionar usuário logado para dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Login realizado com sucesso!",
        description: "Redirecionando para o painel principal...",
      });
      navigate('/dashboard');
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signUp(email, password, fullName);
    
    if (error) {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Verifique seu email para confirmar a conta.",
      });
    }
    
    setLoading(false);
  };

  const handleRetryAzure = async () => {
    setLoading(true);
    const { error } = await signInWithAzure();
    
    if (error) {
      toast({
        title: "Erro na autenticação Azure",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  // Tela de redirecionamento automático
  if (autoRedirecting && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
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
              <Building2 className="h-5 w-5 text-blue-400" />
              <span>Aguarde, você será redirecionado automaticamente</span>
            </div>
          </div>

          <Button 
            onClick={() => setAutoRedirecting(false)}
            variant="outline"
            className="border-slate-600 text-gray-300 hover:bg-slate-800"
          >
            Usar login manual
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="text-center md:text-left space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Work<span className="text-blue-400">Sync</span>
            </h1>
            <p className="text-xl text-gray-300">
              Gestão de Projetos & Controle de Horas
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-gray-300">
              <Clock className="h-5 w-5 text-blue-400" />
              <span>Controle preciso de horas trabalhadas</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-300">
              <Users className="h-5 w-5 text-blue-400" />
              <span>Gestão completa de equipes</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-300">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              <span>Relatórios e análises detalhadas</span>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-white">Acesse sua conta</CardTitle>
            <CardDescription className="text-gray-400">
              Autenticação Microsoft ou login manual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Azure AD Login Button */}
            <Button 
              onClick={handleRetryAzure}
              className="w-full bg-blue-600 hover:bg-blue-700 flex items-center space-x-2"
              disabled={loading}
            >
              <Building2 className="h-4 w-4" />
              <span>{loading ? 'Conectando...' : 'Entrar com Microsoft'}</span>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-800 px-2 text-gray-400">Ou continue com</span>
              </div>
            </div>

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-700">
                <TabsTrigger value="signin" className="data-[state=active]:bg-blue-600">
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-blue-600">
                  Cadastrar
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-300">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-slate-700 hover:bg-slate-600 border border-slate-600"
                    disabled={loading}
                  >
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-gray-300">Nome Completo</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-gray-300">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-gray-300">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-slate-700 hover:bg-slate-600 border border-slate-600"
                    disabled={loading}
                  >
                    {loading ? 'Cadastrando...' : 'Cadastrar'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
