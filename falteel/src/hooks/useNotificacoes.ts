// Caminho: ./src/hooks/useNotificacoes.ts
import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/useAuth';
import { useSemestres } from './useSemestres';
import { checkIsHoliday } from '../lib/holidays';
import { calcularHorarioFim, calcularHorarioNotificacao, mensagemNotificacao } from '../lib/notificacoes';
import type { Database } from '../types/database.types';

type DisciplinaComNome = Database['public']['Tables']['disciplinas_usuario']['Row'] & {
  disciplinas_globais: { nome: string };
};

const INTERVALO_VERIFICACAO_MS = 60_000;
const TOLERANCIA_ATRASO_MIN = 30;

function paraISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function chaveNotificado(disciplinaId: string, dataISO: string): string {
  return `falteel:notificado:${disciplinaId}:${dataISO}`;
}

function jaNotificouHoje(disciplinaId: string, dataISO: string): boolean {
  try {
    return localStorage.getItem(chaveNotificado(disciplinaId, dataISO)) === '1';
  } catch {
    return false;
  }
}

function marcarNotificado(disciplinaId: string, dataISO: string): void {
  try {
    localStorage.setItem(chaveNotificado(disciplinaId, dataISO), '1');
  } catch {
    // localStorage indisponível — na pior hipótese a notificação repete, sem problema
  }
}

async function dispararNotificacao(titulo: string, corpo: string): Promise<void> {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

  const registration = await navigator.serviceWorker?.getRegistration();
  if (registration) {
    await registration.showNotification(titulo, { body: corpo });
  } else {
    new Notification(titulo, { body: corpo });
  }
}

// Verificação local (sem backend): a cada minuto, cruza a hora atual com a
// grade do dia e dispara no máximo uma notificação por disciplina por dia.
// Só funciona enquanto o app está aberto em alguma aba — não é push real.
export function useNotificacoes() {
  const { user, profile } = useAuth();
  const { semestreAtivo, fetchSemestres } = useSemestres();

  useEffect(() => {
    fetchSemestres();
  }, [fetchSemestres]);

  const verificar = useCallback(async () => {
    if (!user || !profile || !semestreAtivo) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    const agora = new Date();
    const diaSemana = agora.getDay();
    if (diaSemana === 0 || diaSemana === 6) return; // fim de semana

    const feriado = await checkIsHoliday(agora);
    if (feriado.isHoliday) return;

    const dataISO = paraISO(agora);

    const { data } = await supabase
      .from('disciplinas_usuario')
      .select(`*, disciplinas_globais ( nome )`)
      .eq('user_id', user.id)
      .eq('semestre_id', semestreAtivo.id)
      .contains('dias_semana', [diaSemana]);

    const disciplinas = (data ?? []) as unknown as DisciplinaComNome[];

    for (const disc of disciplinas) {
      if (jaNotificouHoje(disc.id, dataISO)) continue;

      const horarioAlvo = calcularHorarioNotificacao(disc.horario_inicio, disc.tipo_aula, profile.notification_timing, agora);
      const limiteAtraso = new Date(
        calcularHorarioFim(disc.horario_inicio, disc.tipo_aula, agora).getTime() + TOLERANCIA_ATRASO_MIN * 60_000,
      );

      if (agora < horarioAlvo || agora > limiteAtraso) continue;

      // Já tem registro pra hoje (presente, falta, cancelada, greve ou prova) — não notifica
      const { data: registro } = await supabase
        .from('registros_aula')
        .select('id')
        .eq('disciplina_usuario_id', disc.id)
        .eq('data', dataISO)
        .maybeSingle();

      if (registro) continue;

      await dispararNotificacao('FaltEEL', mensagemNotificacao(disc.disciplinas_globais.nome));
      marcarNotificado(disc.id, dataISO);
    }
  }, [user, profile, semestreAtivo]);

  useEffect(() => {
    verificar();
    const intervalo = setInterval(verificar, INTERVALO_VERIFICACAO_MS);
    return () => clearInterval(intervalo);
  }, [verificar]);
}
