// Caminho: ./src/hooks/useDisciplinas.ts
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/useAuth';
import type { Database } from '../types/database.types';

export type DisciplinaUsuario = Database['public']['Tables']['disciplinas_usuario']['Row'] & {
  disciplinas_globais: {
    nome: string;
    tipo_credito: 'simples' | 'duplo';
    professores: { nome: string };
  };
};

function calcularLimiteFaltas(tipoCredito: 'simples' | 'duplo', tipoAula: 'simples' | 'dobradinha'): number {
  // Regra USP: só o caso "duplo + simples" (4 créditos em dois dias separados) foge do padrão de 4
  if (tipoCredito === 'duplo' && tipoAula === 'simples') return 8;
  return 4;
}

export function useDisciplinas(semestreId: string | null) {
  const { user } = useAuth();
  const [minhasDisciplinas, setMinhasDisciplinas] = useState<DisciplinaUsuario[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDisciplinas = useCallback(async () => {
    if (!user || !semestreId) return;
    setIsLoading(true);

    const { data, error } = await supabase
      .from('disciplinas_usuario')
      .select(`
        *,
        disciplinas_globais (
          nome,
          tipo_credito,
          professores ( nome )
        )
      `)
      .eq('user_id', user.id)
      .eq('semestre_id', semestreId);

    if (!error && data) {
      // O cast é necessário porque o Supabase retorna arrays complexos nos joins
      setMinhasDisciplinas(data as unknown as DisciplinaUsuario[]);
    }
    setIsLoading(false);
  }, [user, semestreId]);

  const adicionarDisciplina = async (
    nomeProfessor: string,
    nomeDisciplina: string,
    tipoCredito: 'simples' | 'duplo',
    tipoAula: 'simples' | 'dobradinha',
    diasSemana: number[],
    horarioInicio: string
  ) => {
    if (!user || !semestreId) return { error: 'Usuário ou semestre inválido' };

    try {
      // 1. Busca ou cria Professor (Crowdsourced)
      let professorId = '';
      const { data: profExistente } = await supabase.from('professores').select('id').ilike('nome', nomeProfessor).maybeSingle();
      
      if (profExistente) {
        professorId = profExistente.id;
      } else {
        const { data: novoProf, error: errProf } = await supabase.from('professores').insert([{ nome: nomeProfessor, created_by: user.id }]).select().single();
        if (errProf) throw errProf;
        professorId = novoProf.id;
      }

      // 2. Busca ou cria Disciplina Global (Crowdsourced)
      let disciplinaGlobalId = '';
      const { data: discExistente } = await supabase.from('disciplinas_globais').select('id')
        .ilike('nome', nomeDisciplina).eq('professor_id', professorId).maybeSingle();

      if (discExistente) {
        disciplinaGlobalId = discExistente.id;
      } else {
        const { data: novaDisc, error: errDisc } = await supabase.from('disciplinas_globais')
          .insert([{ nome: nomeDisciplina, professor_id: professorId, tipo_credito: tipoCredito, created_by: user.id }]).select().single();
        if (errDisc) throw errDisc;
        disciplinaGlobalId = novaDisc.id;
      }

      // 3. Calcula o Limite de Faltas (Regra USP)
      const limiteFaltas = calcularLimiteFaltas(tipoCredito, tipoAula);

      // 4. Insere na grade do usuário
      const { error: errGrade } = await supabase.from('disciplinas_usuario').insert([{
        user_id: user.id,
        semestre_id: semestreId,
        disciplina_global_id: disciplinaGlobalId,
        dias_semana: diasSemana,
        horario_inicio: horarioInicio,
        tipo_aula: tipoAula,
        limite_faltas: limiteFaltas
      }]);

      if (errGrade) throw errGrade;

      await fetchDisciplinas();
      return { error: null };
    } catch (err) {
      console.error(err);
      return { error: 'Falha ao cadastrar disciplina' };
    }
  };

  // Edita só os dados específicos da grade do usuário (dias, horário, tipo de aula) —
  // nome da matéria e do professor são compartilhados e não mudam por aqui
  const editarDisciplina = async (
    id: string,
    tipoCredito: 'simples' | 'duplo',
    tipoAula: 'simples' | 'dobradinha',
    diasSemana: number[],
    horarioInicio: string,
  ) => {
    const limiteFaltas = calcularLimiteFaltas(tipoCredito, tipoAula);

    const { error } = await supabase
      .from('disciplinas_usuario')
      .update({
        dias_semana: diasSemana,
        horario_inicio: horarioInicio,
        tipo_aula: tipoAula,
        limite_faltas: limiteFaltas,
      })
      .eq('id', id);

    if (!error) await fetchDisciplinas();
    return { error: error ? 'Falha ao editar disciplina' : null };
  };

  const excluirDisciplina = async (id: string) => {
    const { error } = await supabase.from('disciplinas_usuario').delete().eq('id', id);
    if (!error) await fetchDisciplinas();
    return { error: error ? 'Falha ao excluir disciplina' : null };
  };

  return { minhasDisciplinas, isLoading, fetchDisciplinas, adicionarDisciplina, editarDisciplina, excluirDisciplina };
}