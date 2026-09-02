// Caminho: ./src/hooks/useAdminAlunos.ts
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type Semestre = Database['public']['Tables']['semestres']['Row'];

export interface AlunoComSemestreAtivo {
  id: string;
  email: string;
  semestreAtivo: Semestre | null;
}

function calcularSemestreAtivo(semestresDoAluno: Semestre[]): Semestre | null {
  if (semestresDoAluno.length === 0) return null;

  const hoje = new Date().toISOString().split('T')[0];
  const ativo = semestresDoAluno.find(s => hoje >= s.data_inicio && hoje <= s.data_fim);
  if (ativo) return ativo;

  return [...semestresDoAluno].sort((a, b) => b.data_inicio.localeCompare(a.data_inicio))[0];
}

export function useAdminAlunos() {
  const [alunos, setAlunos] = useState<AlunoComSemestreAtivo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAlunos = useCallback(async () => {
    setIsLoading(true);

    const [{ data: profiles }, { data: semestres }] = await Promise.all([
      supabase.from('profiles').select('id, email').order('email'),
      supabase.from('semestres').select('*'),
    ]);

    if (profiles) {
      const semestresPorUsuario = new Map<string, Semestre[]>();
      (semestres ?? []).forEach((s) => {
        const lista = semestresPorUsuario.get(s.user_id) ?? [];
        lista.push(s);
        semestresPorUsuario.set(s.user_id, lista);
      });

      setAlunos(profiles.map((p) => ({
        id: p.id,
        email: p.email,
        semestreAtivo: calcularSemestreAtivo(semestresPorUsuario.get(p.id) ?? []),
      })));
    } else {
      setAlunos([]);
    }

    setIsLoading(false);
  }, []);

  return { alunos, isLoading, fetchAlunos };
}
