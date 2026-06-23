import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { DataService } from '../../services/data.service';
import { SesionTaller, Taller, Participante, Asistencia } from '../../models/models';

@Component({ standalone: false,
  selector: 'app-asistencia',
  templateUrl: './asistencia.component.html',
  styleUrls: ['./asistencia.component.scss']
})
export class AsistenciaComponent implements OnInit {
  talleres: Taller[] = [];
  sesiones: SesionTaller[] = [];
  selectedTallerId: number | null = null;
  selectedSesionId: number | null = null;
  selectedSesion: SesionTaller | null = null;
  participantesTaller: Participante[] = [];
  asistenciaMap: { [pid: number]: { id?: number; asistio: boolean; observacion: string } } = {};
  showNuevaSesion = false;
  nuevaSesionForm = { fecha: '', tema: '', observaciones: '' };
  successMsg = ''; errorMsg = '';
  sesionesColumns = ['fecha', 'tema', 'acciones'];

  constructor(private data: DataService) {}

  ngOnInit(): void {
    this.data.getTalleres().subscribe(talleres => {
      this.talleres = talleres.filter((t: Taller) => t.activo);
    });
  }

  onTallerChange(): void {
    if (!this.selectedTallerId) return;
    this.data.getSesionesByTaller(this.selectedTallerId).subscribe(sesiones => {
      this.sesiones = sesiones;
    });
    this.selectedSesionId = null;
    this.selectedSesion = null;
    this.participantesTaller = [];
    this.asistenciaMap = {};
  }

  onSesionChange(): void {
    if (!this.selectedSesionId || !this.selectedTallerId) return;
    this.selectedSesion = this.sesiones.find(s => s.id === this.selectedSesionId) || null;
    this.data.getInscripcionesByTaller(this.selectedTallerId).subscribe(inscritos => {
      const activos = inscritos.filter(i => i.estado === 'activa');
      this.participantesTaller = activos.map(i => i.participante!).filter(Boolean);
      if (this.selectedSesionId) {
        this.data.getAsistenciasBySesion(this.selectedSesionId).subscribe(asistencias => {
          this.asistenciaMap = {};
          this.participantesTaller.forEach(p => {
            const a = asistencias.find(a => a.participanteId === p.id);
            this.asistenciaMap[p.id] = { id: a?.id, asistio: a?.asistio ?? true, observacion: a?.observacion ?? '' };
          });
        });
      }
    });
  }

  crearSesion(form: NgForm): void {
    if (form.invalid) {
      form.form.markAllAsTouched();
      this.errorMsg = 'Complete los campos obligatorios para crear la sesión.';
      return;
    }
    this.data.createSesion({ tallerId: this.selectedTallerId!, ...this.nuevaSesionForm }).subscribe({
      next: () => {
        this.successMsg = 'Sesión creada exitosamente.';
        this.showNuevaSesion = false;
        this.nuevaSesionForm = { fecha: '', tema: '', observaciones: '' };
        this.onTallerChange();
      },
      error: () => {
        this.errorMsg = 'Error al crear la sesión.';
      }
    });
  }

  eliminarSesion(id: number): void {
    this.data.deleteSesion(id).subscribe({
      next: () => {
        this.successMsg = 'Sesión eliminada.';
        if (this.selectedSesionId === id) { this.selectedSesionId = null; this.selectedSesion = null; this.participantesTaller = []; }
        this.onTallerChange();
      },
      error: () => {
        this.errorMsg = 'Error al eliminar la sesión.';
      }
    });
  }

  guardarAsistencia(): void {
    if (!this.selectedSesionId) {
      this.errorMsg = 'Seleccione una sesión antes de guardar la asistencia.';
      return;
    }
    if (this.participantesTaller.length === 0) {
      this.errorMsg = 'No hay participantes inscritos para esta sesión.';
      return;
    }
    const invalidObservacion = this.participantesTaller.some(p => {
      const a = this.asistenciaMap[p.id];
      return a && !this.isValidObservacion(a.observacion);
    });
    if (invalidObservacion) {
      this.errorMsg = 'Las observaciones contienen caracteres inválidos.';
      return;
    }
    const requests = this.participantesTaller.map(p => {
      const a = this.asistenciaMap[p.id];
      return this.data.upsertAsistencia(a.id, {
        sesionId: this.selectedSesionId!,
        participanteId: p.id,
        asistio: a.asistio,
        observacion: a.observacion
      });
    });
    forkJoin(requests).subscribe({
      next: () => {
        this.successMsg = 'Asistencia registrada correctamente.';
      },
      error: () => {
        this.errorMsg = 'Error al guardar las asistencias.';
      }
    });
  }

  isValidObservacion(observacion: string): boolean {
    return /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s\-.,;:()]*$/.test(observacion || '');
  }

  getTotalAsistieron(): number {
    return Object.values(this.asistenciaMap).filter(a => a.asistio).length;
  }

  clearMessages(): void { this.successMsg = ''; this.errorMsg = ''; }
}
