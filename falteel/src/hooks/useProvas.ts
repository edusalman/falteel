// Caminho: ./src/hooks/useProvas.ts
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/useAuth';
import type { Database } from '../types/database.types';

type RegistroAulaRow = Database['public']['Tables']['registros_aula']['Row'];

export interface DisciplinaDaProva {
  id: string;
  horario_inicio: string;
  disciplinas_globais: { nome: string };
}

export interface ProvaMarcada extends RegistroAulaRow {
  disciplinaUsuario: DisciplinaDaProva | undefined;
}

function paraISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

// Provas são registros_aula com status='prova' e data hoje-ou-futuro. Reaproveitar a
// mesma tabela (em vez de criar uma nova) significa que, no dia marcado, o Home já
// mostra "Registrado: Dia de Prova", a notificação daquele dia já não dispara e a
// prova já não conta como falta — tudo isso de graça, sem lógica nova.
export function useProvas(semestreId: string | null) {
  const { user } = useAuth();
  const [provas, setProvas] = useState<ProvaMarcada[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProvas = useCallback(async () => {
    if (!user || !semestreId) {
      setProvas([]);
      return;
    }
    setIsLoading(true);

    const { data: disciplinas } = await supabase
      .from('disciplinas_usuario')
      .select('id, horario_inicio, disciplinas_globais ( nome )')
      .eq('user_id', user.id)
      .eq('semestre_id', semestreId);

    const listaDisciplinas = (disciplinas ?? []) as unknown as DisciplinaDaProva[];

    if (listaDisciplinas.length === 0) {
      setProvas([]);
      setIsLoading(false);
      return;
    }

    const idsDisciplinas = listaDisciplinas.map((d) => d.id);
    const disciplinasPorId = new Map(listaDisciplinas.map((d) => [d.id, d]));

    const { data: registros } = await supabase
      .from('registros_aula')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'prova')
      .gte('data', paraISO(new Date()))
      .in('disciplina_usuario_id', idsDisciplinas)
      .order('data', { ascending: true });

    setProvas((registros ?? []).map((r) => ({
      ...r,
      disciplinaUsuario: disciplinasPorId.get(r.disciplina_usuario_id),
    })));

    setIsLoading(false);
  }, [user, semestreId]);

  const marcarProva = async (disciplinaUsuarioId: string, data: string, observacao: string) => {
    if (!user) return { error: 'Usuário não logado' };

    const { data: existente } = await supabase
      .from('registros_aula')
      .select('id')
      .eq('disciplina_usuario_id', disciplinaUsuarioId)
      .eq('data', data)
      .maybeSingle();

    const { error } = existente
      ? await supabase
          .from('registros_aula')
          .update({ status: 'prova', justificativa: observacao || null, updated_at: new Date().toISOString() })
          .eq('id', existente.id)
      : await supabase
          .from('registros_aula')
          .insert([{
            user_id: user.id,
            disciplina_usuario_id: disciplinaUsuarioId,
            data,
            status: 'prova',
            justificativa: observacao || null,
          }]);

    if (!error) await fetchProvas();
    return { error: error ? 'Falha ao marcar prova' : null };
  };

  const cancelarProva = async (id: string) => {
    const { error } = await supabase.from('registros_aula').delete().eq('id', id);
    if (!error) await fetchProvas();
    return { error: error ? 'Falha ao cancelar prova' : null };
  };

  return { provas, isLoading, fetchProvas, marcarProva, cancelarProva };
}
