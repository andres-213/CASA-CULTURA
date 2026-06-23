import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  Usuario, Disciplina, Salon, Instructor, Taller,
  Participante, Inscripcion, SesionTaller, Asistencia,
  Material, UsoMaterial, ReporteParticipantesTaller, ReporteDisciplina
} from '../models/models';

type UpdateUsuarioPayload = Partial<Usuario> & { currentPassword?: string };

@Injectable({ providedIn: 'root' })
export class DataService {

  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  private normalizeTaller(t: any): Taller {
    return {
      id: t.id,
      nombre: t.nombre,
      disciplinaId: t.disciplinaId ?? t.disciplina_id,
      instructorId: t.instructorId ?? t.instructor_id,
      salonId: t.salonId ?? t.salon_id,
      horario: t.horario,
      diaSemana: t.diaSemana ?? t.dia_semana,
      horaInicio: t.horaInicio ?? t.hora_inicio,
      horaFin: t.horaFin ?? t.hora_fin,
      cupoMaximo: t.cupoMaximo ?? t.cupo_maximo,
      cupoActual: t.cupoActual ?? t.cupo_actual,
      trimestre: t.trimestre,
      activo: Boolean(t.activo),
      disciplina: t.disciplina || (t.disciplina_nombre ? {
        id: t.disciplinaId ?? t.disciplina_id,
        nombre: t.disciplina_nombre,
        descripcion: t.disciplina_descripcion ?? '',
        color: t.disciplina_color,
        icono: t.disciplina_icono ?? 'palette'
      } : undefined),
      instructor: t.instructor,
      salon: t.salon
    };
  }
  // AUTENTICACION
  login(username: string, password: string): Observable<Usuario | null> {
    return this.http.post<Usuario>(`${this.apiUrl}/login`, { username, password }).pipe(
      map(user => user || null)
    );
  }

  getUsuarioByUsername(username: string): Observable<Usuario | undefined> {
    return this.getUsuarios().pipe(
      map(users => users.find(u => u.username === username && u.activo))
    );
  }

