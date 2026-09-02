// Caminho: ./src/lib/notificacoes.ts
import type { Database } from '../types/database.types';

type TipoAula = Database['public']['Tables']['disciplinas_usuario']['Row']['tipo_aula'];
type NotificationTiming = Database['public']['Tables']['profiles']['Row']['notification_timing'];

const DURACAO_MIN: Record<TipoAula, number> = {
  simples: 100, // 1h40
  dobradinha: 220, // 3h40 (inclui 20min de intervalo)
};

function comHorario(horarioInicio: string, referencia: Date): Date {
  const [h, m] = horarioInicio.split(':').map(Number);
  const data = new Date(referencia);
  data.setHours(h, m, 0, 0);
  return data;
}

export function calcularHorarioFim(horarioInicio: string, tipoAula: TipoAula, referencia: Date = new Date()): Date {
  const inicio = comHorario(horarioInicio, referencia);
  return new Date(inicio.getTime() + DURACAO_MIN[tipoAula] * 60_000);
}

// Momento em que a notificação deve disparar, conforme a preferência do usuário
export function calcularHorarioNotificacao(
  horarioInicio: string,
  tipoAula: TipoAula,
  timing: NotificationTiming,
  referencia: Date = new Date(),
): Date {
  const inicio = comHorario(horarioInicio, referencia);

  if (timing === 'before') return new Date(inicio.getTime() - 15 * 60_000);
  if (timing === 'during') return new Date(inicio.getTime() + 15 * 60_000);
  return new Date(calcularHorarioFim(horarioInicio, tipoAula, referencia).getTime() + 15 * 60_000);
}

export function mensagemNotificacao(nomeDisciplina: string): string {
  return `Sua aula de ${nomeDisciplina} está rolando. Você foi ou faltou?`;
}
