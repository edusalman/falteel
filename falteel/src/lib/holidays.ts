// Caminho: ./src/lib/holidays.ts

// Feriados fixos locais (MM-DD)
const FERIADOS_LORENA_SP = [
  { data: '07-09', nome: 'Revolução Constitucionalista (SP)' },
  { data: '08-15', nome: 'Padroeira de Lorena' },
  { data: '11-14', nome: 'Aniversário de Lorena' },
];

interface FeriadoBrasilApi {
  date: string;
  name: string;
  type: string;
}

export async function checkIsHoliday(data: Date): Promise<{ isHoliday: boolean; nome?: string }> {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  const mesDia = `${mes}-${dia}`;

  // 1. Checa feriados locais
  const feriadoLocal = FERIADOS_LORENA_SP.find(f => f.data === mesDia);
  if (feriadoLocal) {
    return { isHoliday: true, nome: feriadoLocal.nome };
  }

  // 2. Checa Brasil API
  try {
    const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`);
    if (response.ok) {
      const feriadosNacionais = await response.json() as FeriadoBrasilApi[];
      const feriadoNacional = feriadosNacionais.find((f) => f.date === `${ano}-${mes}-${dia}`);
      if (feriadoNacional) {
        return { isHoliday: true, nome: feriadoNacional.name };
      }
    }
  } catch (error) {
    console.error("Erro ao buscar feriados na Brasil API", error);
  }

  return { isHoliday: false };
}