  updateUsuarioPassword(username: string, password: string): Observable<boolean> {
    return this.getUsuarioByUsername(username).pipe(
      map(user => {
        if (user) {
          this.updateUsuario(user.id, { password }).subscribe();
          return true;
        }
        return false;
      })
    );
  }
  // USUARIOS
  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/usuarios`);
  }

  getUsuarioById(id: number): Observable<Usuario | undefined> {
    return this.http.get<Usuario>(`${this.apiUrl}/usuarios/${id}`).pipe(
      map(user => user || undefined)
    );
  }

  createUsuario(u: Omit<Usuario, 'id' | 'createdAt'>): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/usuarios`, u);
  }

  updateUsuario(id: number, data: UpdateUsuarioPayload): Observable<Usuario | null> {
    return this.http.put<Usuario>(`${this.apiUrl}/usuarios/${id}`, data);
  }

  deleteUsuario(id: number): Observable<boolean> {
    return this.http.delete(`${this.apiUrl}/usuarios/${id}`).pipe(
      map(() => true)
    );
  }
  // DISCIPLINAS
  getDisciplinas(): Observable<Disciplina[]> {
    return this.http.get<Disciplina[]>(`${this.apiUrl}/disciplinas`);
  }

  getDisciplinaById(id: number): Observable<Disciplina | undefined> {
    return this.http.get<Disciplina>(`${this.apiUrl}/disciplinas/${id}`).pipe(
      map(d => d || undefined)
    );
  }

  createDisciplina(d: Omit<Disciplina, 'id'>): Observable<Disciplina> {
    return this.http.post<Disciplina>(`${this.apiUrl}/disciplinas`, d);
  }

  updateDisciplina(id: number, data: Partial<Disciplina>): Observable<Disciplina | null> {
    return this.http.put<Disciplina>(`${this.apiUrl}/disciplinas/${id}`, data);
  }

  deleteDisciplina(id: number): Observable<boolean> {
    return this.http.delete(`${this.apiUrl}/disciplinas/${id}`).pipe(
      map(() => true)
    );
  }
  // SALONES
  getSalones(): Observable<Salon[]> {
    return this.http.get<Salon[]>(`${this.apiUrl}/salones`);
  }

  getSalonById(id: number): Observable<Salon | undefined> {
    return this.http.get<Salon>(`${this.apiUrl}/salones/${id}`).pipe(
      map(s => s || undefined)
    );
  }

  createSalon(s: Omit<Salon, 'id'>): Observable<Salon> {
    return this.http.post<Salon>(`${this.apiUrl}/salones`, s);
  }

  updateSalon(id: number, data: Partial<Salon>): Observable<Salon | null> {
    return this.http.put<Salon>(`${this.apiUrl}/salones/${id}`, data);
  }

  deleteSalon(id: number): Observable<boolean> {
    return this.http.delete(`${this.apiUrl}/salones/${id}`).pipe(
      map(() => true)
    );
  }
  private normalizeInstructor(i: any): Instructor {
    return {
      id: i.id,
      nombre: i.nombre,
      apellido: i.apellido,
      email: i.email,
      telefono: i.telefono,
      disciplinaId: i.disciplinaId ?? i.disciplina_id,
      tipo: i.tipo,
      activo: Boolean(i.activo),
      fechaIngreso: i.fechaIngreso ?? i.fecha_ingreso ?? '',
      disciplina: i.disciplina || (i.disciplina_nombre ? {
        id: i.disciplinaId ?? i.disciplina_id,
        nombre: i.disciplina_nombre,
        descripcion: i.disciplina_descripcion ?? '',
        color: i.disciplina_color,
        icono: i.disciplina_icono ?? 'person'
      } : undefined)
    };
  }

  // INSTRUCTORES
  getInstructores(): Observable<Instructor[]> {
    return this.http.get<any[]>(`${this.apiUrl}/instructores`).pipe(
      map(instructores => instructores.map(i => this.normalizeInstructor(i)))
    );
  }

  getInstructorById(id: number): Observable<Instructor | undefined> {
    return this.http.get<any>(`${this.apiUrl}/instructores/${id}`).pipe(
      map(inst => inst ? this.normalizeInstructor(inst) : undefined)
    );
  }

  createInstructor(data: Omit<Instructor, 'id'>): Observable<Instructor> {
    return this.http.post<Instructor>(`${this.apiUrl}/instructores`, data);
  }

  updateInstructor(id: number, data: Partial<Instructor>): Observable<Instructor | null> {
    return this.http.put<Instructor>(`${this.apiUrl}/instructores/${id}`, data);
  }

  deleteInstructor(id: number): Observable<boolean> {
    return this.http.delete(`${this.apiUrl}/instructores/${id}`).pipe(
      map(() => true)
    );
  }
  // TALLERES
  getTalleres(): Observable<Taller[]> {
    return this.http.get<any[]>(`${this.apiUrl}/talleres`).pipe(
      map(talleres => talleres.map(t => this.normalizeTaller(t)))
    );
  }

  getTallerById(id: number): Observable<Taller | undefined> {
    return this.http.get<any>(`${this.apiUrl}/talleres/${id}`).pipe(
      map(t => t ? this.normalizeTaller(t) : undefined)
    );
  }

  getTalleresByDisciplina(disciplinaId: number): Observable<Taller[]> {
    return this.getTalleres().pipe(
      map(talleres => talleres.filter(t => t.disciplinaId === disciplinaId))
    );
  }

  getTalleresByInstructor(instructorId: number): Observable<Taller[]> {
    return this.getTalleres().pipe(
      map(talleres => talleres.filter(t => t.instructorId === instructorId))
    );
  }

  getTalleresDisponibles(): Observable<Taller[]> {
    return this.getTalleres().pipe(
      map(talleres => talleres.filter(t => t.cupoActual < t.cupoMaximo))
    );
  }

  createTaller(data: Omit<Taller, 'id'>): Observable<Taller> {
    return this.http.post<Taller>(`${this.apiUrl}/talleres`, data);
  }

  updateTaller(id: number, data: Partial<Taller>): Observable<Taller> {
    return this.http.put<Taller>(`${this.apiUrl}/talleres/${id}`, data);
  }

  deleteTaller(id: number): Observable<boolean> {
    return this.http.delete(`${this.apiUrl}/talleres/${id}`).pipe(map(() => true));
  }
  private normalizeParticipante(p: any): Participante {
    return {
      id: p.id,
      nombre: p.nombre,
      apellido: p.apellido,
      cedula: p.cedula,
      email: p.email,
      telefono: p.telefono,
      fechaNacimiento: p.fechaNacimiento ?? p.fecha_nacimiento ?? '',
      edad: p.edad ?? 0,
      barrio: p.barrio ?? '',
      activo: Boolean(p.activo)
    };
  }

  // PARTICIPANTES
  getParticipantes(): Observable<Participante[]> {
    return this.http.get<any[]>(`${this.apiUrl}/participantes`).pipe(
      map(participantes => participantes.map(p => this.normalizeParticipante(p)))
    );
  }

  getParticipanteById(id: number): Observable<Participante | undefined> {
    return this.http.get<any>(`${this.apiUrl}/participantes/${id}`).pipe(
      map(p => p ? this.normalizeParticipante(p) : undefined)
    );
  }

  createParticipante(data: Omit<Participante, 'id'>): Observable<Participante> {
    return this.http.post<Participante>(`${this.apiUrl}/participantes`, data);
  }

  updateParticipante(id: number, data: Partial<Participante>): Observable<Participante> {
    return this.http.put<Participante>(`${this.apiUrl}/participantes/${id}`, data);
  }

  deleteParticipante(id: number): Observable<boolean> {
    return this.http.delete(`${this.apiUrl}/participantes/${id}`).pipe(map(() => true));
  }
  // INSCRIPCIONES
  getInscripciones(): Observable<Inscripcion[]> {
    return this.http.get<Inscripcion[]>(`${this.apiUrl}/inscripciones`);
  }
  getInscripcionesByTaller(tallerId: number): Observable<Inscripcion[]> {
    return this.getInscripciones().pipe(
      map(inscripciones => inscripciones.filter(i => i.tallerId === tallerId))
    );
  }
  getInscripcionesByParticipante(participanteId: number): Observable<Inscripcion[]> {
    return this.getInscripciones().pipe(
      map(inscripciones => inscripciones.filter(i => i.participanteId === participanteId))
    );
  }

  createInscripcion(participanteId: number, tallerId: number): Observable<Inscripcion> {
    return this.http.post<Inscripcion>(`${this.apiUrl}/inscripciones`, {
      participanteId,
      tallerId
    });
  }

  updateInscripcion(id: number, data: Partial<Inscripcion>): Observable<Inscripcion> {
    return this.http.put<Inscripcion>(`${this.apiUrl}/inscripciones/${id}`, data);
  }

  deleteInscripcion(id: number): Observable<boolean> {
    return this.http.delete(`${this.apiUrl}/inscripciones/${id}`).pipe(map(() => true));
  }
  // SESIONES
  getSesiones(): Observable<SesionTaller[]> {
    return this.http.get<SesionTaller[]>(`${this.apiUrl}/sesiones`);
  }
  getSesionesByTaller(tallerId: number): Observable<SesionTaller[]> {
    return this.getSesiones().pipe(
      map(sesiones => sesiones.filter(s => s.tallerId === tallerId))
    );
  }
  createSesion(data: Omit<SesionTaller, 'id'>): Observable<SesionTaller> {
    return this.http.post<SesionTaller>(`${this.apiUrl}/sesiones`, data);
  }
  updateSesion(id: number, data: Partial<SesionTaller>): Observable<SesionTaller> {
    return this.http.put<SesionTaller>(`${this.apiUrl}/sesiones/${id}`, data);
  }
  deleteSesion(id: number): Observable<boolean> {
    return this.http.delete(`${this.apiUrl}/sesiones/${id}`).pipe(map(() => true));
  }
  // ASISTENCIAS
  getAsistencias(): Observable<Asistencia[]> {
    return this.http.get<Asistencia[]>(`${this.apiUrl}/asistencias`);
  }
  getAsistenciasBySesion(sesionId: number): Observable<Asistencia[]> {
    return this.getAsistencias().pipe(
      map(asistencias => asistencias.filter(a => a.sesionId === sesionId))
    );
  }
  createAsistencia(data: Omit<Asistencia, 'id'>): Observable<Asistencia> {
    return this.http.post<Asistencia>(`${this.apiUrl}/asistencias`, data);
  }
  updateAsistencia(id: number, data: Partial<Asistencia>): Observable<Asistencia> {
    return this.http.put<Asistencia>(`${this.apiUrl}/asistencias/${id}`, data);
  }
  deleteAsistencia(id: number): Observable<boolean> {
    return this.http.delete(`${this.apiUrl}/asistencias/${id}`).pipe(map(() => true));
  }
  upsertAsistencia(id: number | undefined, data: Omit<Asistencia, 'id'>): Observable<Asistencia> {
    if (id) {
      return this.updateAsistencia(id, data as Partial<Asistencia>);
    }
    return this.createAsistencia(data);
  }
  private normalizeMaterial(m: any): Material {
    return {
      id: m.id,
      nombre: m.nombre,
      descripcion: m.descripcion ?? '',
      cantidadDisponible: m.cantidadDisponible ?? m.cantidad_disponible ?? 0,
      costoUnitario: m.costoUnitario ?? m.costo_unitario ?? 0,
      unidad: m.unidad ?? 'unidad',
      categoria: m.categoria ?? ''
    };
  }

  // MATERIALES
  getMateriales(): Observable<Material[]> {
    return this.http.get<any[]>(`${this.apiUrl}/materiales`).pipe(
      map(materiales => materiales.map(m => this.normalizeMaterial(m)))
    );
  }
  getMaterialById(id: number): Observable<Material | undefined> {
    return this.http.get<any>(`${this.apiUrl}/materiales/${id}`).pipe(
      map(m => m ? this.normalizeMaterial(m) : undefined)
    );
  }
  createMaterial(data: Omit<Material, 'id'>): Observable<Material> {
    return this.http.post<Material>(`${this.apiUrl}/materiales`, data);
  }
  updateMaterial(id: number, data: Partial<Material>): Observable<Material> {
    return this.http.put<Material>(`${this.apiUrl}/materiales/${id}`, data);
  }
  deleteMaterial(id: number): Observable<boolean> {
    return this.http.delete(`${this.apiUrl}/materiales/${id}`).pipe(map(() => true));
  }
  // MATERIALES
  getUsoMateriales(): Observable<UsoMaterial[]> {
    return this.http.get<UsoMaterial[]>(`${this.apiUrl}/uso-materiales`);
  }
  registrarUsoMaterial(data: Omit<UsoMaterial, 'id'>): Observable<UsoMaterial> {
    return this.http.post<UsoMaterial>(`${this.apiUrl}/uso-materiales`, data);
  }
  deleteUsoMaterial(id: number): Observable<boolean> {
    return this.http.delete(`${this.apiUrl}/uso-materiales/${id}`).pipe(map(() => true));
  }
  // REPORTES
  getReporteParticipantesPorTaller(): Observable<ReporteParticipantesTaller[]> {
    return this.http.get<ReporteParticipantesTaller[]>(`${this.apiUrl}/reportes/participantes-taller`);
  }

  getReportePorDisciplina(): Observable<ReporteDisciplina[]> {
    return this.http.get<ReporteDisciplina[]>(`${this.apiUrl}/reportes/disciplinas`);
  }

  getReporteJoinCompleto(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reportes/join-completo`);
  }

  getEstadisticasDashboard(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/estadisticas`);
  }
}


