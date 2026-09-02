// Caminho: ./src/types/database.types.ts
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; email: string; notification_timing: 'before' | 'during' | 'after'; is_admin: boolean; created_at: string }
        Insert: { id: string; email: string; notification_timing?: 'before' | 'during' | 'after'; is_admin?: boolean; created_at?: string }
        Update: { id?: string; email?: string; notification_timing?: 'before' | 'during' | 'after'; is_admin?: boolean; created_at?: string }
        Relationships: []
      }
      semestres: {
        Row: { id: string; user_id: string; nome: string; data_inicio: string; data_fim: string; created_at: string }
        Insert: { id?: string; user_id: string; nome: string; data_inicio: string; data_fim: string; created_at?: string }
        Update: { id?: string; user_id?: string; nome?: string; data_inicio?: string; data_fim?: string; created_at?: string }
        Relationships: []
      }
      professores: {
        Row: { id: string; nome: string; created_by: string | null; created_at: string }
        Insert: { id?: string; nome: string; created_by?: string | null; created_at?: string }
        Update: { id?: string; nome?: string; created_by?: string | null; created_at?: string }
        Relationships: []
      }
      disciplinas_globais: {
        Row: { id: string; nome: string; professor_id: string; tipo_credito: 'simples' | 'duplo'; created_by: string | null; created_at: string }
        Insert: { id?: string; nome: string; professor_id: string; tipo_credito: 'simples' | 'duplo'; created_by?: string | null; created_at?: string }
        Update: { id?: string; nome?: string; professor_id?: string; tipo_credito?: 'simples' | 'duplo'; created_by?: string | null; created_at?: string }
        Relationships: [
          { foreignKeyName: "disciplinas_globais_professor_id_fkey", columns: ["professor_id"], referencedRelation: "professores", referencedColumns: ["id"] }
        ]
      }
      disciplinas_usuario: {
        Row: { id: string; user_id: string; semestre_id: string; disciplina_global_id: string; dias_semana: number[]; horario_inicio: string; tipo_aula: 'simples' | 'dobradinha'; limite_faltas: number; created_at: string }
        Insert: { id?: string; user_id: string; semestre_id: string; disciplina_global_id: string; dias_semana: number[]; horario_inicio: string; tipo_aula: 'simples' | 'dobradinha'; limite_faltas: number; created_at?: string }
        Update: { id?: string; user_id?: string; semestre_id?: string; disciplina_global_id?: string; dias_semana?: number[]; horario_inicio?: string; tipo_aula?: 'simples' | 'dobradinha'; limite_faltas?: number; created_at?: string }
        Relationships: [
          { foreignKeyName: "disciplinas_usuario_disciplina_global_id_fkey", columns: ["disciplina_global_id"], referencedRelation: "disciplinas_globais", referencedColumns: ["id"] },
          { foreignKeyName: "disciplinas_usuario_semestre_id_fkey", columns: ["semestre_id"], referencedRelation: "semestres", referencedColumns: ["id"] }
        ]
      }
      registros_aula: {
        Row: { id: string; user_id: string; disciplina_usuario_id: string; data: string; status: 'presente' | 'falta' | 'cancelada' | 'greve' | 'prova'; justificativa: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; disciplina_usuario_id: string; data: string; status: 'presente' | 'falta' | 'cancelada' | 'greve' | 'prova'; justificativa?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; disciplina_usuario_id?: string; data?: string; status?: 'presente' | 'falta' | 'cancelada' | 'greve' | 'prova'; justificativa?: string | null; created_at?: string; updated_at?: string }
        Relationships: [
          { foreignKeyName: "registros_aula_disciplina_usuario_id_fkey", columns: ["disciplina_usuario_id"], referencedRelation: "disciplinas_usuario", referencedColumns: ["id"] }
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: {
      notification_timing: 'before' | 'during' | 'after'
      tipo_credito: 'simples' | 'duplo'
      tipo_aula: 'simples' | 'dobradinha'
      status_aula: 'presente' | 'falta' | 'cancelada' | 'greve' | 'prova'
    }
    CompositeTypes: { [_ in never]: never }
  }
}