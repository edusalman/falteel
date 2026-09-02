// Caminho: ./src/hooks/useAdminGradeAluno.ts
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

export type DisciplinaComFaltas = Database['public']['Tables']['disciplinas_usuario']['Row'] & {
  disciplinas_globais: { nome: string; professores: { nome: string } };
  faltasAtuais: number;
};

// Versão somente-leitura de useDashboard, para o admin ver a grade de QUALQUER aluno
export function useAdminGradeAluno(userId: string | null, semestreId: string | null) {
  const [disciplinas, setDisciplinas] = useState<DisciplinaComFaltas[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const carregar = useCallback(async () => {
    if (!userId || !semestreId) {
      setDisciplinas([]);
      return;
    }
    setIsLoading(true);

    const { data } = await supabase
      .from('disciplinas_usuario')
      .select(`
        *,
        disciplinas_globais ( nome, professores ( nome ) )
      `)
      .eq('user_id', userId)
      .eq('semestre_id', semestreId);

    if (data) {
      const comFaltas = await Promise.all(data.map(async (disc) => {
        const { data: registros } = await supabase
          .from('registros_aula')
          .select('status')
          .eq('disciplina_usuario_id', disc.id)
          .eq('status', 'falta');

        return { ...disc, faltasAtuais: registros?.length || 0 } as DisciplinaComFaltas;
      }));

      setDisciplinas(comFaltas.sort((a, b) => a.horario_inicio.localeCompare(b.horario_inicio)));
    } else {
      setDisciplinas([]);
    }

    setIsLoading(false);
  }, [userId, semestreId]);

  return { disciplinas, isLoading, carregar };
}
