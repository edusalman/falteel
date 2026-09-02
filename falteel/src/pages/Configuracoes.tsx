// Caminho: ./src/pages/Configuracoes.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/useAuth';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type NotificationTiming = Database['public']['Tables']['profiles']['Row']['notification_timing'];

const OPCOES: { valor: NotificationTiming; label: string; descricao: string }[] = [
  { valor: 'before', label: 'ANTES', descricao: '15 min antes da aula começar' },
  { valor: 'during', label: 'DURANTE', descricao: '15 min depois da aula começar' },
  { valor: 'after', label: 'DEPOIS', descricao: '15 min depois da aula terminar' },
];

export function Configuracoes() {
  const navigate = useNavigate();
  const { user, profile, refetchProfile } = useAuth();
  const [isSalvando, setIsSalvando] = useState(false);
  const [permissao, setPermissao] = useState<NotificationPermission>(
    typeof Notification === 'undefined' ? 'denied' : Notification.permission,
  );

  const handleEscolher = async (valor: NotificationTiming) => {
    if (!user || valor === profile?.notification_timing) return;
    setIsSalvando(true);

    const { error } = await supabase
      .from('profiles')
      .update({ notification_timing: valor })
      .eq('id', user.id);

    if (error) {
      alert('Erro ao salvar preferência.');
    } else {
      await refetchProfile();
    }

    setIsSalvando(false);
  };

  const handlePedirPermissao = async () => {
    if (typeof Notification === 'undefined') return;
    const resultado = await Notification.requestPermission();
    setPermissao(resultado);
  };

  return (
    <div className="min-h-screen p-4 flex flex-col items-center">
      <div className="w-full max-w-md space-y-8">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b-4 border-black pb-4">
          <h1 className="text-3xl font-black uppercase">Configurações</h1>
          <button onClick={() => navigate('/')} className="font-bold underline decoration-2 hover:bg-black hover:text-white px-2 transition-colors">
            VOLTAR
          </button>
        </div>

        {/* Permissão de notificação */}
        <section>
          <h2 className="text-xl font-black uppercase mb-4">Notificações</h2>
          {permissao === 'granted' ? (
            <p className="font-bold text-sm bg-neo-green border-2 border-black p-3">Notificações ativadas.</p>
          ) : permissao === 'denied' ? (
            <p className="font-bold text-sm bg-neo-red text-white border-2 border-black p-3">
              Notificações bloqueadas pelo navegador. Ative manualmente nas configurações do site.
            </p>
          ) : (
            <button onClick={handlePedirPermissao} className="btn-brutal bg-neo-yellow text-black w-full">
              ATIVAR NOTIFICAÇÕES
            </button>
          )}
        </section>

        {/* Preferência de horário */}
        <section>
          <h2 className="text-xl font-black uppercase mb-4">Quando avisar</h2>
          <div className="space-y-3">
            {OPCOES.map(opcao => {
              const selecionada = profile?.notification_timing === opcao.valor;
              return (
                <button
                  key={opcao.valor}
                  onClick={() => handleEscolher(opcao.valor)}
                  disabled={isSalvando}
                  className={`card-brutal w-full text-left cursor-pointer transition-colors disabled:opacity-50 ${
                    selecionada ? 'bg-black text-white' : 'bg-white hover:bg-neo-bg'
                  }`}
                >
                  <p className="font-black uppercase">{opcao.label} {selecionada && '✓'}</p>
                  <p className={`text-xs font-bold ${selecionada ? 'text-gray-300' : 'text-gray-600'}`}>{opcao.descricao}</p>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
