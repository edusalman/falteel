// Caminho: ./src/components/GradeCalendario.tsx
import type { DisciplinaUsuario } from '../hooks/useDisciplinas';

const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']; // índices reais na base: 1..6 (Dom=0 não é usado)
const DURACAO_MIN: Record<'simples' | 'dobradinha', number> = { simples: 100, dobradinha: 220 };
const CORES = ['bg-neo-green', 'bg-neo-blue', 'bg-neo-yellow'];

function paraMinutos(horario: string): number {
  const [h, m] = horario.split(':').map(Number);
  return h * 60 + m;
}

function formatarHora(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

interface GradeCalendarioProps {
  disciplinas: DisciplinaUsuario[];
}

export function GradeCalendario({ disciplinas }: GradeCalendarioProps) {
  if (disciplinas.length === 0) {
    return (
      <p className="font-bold text-gray-600 border-2 border-dashed border-black p-4 text-center">
        Nenhuma matéria adicionada.
      </p>
    );
  }

  const inicios = disciplinas.map((d) => paraMinutos(d.horario_inicio));
  const fins = disciplinas.map((d) => paraMinutos(d.horario_inicio) + DURACAO_MIN[d.tipo_aula]);
  const rangeInicio = Math.max(0, Math.floor(Math.min(...inicios) / 60) * 60 - 30);
  const rangeFim = Math.min(24 * 60, Math.ceil(Math.max(...fins) / 60) * 60 + 30);
  const totalMinutos = rangeFim - rangeInicio;

  const horasLabel: number[] = [];
  for (let h = Math.ceil(rangeInicio / 60); h <= Math.floor(rangeFim / 60); h++) {
    horasLabel.push(h * 60);
  }

  const corPorDisciplina = new Map<string, string>();
  let corIndex = 0;
  disciplinas.forEach((d) => {
    if (!corPorDisciplina.has(d.disciplina_global_id)) {
      corPorDisciplina.set(d.disciplina_global_id, CORES[corIndex % CORES.length]);
      corIndex++;
    }
  });

  return (
    <div className="border-2 border-black bg-white overflow-x-auto">
      <div style={{ minWidth: '560px' }}>
        {/* Cabeçalho dos dias */}
        <div className="flex border-b-2 border-black">
          <div className="w-12 shrink-0" />
          {DIAS.map((dia) => (
            <div key={dia} className="flex-1 text-center text-xs font-black uppercase bg-neo-bg border-l-2 border-black py-1">
              {dia}
            </div>
          ))}
        </div>

        {/* Corpo da grade */}
        <div className="flex relative" style={{ height: `${totalMinutos}px` }}>
          {/* Coluna de horários */}
          <div className="w-12 shrink-0 border-r-2 border-black relative">
            {horasLabel.map((min) => (
              <div
                key={min}
                className="absolute left-0 right-0 text-[10px] font-bold text-gray-500 pl-1 -translate-y-1/2"
                style={{ top: `${min - rangeInicio}px` }}
              >
                {formatarHora(min)}
              </div>
            ))}
          </div>

          {/* Colunas dos dias */}
          {DIAS.map((dia, i) => {
            const diaIndex = i + 1; // Seg=1 ... Sáb=6
            const disciplinasDoDia = disciplinas.filter((d) => d.dias_semana.includes(diaIndex));
            return (
              <div key={dia} className="flex-1 border-l-2 border-black relative">
                {horasLabel.map((min) => (
                  <div key={min} className="absolute left-0 right-0 border-t border-gray-200" style={{ top: `${min - rangeInicio}px` }} />
                ))}
                {disciplinasDoDia.map((d) => {
                  const inicio = paraMinutos(d.horario_inicio);
                  const duracao = DURACAO_MIN[d.tipo_aula];
                  return (
                    <div
                      key={d.id}
                      className={`absolute left-0.5 right-0.5 border-2 border-black p-1 overflow-hidden text-black ${corPorDisciplina.get(d.disciplina_global_id)}`}
                      style={{ top: `${inicio - rangeInicio}px`, height: `${duracao}px` }}
                    >
                      <p className="text-[10px] font-black uppercase leading-tight truncate">{d.disciplinas_globais.nome}</p>
                      <p className="text-[9px] font-bold">{d.horario_inicio}</p>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
