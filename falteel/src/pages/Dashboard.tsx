// Caminho: ./src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSemestres } from '../hooks/useSemestres';
import { useDashboard } from '../hooks/useDashboard';

function corBarra(faltasRestantes: number): string {
  if (faltasRestantes <= 1) return 'bg-neo-red';
  if (faltasRestantes <= 2) return 'bg-neo-yellow';
  return 'bg-neo-green';
}

export function Dashboard() {
  const navigate = useNavigate();
  const { semestres, semestreAtivo, isLoading: isLoadingSemestres, fetchSemestres } = useSemestres();

  useEffect(() => {
    fetchSemestres();
  }, [fetchSemestres]);

  // Seleção manual do usuário; sem escolha, cai no semestre ativo (calculado, não guardado em estado)
  const [semestreSelecionadoManual, setSemestreSelecionadoManual] = useState<string | null>(null);
  const semestreSelecionadoId = semestreSelecionadoManual ?? semestreAtivo?.id ?? null;

  const { disciplinas, isLoading, carregar } = useDashboard(semestreSelecionadoId);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const somenteLeitura = semestreSelecionadoId !== null && semestreSelecionadoId !== semestreAtivo?.id;

  if (isLoadingSemestres) {
    return <div className="p-4 text-center font-bold">CARREGANDO DASHBOARD...</div>;
  }

  return (
    <div className="min-h-screen p-4 flex flex-col items-center">
      <div className="w-full max-w-md">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-black uppercase">Dashboard</h1>
          <button onClick={() => navigate('/')} className="font-bold underline decoration-2 hover:bg-black hover:text-white px-2 transition-colors">
            VOLTAR
          </button>
        </div>

        {semestres.length === 0 ? (
          <p className="font-bold text-gray-600 border-2 border-dashed border-black p-4 text-center">
            Nenhum semestre cadastrado ainda.
          </p>
        ) : (
          <>
            {/* Seletor de semestre */}
            <div className="flex flex-wrap gap-2 mb-6">
              {semestres.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSemestreSelecionadoManual(s.id)}
                  className={`btn-brutal text-xs ${semestreSelecionadoId === s.id ? 'bg-black text-white' : 'bg-white text-black'}`}
                >
                  {s.nome}{semestreAtivo?.id === s.id ? ' • ATIVO' : ''}
                </button>
              ))}
            </div>

            {somenteLeitura && (
              <p className="text-xs font-black uppercase text-center mb-4 bg-neo-yellow border-2 border-black py-1">
                Histórico de semestre — somente leitura
              </p>
            )}

            {/* Barras de progresso por disciplina */}
            {isLoading ? (
              <p className="font-bold text-center">Carregando progresso...</p>
            ) : disciplinas.length === 0 ? (
              <p className="font-bold text-gray-600 border-2 border-dashed border-black p-4 text-center">
                Nenhuma disciplina cadastrada neste semestre.
              </p>
            ) : (
              <div className="space-y-4">
                {disciplinas.map((disc, index) => {
                  const percentual = Math.min(100, Math.round((disc.faltasAtuais / disc.limite_faltas) * 100));
                  return (
                    <div key={disc.id} className="card-brutal bg-white animate-fade-in" style={{ animationDelay: `${index * 60}ms` }}>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-black text-lg uppercase leading-tight">{disc.disciplinas_globais.nome}</h3>
                        <span className="text-xs font-bold uppercase bg-neo-bg border border-black px-2 py-1 whitespace-nowrap">
                          {disc.faltasAtuais}/{disc.limite_faltas}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-gray-600 mb-3">Prof. {disc.disciplinas_globais.professores.nome}</p>
                      <div className="w-full border-2 border-black h-5 bg-neo-bg overflow-hidden">
                        <div
                          className={`h-full transition-[width] duration-500 ease-out ${corBarra(disc.faltasRestantes)} ${percentual > 0 && percentual < 100 ? 'border-r-2 border-black' : ''}`}
                          style={{ width: `${percentual}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
