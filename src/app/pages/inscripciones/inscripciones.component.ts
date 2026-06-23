import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { DataService } from '../../services/data.service';
import { Inscripcion, Participante, Taller } from '../../models/models';

@Component({ standalone: false,
  selector: 'app-inscripciones',
  templateUrl: './inscripciones.component.html',
  styleUrls: ['./inscripciones.component.scss']
})
export class InscripcionesComponent implements OnInit {
  inscripciones: Inscripcion[] = [];
  filtered: Inscripcion[] = [];
  participantes: Participante[] = [];
  talleres: Taller[] = [];
  searchTerm = '';
  filterTallerId: number | null = null;
  filterEstado = '';
  showForm = false;
  showConfirmDelete = false;
  toDeleteId: number | null = null;
  successMsg = '';
  errorMsg = '';
  form = { participanteId: null as any, tallerId: null as any };
  displayedColumns = ['participante', 'taller', 'disciplina', 'horario', 'fecha', 'estado', 'acciones'];

  constructor(private data: DataService) {}

  ngOnInit(): void {
    this.data.getParticipantes().subscribe(participantes => {
      this.participantes = participantes.filter((p: Participante) => p.activo);
    });
    this.data.getTalleres().subscribe(talleres => {
      this.talleres = talleres.filter((t: Taller) => t.activo);
    });
    this.load();
  }

  load(): void {
    this.data.getInscripciones().subscribe(inscripciones => {
      this.inscripciones = inscripciones;
      this.applyFilter();
    });
  }

  applyFilter(): void {
    const t = this.searchTerm.toLowerCase();
    this.filtered = this.inscripciones.filter(i => {
      const p = i.participante;
      const tal = i.taller;
      if (t && !(
        (p?.nombre + ' ' + p?.apellido).toLowerCase().includes(t) ||
        tal?.nombre.toLowerCase().includes(t)
      )) return false;
      if (this.filterTallerId && i.tallerId !== this.filterTallerId) return false;
      if (this.filterEstado && i.estado !== this.filterEstado) return false;
      return true;
    });
  }

  nuevaInscripcion(): void {
    this.form = { participanteId: null, tallerId: null };
    this.showForm = true;
    this.clearMessages();
  }

  guardar(form: NgForm): void {
    if (form.invalid) {
      form.form.markAllAsTouched();
      this.errorMsg = 'Complete los datos obligatorios para inscribir al participante.';
      return;
    }
    if (!this.form.participanteId || !this.form.tallerId) {
      this.errorMsg = 'Debe seleccionar participante y taller.';
      return;
    }
    this.data.createInscripcion(this.form.participanteId, this.form.tallerId).subscribe({
      next: () => {
        this.successMsg = 'Participante inscrito exitosamente.';
        this.errorMsg = '';
        this.showForm = false;
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.errorMsg = err.error?.error || 'Error al crear la inscripción.';
      }
    });
  }

  cambiarEstado(ins: Inscripcion, estado: 'activa' | 'retirada' | 'completada'): void {
    this.data.updateInscripcion(ins.id, { estado }).subscribe({
      next: () => {
        this.successMsg = `Inscripción marcada como "${estado}".`;
        this.errorMsg = '';
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.errorMsg = err.error?.error || 'Error al actualizar la inscripción.';
      }
    });
  }

  confirmarEliminar(id: number): void { this.toDeleteId = id; this.showConfirmDelete = true; }

  eliminar(): void {
    if (this.toDeleteId) {
      this.data.deleteInscripcion(this.toDeleteId).subscribe({
        next: () => {
          this.successMsg = 'Inscripción eliminada.';
          this.errorMsg = '';
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMsg = err.error?.error || 'Error al eliminar la inscripción.';
        }
      });
    }
    this.showConfirmDelete = false;
    this.toDeleteId = null;
  }

  cancelar(): void { this.showForm = false; this.clearMessages(); }
  clearMessages(): void { this.successMsg = ''; this.errorMsg = ''; }
  clearFilters(): void { this.searchTerm = ''; this.filterTallerId = null; this.filterEstado = ''; this.applyFilter(); }

  getTallerInfo(t: Taller | undefined): string {
    if (!t) return '';
    const disp = t.cupoMaximo - t.cupoActual;
    return `${t.nombre} (${t.disciplina?.nombre}) - Cupo disp: ${disp}`;
  }

  getEstadoColor(estado: string): string {
    if (estado === 'activa') return 'badge-green';
    if (estado === 'retirada') return 'badge-red';
    return 'badge-blue';
  }
}

