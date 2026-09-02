// Caminho: ./src/hooks/useFocoDiario.ts
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/useAuth';
import { useSemestres } from './useSemestres';
import { checkIsHoliday } from '../lib/holidays';
import type { Database } from '../types/database.types';

type DisciplinaUsuarioRow = Database['public']['Tables']['disciplinas_usuario']['Row'];
type StatusAula = Database['public']['Tables']['registros_aula']['Row']['status'];

export interface RegistroDoDia {
  id: string;
  status: StatusAula;
  justificativa: string | null;
}

export interface AulaDoDia extends DisciplinaUsuarioRow {
  disciplinas_globais: { nome: string; professores: { nome: string } };
  faltasAtuais: number;
  faltasRestantes: number;
  registroDoDia: RegistroDoDia | null;
}

function addDias(data: Date, delta: number): Date {
  const nova = new Date(data);
  nova.setDate(nova.getDate() + delta);
  return nova;
}

function mesmoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function paraISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export interface ProximaAula {
  data: Date;
  nomes: string[];
}

const LIMITE_DIAS_BUSCA_PROXIMA_AULA = 21;

// Olha os próximos dias (pulando fim de semana e feriado) até achar um que tenha
// alguma disciplina da grade — usado quando hoje não tem nenhuma aula
async function buscarProximaAulaValida(userId: string, semestreId: string, dataBase: Date): Promise<ProximaAula | null> {
  const { data: todasDisciplinas } = await supabase
    .from('disciplinas_usuario')
    .select('dias_semana, disciplinas_globais ( nome )')
    .eq('user_id', userId)
    .eq('semestre_id', semestreId);

  if (!todasDisciplinas || todasDisciplinas.length === 0) return null;

  for (let i = 1; i <= LIMITE_DIAS_BUSCA_PROXIMA_AULA; i++) {
    const candidata = addDias(dataBase, i);
    const diaSemanaCandidata = candidata.getDay();
    if (diaSemanaCandidata === 0 || diaSemanaCandidata === 6) continue;

    const feriado = await checkIsHoliday(candidata);
    if (feriado.isHoliday) continue;

    const nomes = todasDisciplinas
      .filter((d) => d.dias_semana.includes(diaSemanaCandidata))
      .map((d) => (d as unknown as { disciplinas_globais: { nome: string } }).disciplinas_globais.nome);

    if (nomes.length > 0) {
      return { data: candidata, nomes };
    }
  }

  return null;
}

export function useFocoDiario() {
  const { user } = useAuth();
  const { semestreAtivo, fetchSemestres } = useSemestres();

  const [dataAtual, setDataAtual] = useState(new Date());
  const [isFeriado, setIsFeriado] = useState(false);
  const [nomeFeriado, setNomeFeriado] = useState('');
  const [aulasHoje, setAulasHoje] = useState<AulaDoDia[]>([]);
  const [proximaAula, setProximaAula] = useState<ProximaAula | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isHoje = mesmoDia(dataAtual, new Date());

  const carregarFocoDiario = useCallback(async () => {
    if (!user || !semestreAtivo) return;
    setIsLoading(true);

    const diaSemana = dataAtual.getDay(); // 0 = Dom, 1 = Seg...
    const dataISO = paraISO(dataAtual);

    // Verifica se é feriado
    const feriadoCheck = await checkIsHoliday(dataAtual);
    if (feriadoCheck.isHoliday) {
      setIsFeriado(true);
      setNomeFeriado(feriadoCheck.nome || 'Feriado');
    } else {
      setIsFeriado(false);
    }

    // Busca disciplinas do usuário que caem no dia da semana selecionado
    const { data: disciplinas } = await supabase
      .from('disciplinas_usuario')
      .select(`
        *,
        disciplinas_globais ( nome, professores ( nome ) )
      `)
      .eq('user_id', user.id)
      .eq('semestre_id', semestreAtivo.id)
      .contains('dias_semana', [diaSemana]);

    let listaOrdenada: AulaDoDia[] = [];

    if (disciplinas) {
      // Para cada disciplina, busca o total de faltas (regra do limite) e o registro do dia selecionado
      const aulasComStatus = await Promise.all(disciplinas.map(async (disc) => {
        const { data: registros } = await supabase
          .from('registros_aula')
          .select('status')
          .eq('disciplina_usuario_id', disc.id)
          .eq('status', 'falta'); // Só conta as faltas

        const { data: registroDoDia } = await supabase
          .from('registros_aula')
          .select('id, status, justificativa')
          .eq('disciplina_usuario_id', disc.id)
          .eq('data', dataISO)
          .maybeSingle();

        const faltasAtuais = registros?.length || 0;
        const faltasRestantes = disc.limite_faltas - faltasAtuais;

        return {
          ...disc,
          faltasAtuais,
          faltasRestantes,
          registroDoDia: registroDoDia ?? null,
        } as AulaDoDia;
      }));

      // Ordena pelo horário de início
      listaOrdenada = aulasComStatus.sort((a, b) => a.horario_inicio.localeCompare(b.horario_inicio));
      setAulasHoje(listaOrdenada);
    }

    // Se hoje não tem nenhuma aula (e não é feriado/fim de semana), sugere a próxima aula válida
    const ehFimDeSemana = diaSemana === 0 || diaSemana === 6;
    if (isHoje && listaOrdenada.length === 0 && !feriadoCheck.isHoliday && !ehFimDeSemana) {
      setProximaAula(await buscarProximaAulaValida(user.id, semestreAtivo.id, dataAtual));
    } else {
      setProximaAula(null);
    }

    setIsLoading(false);
  }, [user, semestreAtivo, dataAtual, isHoje]);

  // Registra ou edita (upsert) o status de uma aula no dia selecionado
  const registrarAula = async (disciplinaUsuarioId: string, status: StatusAula, justificativa: string = '') => {
    const dataISO = paraISO(dataAtual);
    const aula = aulasHoje.find(a => a.id === disciplinaUsuarioId);

    const { error } = aula?.registroDoDia
      ? await supabase
          .from('registros_aula')
          .update({ status, justificativa: justificativa || null, updated_at: new Date().toISOString() })
          .eq('id', aula.registroDoDia.id)
      : await supabase
          .from('registros_aula')
          .insert([{
            user_id: user!.id,
            disciplina_usuario_id: disciplinaUsuarioId,
            data: dataISO,
            status,
            justificativa: justificativa || null,
          }]);

    if (!error) {
      await carregarFocoDiario(); // Recarrega para atualizar os contadores e o status do dia
    } else {
      alert('Erro ao registrar a aula. Tente novamente.');
    }
  };

  const diaAnterior = () => setDataAtual(prev => addDias(prev, -1));
  const diaSeguinte = () => {
    if (!isHoje) setDataAtual(prev => addDias(prev, 1));
  };
  const irParaHoje = () => setDataAtual(new Date());

  // Pula direto pra uma data (nunca deixa ir pro futuro — não dá pra marcar presença de algo que não aconteceu)
  const irParaData = (novaData: Date) => {
    if (paraISO(novaData) > paraISO(new Date())) return;
    setDataAtual(novaData);
  };

  return {
    dataAtual,
    isHoje,
    isFeriado,
    nomeFeriado,
    aulasHoje,
    proximaAula,
    isLoading,
    registrarAula,
    diaAnterior,
    diaSeguinte,
    irParaHoje,
    irParaData,
    carregarFocoDiario,
    fetchSemestres,
  };
}
