// ============================================================
// MODELOS DEL SISTEMA - Casa de la Cultura Municipal
// ============================================================

export interface Usuario {
  id: number;
  username: string;
  password: string;
  nombre: string;
  rol: 'admin' | 'operador';
  activo: boolean;
  createdAt: Date;
}

export interface Disciplina {
  id: number;
  nombre: string;
  descripcion: string;
  color: string;
  icono: string;
}

export interface Salon {
  id: number;
  nombre: string;
  capacidad: number;
  equipamiento: string;
  disponible: boolean;
}

export interface Instructor {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  disciplinaId: number;
  disciplina?: Disciplina;
  tipo: 'voluntario' | 'contratado';
  activo: boolean;
  fechaIngreso: string;
}

export interface Taller {
  id: number;
  nombre: string;
  disciplinaId: number;
  disciplina?: Disciplina;
  instructorId: number;
  instructor?: Instructor;
  salonId: number;
  salon?: Salon;
  horario: string;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  cupoMaximo: number;
  cupoActual: number;
  trimestre: string;
  activo: boolean;
}

export interface Participante {
  id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
  edad: number;
  barrio: string;
  activo: boolean;
}

export interface Inscripcion {
  id: number;
  participanteId: number;
  participante?: Participante;
  tallerId: number;
  taller?: Taller;
  fechaInscripcion: string;
  estado: 'activa' | 'retirada' | 'completada';
}

export interface SesionTaller {
  id: number;
  tallerId: number;
  taller?: Taller;
  fecha: string;
  tema: string;
  observaciones: string;
}

export interface Asistencia {
  id: number;
  sesionId: number;
  sesion?: SesionTaller;
  participanteId: number;
  participante?: Participante;
  asistio: boolean;
  observacion: string;
}

export interface Material {
  id: number;
  nombre: string;
  descripcion: string;
  cantidadDisponible: number;
  costoUnitario: number;
  unidad: string;
  categoria: string;
}

export interface UsoMaterial {
  id: number;
  materialId: number;
  material?: Material;
  tallerId: number;
  taller?: Taller;
  fecha: string;
  cantidadUsada: number;
  observaciones: string;
}

export interface ReporteParticipantesTaller {
  tallerId: number;
  tallerNombre: string;
  disciplinaNombre: string;
  instructorNombre: string;
  salonNombre: string;
  horario: string;
  totalInscritos: number;
  cupoMaximo: number;
  disponibilidad: number;
}

export interface ReporteDisciplina {
  disciplinaId: number;
  disciplinaNombre: string;
  color: string;
  totalParticipantes: number;
  totalTalleres: number;
  totalInstructores: number;
}
