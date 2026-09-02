// Caminho: ./src/pages/AdminPanel.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAlunos, type AlunoComSemestreAtivo } from '../hooks/useAdminAlunos';
import { useAdminGradeAluno } from '../hooks/useAdminGradeAluno';
import { useAdminDisciplinasGlobais } from '../hooks/useAdminDisciplinasGlobais';

export function AdminPanel() {
  const navigate = useNavigate();

  const { alunos, isLoading: isLoadingAlunos, fetchAlunos } = useAdminAlunos();
  useEffect(() => {
    fetchAlunos();
  }, [fetchAlunos]);

  const [alunoSelecionado, setAlunoSelecionado] = useState<AlunoComSemestreAtivo | null>(null);
  const { disciplinas: gradeAluno, isLoading: isLoadingGrade, carregar: carregarGrade } = useAdminGradeAluno(
    alunoSelecionado?.id ?? null,
    alunoSelecionado?.semestreAtivo?.id ?? null,
  );
  useEffect(() => {
    carregarGrade();
  }, [carregarGrade]);

  const {
    disciplinas: disciplinasGlobais, isLoading: isLoadingGlobais,
    fetchDisciplinas, renomearDisciplina, renomearProfessor,
  } = useAdminDisciplinasGlobais();
  useEffect(() => {
    fetchDisciplinas();
  }, [fetchDisciplinas]);

  const [editandoDisciplinaId, setEditandoDisciplinaId] = useState<string | null>(null);
  const [nomeEditado, setNomeEditado] = useState('');
  const [editandoProfessorId, setEditandoProfessorId] = useState<string | null>(null);
  const [nomeProfessorEditado, setNomeProfessorEditado] = useState('');

  const handleSalvarDisciplina = async (id: string) => {
    if (!nomeEditado.trim()) return;
    const { error } = await renomearDisciplina(id, nomeEditado.trim());
    if (error) alert('Erro ao renomear disciplina.');
    setEditandoDisciplinaId(null);
  };

  const handleSalvarProfessor = async (id: string) => {
    if (!nomeProfessorEditado.trim()) return;
    const { error } = await renomearProfessor(id, nomeProfessorEditado.trim());
    if (error) alert('Erro ao renomear professor.');
    setEditandoProfessorId(null);
  };

  return (
    <div className="min-h-screen p-4 flex flex-col items-center">
      <div className="w-full max-w-md space-y-10">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b-4 border-black pb-4">
          <h1 className="text-3xl font-black uppercase">Painel Admin</h1>
          <button onClick={() => navigate('/')} className="font-bold underline decoration-2 hover:bg-black hover:text-white px-2 transition-colors">
            VOLTAR
          </button>
        </div>

        {/* Seção 1 — Alunos Cadastrados */}
        <section>
          <h2 className="text-xl font-black uppercase mb-4">Alunos Cadastrados</h2>
          {isLoadingAlunos ? (
            <p className="font-bold text-center">Carregando...</p>
          ) : alunos.length === 0 ? (
            <p className="font-bold text-gray-600 border-2 border-dashed border-black p-4 text-center">Nenhum aluno cadastrado.</p>
          ) : (
            <div className="space-y-2">
              {alunos.map(a => (
                <button
                  key={a.id}
                  onClick={() => setAlunoSelecionado(a)}
                  className="card-brutal w-full text-left bg-white hover:bg-neo-bg cursor-pointer transition-colors"
                >
                  <p className="font-black">{a.email}</p>
                  <p className="text-xs font-bold text-gray-600 uppercase mt-1">
                    {a.semestreAtivo ? `Semestre ativo: ${a.semestreAtivo.nome}` : 'Sem semestre cadastrado'}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Seção 2 — Disciplinas Globais */}
        <section>
          <h2 className="text-xl font-black uppercase mb-4">Disciplinas Globais</h2>
          {isLoadingGlobais ? (
            <p className="font-bold text-center">Carregando...</p>
          ) : disciplinasGlobais.length === 0 ? (
            <p className="font-bold text-gray-600 border-2 border-dashed border-black p-4 text-center">Nenhuma disciplina cadastrada.</p>
          ) : (
            <div className="space-y-4">
              {disciplinasGlobais.map(d => (
                <div key={d.id} className="card-brutal bg-white">
                  {editandoDisciplinaId === d.id ? (
                    <div className="flex gap-2 mb-2">
                      <input
                        value={nomeEditado}
                        onChange={e => setNomeEditado(e.target.value)}
                        className="flex-1 border-2 border-black p-1 font-bold focus:outline-none"
                        autoFocus
                      />
                      <button onClick={() => handleSalvarDisciplina(d.id)} className="btn-brutal bg-neo-green text-black text-xs px-2 py-1">OK</button>
                      <button onClick={() => setEditandoDisciplinaId(null)} className="btn-brutal bg-white text-xs px-2 py-1">X</button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-black text-lg uppercase leading-tight">{d.nome}</h3>
                      <button
                        onClick={() => { setEditandoDisciplinaId(d.id); setNomeEditado(d.nome); }}
                        className="text-xs font-bold underline cursor-pointer whitespace-nowrap ml-2"
                      >
                        EDITAR
                      </button>
                    </div>
                  )}

                  {editandoProfessorId === d.professores.id ? (
                    <div className="flex gap-2">
                      <input
                        value={nomeProfessorEditado}
                        onChange={e => setNomeProfessorEditado(e.target.value)}
                        className="flex-1 border-2 border-black p-1 text-sm focus:outline-none"
                        autoFocus
                      />
                      <button onClick={() => handleSalvarProfessor(d.professores.id)} className="btn-brutal bg-neo-green text-black text-xs px-2 py-1">OK</button>
                      <button onClick={() => setEditandoProfessorId(null)} className="btn-brutal bg-white text-xs px-2 py-1">X</button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-bold text-gray-600">Prof. {d.professores.nome}</p>
                      <button
                        onClick={() => { setEditandoProfessorId(d.professores.id); setNomeProfessorEditado(d.professores.nome); }}
                        className="text-xs font-bold underline cursor-pointer whitespace-nowrap ml-2"
                      >
                        EDITAR PROF.
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modal — grade completa do aluno (somente leitura) */}
      {alunoSelecionado && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="card-brutal bg-white w-full max-w-sm max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4 border-b-2 border-black pb-3">
              <div>
                <h2 className="text-lg font-black uppercase leading-tight break-all">{alunoSelecionado.email}</h2>
                <p className="text-xs font-bold text-gray-600 uppercase mt-1">
                  {alunoSelecionado.semestreAtivo ? alunoSelecionado.semestreAtivo.nome : 'Sem semestre'}
                </p>
              </div>
              <button onClick={() => setAlunoSelecionado(null)} className="font-black text-2xl leading-none cursor-pointer ml-2">×</button>
            </div>

            {isLoadingGrade ? (
              <p className="font-bold text-center">Carregando grade...</p>
            ) : !alunoSelecionado.semestreAtivo ? (
              <p className="font-bold text-gray-600 text-center">Aluno sem semestre cadastrado.</p>
            ) : gradeAluno.length === 0 ? (
              <p className="font-bold text-gray-600 text-center">Nenhuma disciplina cadastrada neste semestre.</p>
            ) : (
              <div className="space-y-3">
                {gradeAluno.map(disc => (
                  <div key={disc.id} className="border-2 border-black p-3">
                    <h3 className="font-black uppercase">{disc.disciplinas_globais.nome}</h3>
                    <p className="text-xs font-bold text-gray-600">Prof. {disc.disciplinas_globais.professores.nome} • {disc.horario_inicio}</p>
                    <p className="text-xs font-black mt-1">FALTAS: {disc.faltasAtuais} / {disc.limite_faltas}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
