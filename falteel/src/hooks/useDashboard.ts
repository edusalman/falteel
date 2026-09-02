// Caminho: ./src/hooks/useDashboard.ts
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/useAuth';
import type { Database } from '../types/database.types';

export type DisciplinaComProgresso = Database['public']['Tables']['disciplinas_usuario']['Row'] & {
  disciplinas_globais: { nome: string; professores: { nome: string } };
  faltasAtuais: number;
  faltasRestantes: number;
};

export function useDashboard(semestreId: string | null) {
  const { user } = useAuth();
  const [disciplinas, setDisciplinas] = useState<DisciplinaComProgresso[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const carregar = useCallback(async () => {
    if (!user || !semestreId) {
      setDisciplinas([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    const { data: disciplinasUsuario } = await supabase
      .from('disciplinas_usuario')
      .select(`
        *,
        disciplinas_globais ( nome, professores ( nome ) )
      `)
      .eq('user_id', user.id)
      .eq('semestre_id', semestreId);

    if (disciplinasUsuario) {
      const comProgresso = await Promise.all(disciplinasUsuario.map(async (disc) => {
        const { data: registros } = await supabase
          .from('registros_aula')
          .select('status')
          .eq('disciplina_usuario_id', disc.id)
          .eq('status', 'falta');

        const faltasAtuais = registros?.length || 0;

        return {
          ...disc,
          faltasAtuais,
          faltasRestantes: disc.limite_faltas - faltasAtuais,
        } as DisciplinaComProgresso;
      }));

      setDisciplinas(comProgresso.sort((a, b) => a.disciplinas_globais.nome.localeCompare(b.disciplinas_globais.nome)));
    } else {
      setDisciplinas([]);
    }

    setIsLoading(false);
  }, [user, semestreId]);

  return { disciplinas, isLoading, carregar };
}
