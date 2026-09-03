// Caminho: ./src/pages/Home.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFocoDiario } from '../hooks/useFocoDiario';
import { useAuth } from '../store/useAuth';
import { IconAlerta } from '../components/IconAlerta';
import { IconEngrenagem } from '../components/IconEngrenagem';

const LABEL_STATUS: Record<string, string> = {
  presente: 'FUI',
  falta: 'FALTEI',
  cancelada: 'CANCELADA',
  greve: 'GREVE',
  prova: 'DIA DE PROVA',
};

// Formata em horário local (evita o bug clássico de new Date('YYYY-MM-DD') virar UTC)
function paraISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function Home() {
  const { signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const {
    dataAtual, isHoje, isFeriado, nomeFeriado, aulasHoje, proximaAula, semestreAtivo, isLoading,
    registrarAula, diaAnterior, diaSeguinte, irParaHoje, irParaData,
    carregarFocoDiario, fetchSemestres,
  } = useFocoDiario();
  const [modalAberto, setModalAberto] = useState<string | null>(null);
  const [justificativa, setJustificativa] = useState('');
  const [statusAcao, setStatusAcao] = useState<'falta' | 'cancelada'>('falta');

  useEffect(() => {
    fetchSemestres();
  }, [fetchSemestres]);

  useEffect(() => {
    carregarFocoDiario();
  }, [carregarFocoDiario]);

  if (isLoading) return <div className="p-4 font-bold text-center mt-10">CARREGANDO FOCO DIÁRIO...</div>;

  if (!semestreAtivo) {
    return (
      <div className="min-h-screen p-4 flex flex-col items-center justify-center text-center gap-4">
        <div className="flex justify-end items-center gap-3 w-full max-w-sm">
          <button onClick={signOut} className="text-xs font-bold underline cursor-pointer">SAIR</button>
          <button onClick={() => navigate('/configuracoes')} aria-label="Configurações" className="cursor-pointer hover:rotate-45 transition-transform">
            <IconEngrenagem className="w-6 h-6" />
          </button>
        </div>
        <p className="card-brutal bg-white font-bold">
          Você ainda não tem nenhum semestre cadastrado. Crie um pra começar a usar o FaltEEL.
        </p>
        <button onClick={() => navigate('/semestres')} className="btn-brutal bg-neo-yellow text-black">
          CRIAR MEU PRIMEIRO SEMESTRE
        </button>
      </div>
    );
  }

  const disciplinasEmPerigo = aulasHoje.filter(a => a.faltasRestantes === 1);
  const disciplinasAlerta = aulasHoje.filter(a => a.faltasRestantes === 2);

  const handleRegistrarModal = () => {
    if (modalAberto) {
      registrarAula(modalAberto, statusAcao, justificativa);
      setModalAberto(null);
      setJustificativa('');
    }
  };

  return (
    <div className="min-h-screen p-4 flex flex-col items-center">
      <div className="w-full max-w-sm space-y-4">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center border-b-4 border-black pb-4 mb-4">
          <h1 className="text-3xl font-black uppercase">{isHoje ? 'HOJE' : 'EDITAR DIA'}</h1>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button onClick={() => navigate('/admin')} className="text-xs font-bold underline cursor-pointer">ADMIN</button>
            )}
            <button onClick={signOut} className="text-xs font-bold underline cursor-pointer">SAIR</button>
            <button onClick={() => navigate('/configuracoes')} aria-label="Configurações" className="cursor-pointer hover:rotate-45 transition-transform">
              <IconEngrenagem className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Navegação entre dias */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <button
            onClick={diaAnterior}
            aria-label="Dia anterior"
            className="btn-brutal bg-white text-black px-3 py-1 text-sm"
          >
            ◀
          </button>
          <div className="flex-1 text-center">
            <p className="font-bold text-lg uppercase leading-tight">
              {dataAtual.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
            </p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <input
                type="date"
                value={paraISO(dataAtual)}
                max={paraISO(new Date())}
                onChange={(e) => e.target.value && irParaData(new Date(`${e.target.value}T00:00:00`))}
                aria-label="Ir para uma data específica"
                className="text-xs font-bold border-2 border-black px-1 py-0.5 bg-white cursor-pointer"
              />
              {!isHoje && (
                <button onClick={irParaHoje} className="text-xs font-bold underline cursor-pointer whitespace-nowrap">
                  VOLTAR PARA HOJE
                </button>
              )}
            </div>
          </div>
          <button
            onClick={diaSeguinte}
            aria-label="Próximo dia"
            disabled={isHoje}
            className="btn-brutal bg-white text-black px-3 py-1 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ▶
          </button>
        </div>

        {/* Banners de Perigo */}
        {disciplinasEmPerigo.length > 0 && (
          <div className="card-brutal bg-neo-red text-white">
            <h2 className="font-black uppercase text-xl flex items-center gap-2">
              <IconAlerta className="w-6 h-6 shrink-0" /> RISCO MÁXIMO
            </h2>
            <p className="font-bold text-sm">Você só tem MAIS UMA FALTA em: {disciplinasEmPerigo.map(d => d.disciplinas_globais.nome).join(', ')}</p>
          </div>
        )}
        {disciplinasAlerta.length > 0 && disciplinasEmPerigo.length === 0 && (
          <div className="card-brutal bg-neo-yellow text-black">
            <h2 className="font-black uppercase text-xl flex items-center gap-2">
              <IconAlerta className="w-6 h-6 shrink-0" /> ATENÇÃO
            </h2>
            <p className="font-bold text-sm">Você tem apenas 2 faltas sobrando em: {disciplinasAlerta.map(d => d.disciplinas_globais.nome).join(', ')}</p>
          </div>
        )}

        {/* Cenário de Feriado ou Fim de Semana */}
        {(isFeriado || dataAtual.getDay() === 0 || dataAtual.getDay() === 6) ? (
          <div className="card-brutal bg-neo-blue text-white text-center py-10">
            <h2 className="font-black text-2xl uppercase mb-2">DIA LIVRE!</h2>
            <p className="font-bold">{isFeriado ? `Feriado: ${nomeFeriado}` : 'Fim de semana'}</p>
          </div>
        ) : aulasHoje.length === 0 ? (
          <div className="card-brutal bg-white text-center py-10">
            <h2 className="font-black text-xl uppercase text-gray-500 mb-4">Nenhuma aula hoje!</h2>
            {proximaAula ? (
              <p className="font-bold text-sm mb-4">
                Próxima aula: <span className="uppercase">{proximaAula.data.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</span>
                {' — '}{proximaAula.nomes.join(', ')}
              </p>
            ) : (
              <button onClick={() => navigate('/disciplinas')} className="btn-brutal bg-neo-yellow text-black text-sm">
                ADICIONAR MATÉRIAS
              </button>
            )}
          </div>
        ) : (
          /* Lista de Aulas do Dia */
          <div className="space-y-6">
            {aulasHoje.map((aula, index) => {
              const statusAtual = aula.registroDoDia?.status;
              const destaque = (s: string) => statusAtual === s ? 'ring-4 ring-black ring-offset-2' : '';
              return (
                <div key={aula.id} className="card-brutal bg-white animate-fade-in" style={{ animationDelay: `${index * 60}ms` }}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-xl uppercase leading-tight">{aula.disciplinas_globais.nome}</h3>
                    <span className="bg-neo-bg border-2 border-black font-bold text-xs px-2 py-1">{aula.horario_inicio}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-600 mb-4">Prof. {aula.disciplinas_globais.professores.nome}</p>

                  <div className="flex justify-between items-center mb-2 border-b-2 border-dashed border-black pb-4">
                    <span className="text-xs font-bold uppercase">Faltas: {aula.faltasAtuais} / {aula.limite_faltas}</span>
                    <span className="text-xs font-black uppercase text-neo-red">RESTAM: {aula.faltasRestantes}</span>
                  </div>

                  {statusAtual && (
                    <p className="text-xs font-black uppercase text-center bg-neo-bg border-2 border-black py-1">
                      Registrado: {LABEL_STATUS[statusAtual]}
                    </p>
                  )}
                  {aula.registroDoDia?.justificativa && (
                    <p className="text-xs font-bold text-gray-600 italic px-1 pt-1">
                      "{aula.registroDoDia.justificativa}"
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button onClick={() => registrarAula(aula.id, 'presente')} className={`btn-brutal bg-neo-green text-black text-sm ${destaque('presente')}`}>FUI</button>
                    <button onClick={() => { setModalAberto(aula.id); setStatusAcao('falta'); setJustificativa(aula.registroDoDia?.justificativa ?? ''); }} className={`btn-brutal bg-neo-red text-white text-sm ${destaque('falta')}`}>FALTEI</button>
                    <button onClick={() => registrarAula(aula.id, 'prova')} className={`btn-brutal bg-neo-blue text-white text-sm col-span-2 ${destaque('prova')}`}>DIA DE PROVA</button>
                    <button onClick={() => { setModalAberto(aula.id); setStatusAcao('cancelada'); setJustificativa(aula.registroDoDia?.justificativa ?? ''); }} className={`btn-brutal bg-white text-xs ${destaque('cancelada')}`}>CANCELADA</button>
                    <button onClick={() => registrarAula(aula.id, 'greve')} className={`btn-brutal bg-white text-xs ${destaque('greve')}`}>GREVE</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Menu de Navegação Inferior */}
        <div className="grid grid-cols-2 gap-2 mt-8 border-t-4 border-black pt-4">
          <button onClick={() => navigate('/disciplinas')} className="btn-brutal bg-white text-black text-xs">
            GRADE
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn-brutal bg-white text-black text-xs">
            DASHBOARD
          </button>
          <button onClick={() => navigate('/semestres')} className="btn-brutal bg-white text-black text-xs">
            SEMESTRES
          </button>
          <button onClick={() => navigate('/provas')} className="btn-brutal bg-white text-black text-xs">
            PROVAS
          </button>
        </div>

      </div>

      {/* Modal Neobrutalista para Justificativa (Falta ou Cancelamento) */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="card-brutal bg-neo-yellow w-full max-w-sm">
            <h2 className="text-2xl font-black uppercase mb-2">
              {statusAcao === 'falta' ? 'Você faltou!' : 'Aula Cancelada'}
            </h2>
            <p className="font-bold text-sm mb-4">Quer deixar uma anotação de justificativa? (Opcional)</p>
            
            <textarea 
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              className="w-full border-2 border-black p-2 bg-white mb-4 h-24 focus:outline-none"
              placeholder="Ex: Fiquei estudando pra prova de Física..."
            />
            
            <div className="flex gap-2">
              <button onClick={() => setModalAberto(null)} className="btn-brutal bg-white flex-1">CANCELAR</button>
              <button onClick={handleRegistrarModal} className="btn-brutal bg-black text-white flex-1">CONFIRMAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}