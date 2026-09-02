// Caminho: ./src/hooks/useSemestres.ts
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/useAuth';
import type { Database } from '../types/database.types';

type Semestre = Database['public']['Tables']['semestres']['Row'];

export function useSemestres() {
  const { user } = useAuth();
  const [semestres, setSemestres] = useState<Semestre[]>([]);
  const [semestreAtivo, setSemestreAtivo] = useState<Semestre | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSemestres = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    const { data, error } = await supabase
      .from('semestres')
      .select('*')
      .eq('user_id', user.id)
      .order('data_inicio', { ascending: false });

    if (error) {
      console.error('Erro ao buscar semestres:', error);
    } else if (data) {
      setSemestres(data);

      // Regra: semestre ativo = aquele que contém a data atual.
      // Se nenhum, usa o mais recente.
      const hoje = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
      
      let ativo = data.find(s => hoje >= s.data_inicio && hoje <= s.data_fim);
      
      if (!ativo && data.length > 0) {
        // Como a query já ordenou por data_inicio decrescente, o index 0 é o mais recente
        ativo = data[0];
      }

      setSemestreAtivo(ativo || null);
    }
    
    setIsLoading(false);
  }, [user]);

  const criarSemestre = async (nome: string, dataInicio: string, dataFim: string) => {
    if (!user) return { error: 'Usuário não logado' };
    if (dataFim <= dataInicio) return { error: 'A data de fim precisa ser depois da data de início' };

    const { error } = await supabase
      .from('semestres')
      .insert([{
        user_id: user.id,
        nome,
        data_inicio: dataInicio,
        data_fim: dataFim
      }]);

    if (!error) {
      await fetchSemestres(); // Recarrega a lista para atualizar o estado
    }

    return { error: error ? error.message : null };
  };

  const editarSemestre = async (id: string, nome: string, dataInicio: string, dataFim: string) => {
    if (dataFim <= dataInicio) return { error: 'A data de fim precisa ser depois da data de início' };

    const { error } = await supabase
      .from('semestres')
      .update({ nome, data_inicio: dataInicio, data_fim: dataFim })
      .eq('id', id);

    if (!error) await fetchSemestres();
    return { error: error ? error.message : null };
  };

  const excluirSemestre = async (id: string) => {
    const { error } = await supabase.from('semestres').delete().eq('id', id);
    if (!error) await fetchSemestres();
    return { error: error ? error.message : null };
  };

  return { semestres, semestreAtivo, isLoading, criarSemestre, editarSemestre, excluirSemestre, fetchSemestres };
}