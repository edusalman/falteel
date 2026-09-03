// Caminho: ./src/components/AutocompleteInput.tsx
import { useState, useEffect, useRef } from 'react';

export interface Sugestao {
  id: string;
  label: string;
}

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  buscarSugestoes: (termo: string) => Promise<Sugestao[]>;
  placeholder?: string;
  required?: boolean;
}

// Input de texto comum com uma lista de sugestões que busca (com debounce) enquanto
// o usuário digita. Selecionar uma sugestão só preenche o campo com o nome exato —
// o cadastro em si continua usando o mesmo match por nome que já existia.
export function AutocompleteInput({ value, onChange, buscarSugestoes, placeholder, required }: AutocompleteInputProps) {
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const termo = value.trim();
    if (termo.length < 2) return; // a renderização já esconde a lista nesse caso

    const timeout = setTimeout(async () => {
      setCarregando(true);
      const resultado = await buscarSugestoes(termo);
      setSugestoes(resultado);
      setCarregando(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [value, buscarSugestoes]);

  useEffect(() => {
    const handleClickFora = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    };
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        required={required}
        value={value}
        onChange={(e) => { onChange(e.target.value); setAberto(true); }}
        onFocus={() => setAberto(true)}
        onKeyDown={(e) => { if (e.key === 'Escape') setAberto(false); }}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full border-2 border-black p-2 focus:outline-none focus:shadow-brutal transition-shadow bg-white"
      />
      {aberto && value.trim().length >= 2 && (sugestoes.length > 0 || carregando) && (
        <div className="absolute z-20 left-0 right-0 mt-1 border-2 border-black bg-white shadow-brutal max-h-48 overflow-y-auto">
          {carregando ? (
            <p className="p-2 text-sm font-bold text-gray-500">Buscando...</p>
          ) : (
            sugestoes.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => { onChange(s.label); setAberto(false); }}
                className="w-full text-left px-2 py-2 font-bold text-sm hover:bg-neo-bg border-b border-black last:border-b-0 cursor-pointer"
              >
                {s.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
