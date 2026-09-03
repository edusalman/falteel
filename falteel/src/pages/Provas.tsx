// Caminho: ./src/pages/Provas.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSemestres } from '../hooks/useSemestres';
import { useDisciplinas } from '../hooks/useDisciplinas';
import { useProvas } from '../hooks/useProvas';

// new Date('YYYY-MM-DD') é interpretado como UTC — no fuso do Brasil isso pode
// exibir o dia anterior. Formata direto a partir dos componentes da string.
function formatarDataBR(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

function paraISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function Provas() {
  const navigate = useNavigate();
  const { semestreAtivo, fetchSemestres } = useSemestres();
  const { minhasDisciplinas, fetchDisciplinas } = useDisciplinas(semestreAtivo?.id ?? null);
  const { provas, isLoading, fetchProvas, marcarProva, cancelarProva } = useProvas(semestreAtivo?.id ?? null);

  useEffect(() => { fetchSemestres(); }, [fetchSemestres]);
  useEffect(() => { fetchDisciplinas(); }, [fetchDisciplinas]);
  useEffect(() => { fetchProvas(); }, [fetchProvas]);

  const [disciplinaId, setDisciplinaId] = useState('');
  const [data, setData] = useState('');
  const [observacao, setObservacao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disciplinaId || !data) return;

    setIsSubmitting(true);
    const { error } = await marcarProva(disciplinaId, data, observacao);
    if (error) {
      alert(error);
    } else {
      setDisciplinaId('');
      setData('');
      setObservacao('');
    }
    setIsSubmitting(false);
  };

  const handleCancelar = async (id: string, nome: string, dataProva: string) => {
    const confirmado = confirm(`Cancelar a prova de ${nome} marcada pra ${dataProva}?`);
    if (!confirmado) return;

    const { error } = await cancelarProva(id);
    if (error) alert(error);
  };

  if (!semestreAtivo) {
    return (
      <div className="p-4 text-center mt-10">
        <p className="font-bold border-2 border-black p-4 bg-white shadow-brutal inline-block">
          Crie um semestre ativo primeiro!
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 flex flex-col items-center">
      <div className="w-full max-w-md">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-black uppercase">Provas</h1>
          <button onClick={() => navigate('/')} className="font-bold underline decoration-2 hover:bg-black hover:text-white px-2 transition-colors">
            VOLTAR
          </button>
        </div>

        {/* Formulário */}
        <div className="card-brutal mb-8 bg-neo-blue text-white">
          <h2 className="text-xl font-bold mb-4 uppercase border-b-2 border-white pb-2">Marcar Prova</h2>
          {minhasDisciplinas.length === 0 ? (
            <p className="font-bold text-sm">Cadastre uma disciplina na grade primeiro pra poder marcar uma prova.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-bold mb-1 uppercase text-xs">Disciplina</label>
                <select
                  value={disciplinaId}
                  onChange={e => setDisciplinaId(e.target.value)}
                  required
                  className="w-full border-2 border-black p-2 bg-white text-black"
                >
                  <option value="" disabled>Selecione...</option>
                  {minhasDisciplinas.map(d => (
                    <option key={d.id} value={d.id}>{d.disciplinas_globais.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 uppercase text-xs">Data</label>
                <input
                  type="date"
                  required
                  value={data}
                  min={paraISO(new Date())}
                  onChange={e => setData(e.target.value)}
                  className="w-full border-2 border-black p-2 bg-white text-black"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 uppercase text-xs">Observação (opcional)</label>
                <input
                  type="text"
                  value={observacao}
                  onChange={e => setObservacao(e.target.value)}
                  placeholder="Ex: P1, capítulos 1 a 4"
                  className="w-full border-2 border-black p-2 bg-white text-black"
                />
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-brutal w-full bg-white text-black disabled:opacity-50">
                {isSubmitting ? 'SALVANDO...' : 'MARCAR PROVA'}
              </button>
            </form>
          )}
        </div>

        {/* Lista de Provas */}
        <h2 className="text-xl font-black uppercase mb-4">Próximas Provas</h2>
        {isLoading ? (
          <p className="font-bold text-center">Carregando...</p>
        ) : provas.length === 0 ? (
          <p className="font-bold text-gray-600 border-2 border-dashed border-black p-4 text-center">Nenhuma prova marcada.</p>
        ) : (
          <div className="space-y-4">
            {provas.map((p, index) => (
              <div key={p.id} className="card-brutal bg-white animate-fade-in" style={{ animationDelay: `${index * 60}ms` }}>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-black text-lg uppercase leading-tight">{p.disciplinaUsuario?.disciplinas_globais.nome ?? 'Disciplina removida'}</h3>
                    <p className="text-sm font-bold text-gray-600">
                      {formatarDataBR(p.data)}{p.disciplinaUsuario ? ` • ${p.disciplinaUsuario.horario_inicio}` : ''}
                    </p>
                    {p.justificativa && (
                      <p className="text-xs font-bold text-gray-600 italic mt-1">"{p.justificativa}"</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleCancelar(p.id, p.disciplinaUsuario?.disciplinas_globais.nome ?? 'disciplina', formatarDataBR(p.data))}
                    className="text-xs font-bold underline cursor-pointer text-neo-red whitespace-nowrap"
                  >
                    CANCELAR
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
