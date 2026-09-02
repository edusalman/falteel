// Caminho: ./src/hooks/useAdminDisciplinasGlobais.ts
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

export type DisciplinaGlobalComProfessor = Database['public']['Tables']['disciplinas_globais']['Row'] & {
  professores: { id: string; nome: string };
};

export function useAdminDisciplinasGlobais() {
  const [disciplinas, setDisciplinas] = useState<DisciplinaGlobalComProfessor[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDisciplinas = useCallback(async () => {
    setIsLoading(true);

    const { data } = await supabase
      .from('disciplinas_globais')
      .select('*, professores ( id, nome )')
      .order('nome');

    setDisciplinas((data ?? []) as unknown as DisciplinaGlobalComProfessor[]);
    setIsLoading(false);
  }, []);

  const renomearDisciplina = async (id: string, novoNome: string) => {
    const { error } = await supabase.from('disciplinas_globais').update({ nome: novoNome }).eq('id', id);
    if (!error) await fetchDisciplinas();
    return { error };
  };

  const renomearProfessor = async (id: string, novoNome: string) => {
    const { error } = await supabase.from('professores').update({ nome: novoNome }).eq('id', id);
    if (!error) await fetchDisciplinas();
    return { error };
  };

  return { disciplinas, isLoading, fetchDisciplinas, renomearDisciplina, renomearProfessor };
}
