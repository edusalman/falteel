// Caminho: ./src/pages/Semestres.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSemestres } from '../hooks/useSemestres';
import type { Database } from '../types/database.types';

type Semestre = Database['public']['Tables']['semestres']['Row'];

// new Date('YYYY-MM-DD') é interpretado como UTC — no fuso do Brasil isso pode
// exibir o dia anterior. Formata direto a partir dos componentes da string.
function formatarDataBR(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function Semestres() {
  const navigate = useNavigate();
  const {
    semestres, semestreAtivo, isLoading, criarSemestre, editarSemestre, excluirSemestre, duplicarDisciplinas, fetchSemestres,
  } = useSemestres();

  useEffect(() => {
    fetchSemestres();
  }, [fetchSemestres]);

  const [nome, setNome] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [copiarDeId, setCopiarDeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editInicio, setEditInicio] = useState('');
  const [editFim, setEditFim] = useState('');
  const [isSalvandoEdicao, setIsSalvandoEdicao] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { id, error } = await criarSemestre(nome, dataInicio, dataFim);

    if (error || !id) {
      alert(error ?? 'Erro ao criar semestre.');
      setIsSubmitting(false);
      return;
    }

    if (copiarDeId) {
      const { error: errDuplicar } = await duplicarDisciplinas(copiarDeId, id);
      if (errDuplicar) alert(`Semestre criado, mas ${errDuplicar.toLowerCase()}. Você pode adicionar as disciplinas manualmente.`);
    }

    setNome('');
    setDataInicio('');
    setDataFim('');
    setCopiarDeId('');
    setIsSubmitting(false);
  };

  const iniciarEdicao = (s: Semestre) => {
    setEditandoId(s.id);
    setEditNome(s.nome);
    setEditInicio(s.data_inicio);
    setEditFim(s.data_fim);
  };

  const handleSalvarEdicao = async (id: string) => {
    setIsSalvandoEdicao(true);
    const { error } = await editarSemestre(id, editNome, editInicio, editFim);
    if (error) {
      alert(error);
    } else {
      setEditandoId(null);
    }
    setIsSalvandoEdicao(false);
  };

  const handleExcluir = async (s: Semestre) => {
    const confirmado = confirm(
      `Excluir o semestre "${s.nome}"? Isso apaga TODAS as disciplinas e o histórico de faltas cadastrados nele. Não tem como desfazer.`,
    );
    if (!confirmado) return;

    const { error } = await excluirSemestre(s.id);
    if (error) alert(error);
  };

  if (isLoading) {
    return <div className="p-4 text-center font-bold">CARREGANDO SEMESTRES...</div>;
  }

  return (
    <div className="min-h-screen p-4 flex flex-col items-center">
      <div className="w-full max-w-md">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-black uppercase">Semestres</h1>
          <button 
            onClick={() => navigate('/')}
            className="font-bold underline decoration-2 hover:bg-black hover:text-white px-2 transition-colors cursor-pointer"
          >
            VOLTAR
          </button>
        </div>

        {/* Formulário de Criação */}
        <div className="card-brutal mb-8 bg-neo-yellow">
          <h2 className="text-xl font-bold mb-4 uppercase border-b-2 border-black pb-2">
            {semestres.length === 0 ? 'ONBOARDING: Crie seu 1º Semestre' : 'Novo Semestre'}
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block font-bold mb-1 uppercase text-sm">Nome (Ex: 2025.1)</label>
              <input 
                type="text" required value={nome} onChange={e => setNome(e.target.value)}
                className="w-full border-2 border-black p-2 focus:outline-none focus:shadow-brutal transition-shadow bg-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-1 uppercase text-sm">Início</label>
                <input 
                  type="date" required value={dataInicio} onChange={e => setDataInicio(e.target.value)}
                  className="w-full border-2 border-black p-2 focus:outline-none focus:shadow-brutal transition-shadow bg-white"
                />
              </div>
              <div>
                <label className="block font-bold mb-1 uppercase text-sm">Fim</label>
                <input 
                  type="date" required value={dataFim} onChange={e => setDataFim(e.target.value)}
                  className="w-full border-2 border-black p-2 focus:outline-none focus:shadow-brutal transition-shadow bg-white"
                />
              </div>
            </div>
            {semestres.length > 0 && (
              <div>
                <label className="block font-bold mb-1 uppercase text-sm">Copiar disciplinas de (opcional)</label>
                <select
                  value={copiarDeId}
                  onChange={e => setCopiarDeId(e.target.value)}
                  className="w-full border-2 border-black p-2 bg-white"
                >
                  <option value="">Nenhum — começar vazio</option>
                  {semestres.map(s => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="submit" disabled={isSubmitting}
              className="btn-brutal w-full bg-white text-black hover:bg-gray-100 disabled:opacity-50 mt-2"
            >
              {isSubmitting ? 'SALVANDO...' : 'ADICIONAR SEMESTRE'}
            </button>
          </form>
        </div>

        {/* Lista de Semestres */}
        <h2 className="text-xl font-black uppercase mb-4">Meus Semestres</h2>
        {semestres.length === 0 ? (
          <p className="font-bold text-gray-600 border-2 border-dashed border-black p-4 text-center">
            Nenhum semestre cadastrado. Você precisa criar um para usar o FaltEEL.
          </p>
        ) : (
          <div className="space-y-4">
            {semestres.map((s) => {
              const isAtivo = semestreAtivo?.id === s.id;

              if (editandoId === s.id) {
                return (
                  <div key={s.id} className="card-brutal bg-white space-y-3">
                    <div>
                      <label className="block font-bold mb-1 uppercase text-sm">Nome</label>
                      <input value={editNome} onChange={e => setEditNome(e.target.value)} className="w-full border-2 border-black p-2 bg-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold mb-1 uppercase text-sm">Início</label>
                        <input type="date" value={editInicio} onChange={e => setEditInicio(e.target.value)} className="w-full border-2 border-black p-2 bg-white" />
                      </div>
                      <div>
                        <label className="block font-bold mb-1 uppercase text-sm">Fim</label>
                        <input type="date" value={editFim} onChange={e => setEditFim(e.target.value)} className="w-full border-2 border-black p-2 bg-white" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditandoId(null)} className="btn-brutal bg-white flex-1 text-sm">CANCELAR</button>
                      <button onClick={() => handleSalvarEdicao(s.id)} disabled={isSalvandoEdicao} className="btn-brutal bg-neo-green text-black flex-1 text-sm disabled:opacity-50">
                        {isSalvandoEdicao ? 'SALVANDO...' : 'SALVAR'}
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={s.id} className={`card-brutal ${isAtivo ? 'bg-neo-blue text-white' : 'bg-white'}`}>
                  <div className="flex justify-between items-center gap-2">
                    <h3 className="font-black text-xl uppercase">{s.nome}</h3>
                    <div className="flex items-center gap-3 shrink-0">
                      {isAtivo && (
                        <span className="bg-neo-yellow text-black text-xs font-black uppercase px-2 py-1 border-2 border-black shadow-[2px_2px_0px_0px_#000000]">
                          ATIVO
                        </span>
                      )}
                      <button onClick={() => iniciarEdicao(s)} className={`text-xs font-bold underline cursor-pointer whitespace-nowrap ${isAtivo ? 'text-white' : ''}`}>EDITAR</button>
                      <button onClick={() => handleExcluir(s)} className={`text-xs font-bold underline cursor-pointer whitespace-nowrap ${isAtivo ? 'text-white' : 'text-neo-red'}`}>EXCLUIR</button>
                    </div>
                  </div>
                  <p className="font-bold text-sm mt-2">
                    {formatarDataBR(s.data_inicio)} até {formatarDataBR(s.data_fim)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}