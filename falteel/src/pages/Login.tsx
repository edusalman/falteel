// Caminho: ./src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Pede permissão de notificação assim que o usuário loga
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
          Notification.requestPermission();
        }

        navigate('/');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Conta criada com sucesso! Você já pode entrar.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocorreu um erro desconhecido.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Mobile-first: max-w-sm para ficar perfeito no celular */}
      <div className="card-brutal w-full max-w-sm bg-white">
        <h1 className="text-3xl font-black uppercase mb-6 text-center border-b-2 border-black pb-4">
          FaltEEL
        </h1>
        
        {/* ABAS DE NAVEGAÇÃO: Deixa nítido o que o usuário está fazendo */}
        <div className="flex mb-6 border-2 border-black bg-neo-bg">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 font-bold uppercase transition-colors ${isLogin ? 'bg-black text-white' : 'text-black hover:bg-gray-200'}`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 font-bold uppercase transition-colors border-l-2 border-black ${!isLogin ? 'bg-black text-white' : 'text-black hover:bg-gray-200'}`}
          >
            Cadastrar
          </button>
        </div>

        <h2 className="text-lg font-bold mb-4">
          {isLogin ? 'BEM-VINDO DE VOLTA' : 'CRIE SUA CONTA'}
        </h2>

        {error && (
          <div className="bg-neo-red text-white p-3 mb-4 border-2 border-black font-bold uppercase text-sm">
            ERRO: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-bold mb-1 uppercase text-sm">E-mail</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-black p-2 focus:outline-none focus:shadow-brutal transition-shadow"
              placeholder="exemplo@usp.br"
            />
          </div>
          <div>
            <label className="block font-bold mb-1 uppercase text-sm">Senha</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-black p-2 focus:outline-none focus:shadow-brutal transition-shadow"
              placeholder={isLogin ? 'Sua senha' : 'Crie uma senha forte'}
            />
          </div>

          {!isLogin && (
            <p className="text-xs font-bold text-gray-500">
              Dica: Use uma senha que você não vai esquecer no dia da prova.
            </p>
          )}

          {/* O botão muda de cor e texto dependendo da aba ativa */}
          <button 
            type="submit" 
            disabled={loading}
            className={`btn-brutal w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed ${isLogin ? 'bg-neo-yellow text-black' : 'bg-neo-blue text-white'}`}
          >
            {loading ? 'CARREGANDO...' : (isLogin ? 'ENTRAR NA CONTA' : 'CRIAR CONTA')}
          </button>
        </form>
      </div>
    </div>
  );
}