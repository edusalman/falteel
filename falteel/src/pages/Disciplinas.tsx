// Caminho: ./src/pages/Disciplinas.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSemestres } from '../hooks/useSemestres';
import { useDisciplinas, type DisciplinaUsuario } from '../hooks/useDisciplinas';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function Disciplinas() {
  const navigate = useNavigate();
  const { semestreAtivo, fetchSemestres } = useSemestres();
  const {
    minhasDisciplinas, isLoading, fetchDisciplinas, adicionarDisciplina, editarDisciplina, excluirDisciplina,
  } = useDisciplinas(semestreAtivo?.id ?? null);

  useEffect(() => {
    fetchSemestres();
  }, [fetchSemestres]);

  const [nomeDisciplina, setNomeDisciplina] = useState('');
  const [nomeProfessor, setNomeProfessor] = useState('');
  const [tipoCredito, setTipoCredito] = useState<'simples' | 'duplo'>('simples');
  const [tipoAula, setTipoAula] = useState<'simples' | 'dobradinha'>('simples');
  const [diasSelecionados, setDiasSelecionados] = useState<number[]>([]);
  const [horarioInicio, setHorarioInicio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editTipoAula, setEditTipoAula] = useState<'simples' | 'dobradinha'>('simples');
  const [editDias, setEditDias] = useState<number[]>([]);
  const [editHorario, setEditHorario] = useState('');
  const [isSalvandoEdicao, setIsSalvandoEdicao] = useState(false);

  useEffect(() => {
    fetchDisciplinas();
  }, [fetchDisciplinas]);

  const toggleDia = (index: number) => {
    setDiasSelecionados(prev => 
      prev.includes(index) ? prev.filter(d => d !== index) : [...prev, index]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (diasSelecionados.length === 0) return alert('Selecione pelo menos um dia da semana!');
    
    setIsSubmitting(true);
    const { error } = await adicionarDisciplina(
      nomeProfessor, nomeDisciplina, tipoCredito, tipoAula, diasSelecionados, horarioInicio
    );

    if (error) {
      alert(error);
    } else {
      setNomeDisciplina('');
      setNomeProfessor('');
      setDiasSelecionados([]);
      setHorarioInicio('');
    }
    setIsSubmitting(false);
  };

  const iniciarEdicao = (disc: DisciplinaUsuario) => {
    setEditandoId(disc.id);
    setEditTipoAula(disc.tipo_aula);
    setEditDias(disc.dias_semana);
    setEditHorario(disc.horario_inicio);
  };

  const toggleDiaEdicao = (index: number) => {
    setEditDias(prev => prev.includes(index) ? prev.filter(d => d !== index) : [...prev, index]);
  };

  const handleSalvarEdicao = async (disc: DisciplinaUsuario) => {
    if (editDias.length === 0) return alert('Selecione pelo menos um dia da semana!');

    setIsSalvandoEdicao(true);
    const { error } = await editarDisciplina(disc.id, disc.disciplinas_globais.tipo_credito, editTipoAula, editDias, editHorario);
    if (error) {
      alert(error);
    } else {
      setEditandoId(null);
    }
    setIsSalvandoEdicao(false);
  };

  const handleExcluir = async (disc: DisciplinaUsuario) => {
    const confirmado = confirm(`Remover "${disc.disciplinas_globais.nome}" da sua grade? Isso também apaga o histórico de faltas dessa matéria.`);
    if (!confirmado) return;

    const { error } = await excluirDisciplina(disc.id);
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
          <h1 className="text-3xl font-black uppercase">Grade</h1>
          <button onClick={() => navigate('/')} className="font-bold underline decoration-2 hover:bg-black hover:text-white px-2 transition-colors">
            VOLTAR
          </button>
        </div>

        {/* Formulário */}
        <div className="card-brutal mb-8 bg-neo-green">
          <h2 className="text-xl font-bold mb-4 uppercase border-b-2 border-black pb-2">Nova Disciplina</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-bold mb-1 uppercase text-xs">Matéria</label>
              <input type="text" required value={nomeDisciplina} onChange={e => setNomeDisciplina(e.target.value)} placeholder="Ex: Cálculo I" className="w-full border-2 border-black p-2 focus:outline-none focus:shadow-brutal transition-shadow bg-white" />
            </div>

            <div>
              <label className="block font-bold mb-1 uppercase text-xs">Professor</label>
              <input type="text" required value={nomeProfessor} onChange={e => setNomeProfessor(e.target.value)} placeholder="Ex: Possani" className="w-full border-2 border-black p-2 focus:outline-none focus:shadow-brutal transition-shadow bg-white" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-1 uppercase text-xs">Créditos</label>
                <select value={tipoCredito} onChange={e => setTipoCredito(e.target.value as 'simples'|'duplo')} className="w-full border-2 border-black p-2 bg-white">
                  <option value="simples">Simples (2)</option>
                  <option value="duplo">Duplo (4)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1 uppercase text-xs">Tipo de Aula</label>
                <select value={tipoAula} onChange={e => setTipoAula(e.target.value as 'simples'|'dobradinha')} className="w-full border-2 border-black p-2 bg-white">
                  <option value="simples">Simples (1h40)</option>
                  <option value="dobradinha">Dobradinha (3h40)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1 uppercase text-xs">Dias da Semana</label>
              <div className="flex flex-wrap gap-2">
                {DIAS_SEMANA.map((dia, index) => {
                  if (index === 0) return null; // Pular Domingo por padrão na UI
                  const isSelected = diasSelecionados.includes(index);
                  return (
                    <button type="button" key={dia} onClick={() => toggleDia(index)}
                      className={`border-2 border-black font-bold px-2 py-1 text-sm ${isSelected ? 'bg-black text-white shadow-[2px_2px_0px_0px_#F4A261]' : 'bg-white'}`}>
                      {dia}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1 uppercase text-xs">Horário de Início</label>
              <input type="time" required value={horarioInicio} onChange={e => setHorarioInicio(e.target.value)} className="w-full border-2 border-black p-2 bg-white" />
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-brutal w-full bg-neo-yellow text-black mt-2">
              {isSubmitting ? 'SALVANDO...' : 'ADICIONAR À GRADE'}
            </button>
          </form>
        </div>

        {/* Lista de Disciplinas */}
        <h2 className="text-xl font-black uppercase mb-4">Minhas Matérias</h2>
        {isLoading ? (
          <p className="font-bold text-center">Carregando grade...</p>
        ) : minhasDisciplinas.length === 0 ? (
          <p className="font-bold text-gray-600 border-2 border-dashed border-black p-4 text-center">Nenhuma matéria adicionada.</p>
        ) : (
          <div className="space-y-4">
            {minhasDisciplinas.map((disc, index) => (
              <div key={disc.id} className="card-brutal bg-white animate-fade-in" style={{ animationDelay: `${index * 60}ms` }}>
                {editandoId === disc.id ? (
                  <div className="space-y-3">
                    <h3 className="font-black text-lg uppercase">{disc.disciplinas_globais.nome}</h3>

                    <div>
                      <label className="block font-bold mb-1 uppercase text-xs">Tipo de Aula</label>
                      <select value={editTipoAula} onChange={e => setEditTipoAula(e.target.value as 'simples' | 'dobradinha')} className="w-full border-2 border-black p-2 bg-white">
                        <option value="simples">Simples (1h40)</option>
                        <option value="dobradinha">Dobradinha (3h40)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold mb-1 uppercase text-xs">Dias da Semana</label>
                      <div className="flex flex-wrap gap-2">
                        {DIAS_SEMANA.map((dia, i) => {
                          if (i === 0) return null;
                          const isSelected = editDias.includes(i);
                          return (
                            <button type="button" key={dia} onClick={() => toggleDiaEdicao(i)}
                              className={`border-2 border-black font-bold px-2 py-1 text-sm ${isSelected ? 'bg-black text-white' : 'bg-white'}`}>
                              {dia}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold mb-1 uppercase text-xs">Horário de Início</label>
                      <input type="time" value={editHorario} onChange={e => setEditHorario(e.target.value)} className="w-full border-2 border-black p-2 bg-white" />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setEditandoId(null)} className="btn-brutal bg-white flex-1 text-sm">CANCELAR</button>
                      <button onClick={() => handleSalvarEdicao(disc)} disabled={isSalvandoEdicao} className="btn-brutal bg-neo-green text-black flex-1 text-sm disabled:opacity-50">
                        {isSalvandoEdicao ? 'SALVANDO...' : 'SALVAR'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-black text-lg uppercase leading-tight">{disc.disciplinas_globais.nome}</h3>
                      <div className="flex gap-3 shrink-0 pt-1">
                        <button onClick={() => iniciarEdicao(disc)} className="text-xs font-bold underline cursor-pointer whitespace-nowrap">EDITAR</button>
                        <button onClick={() => handleExcluir(disc)} className="text-xs font-bold underline cursor-pointer whitespace-nowrap text-neo-red">EXCLUIR</button>
                      </div>
                    </div>
                    <p className="font-bold text-sm text-gray-700 mb-2">Prof. {disc.disciplinas_globais.professores.nome}</p>
                    <div className="flex justify-between items-center mt-3 border-t-2 border-black pt-2">
                      <span className="text-xs font-bold uppercase bg-neo-bg px-2 py-1 border border-black">
                        {disc.dias_semana.map(d => DIAS_SEMANA[d]).join(', ')} • {disc.horario_inicio}
                      </span>
                      <span className="text-xs font-black bg-neo-red text-white px-2 py-1 border border-black">
                        LIMITE: {disc.limite_faltas} FALTAS
                      </span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}