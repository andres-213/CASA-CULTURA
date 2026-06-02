import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data.service';
import { Taller, Disciplina, Instructor, Salon } from '../../models/models';

@Component({ standalone: false, selector: 'app-talleres', templateUrl: './talleres.component.html', styleUrls: ['./talleres.component.scss'] })
export class TalleresComponent implements OnInit {
  talleres: Taller[] = [];
  filtered: Taller[] = [];
  disciplinas: Disciplina[] = [];
  instructores: Instructor[] = [];
  salones: Salon[] = [];
  selected: Taller | null = null;
  isNew = false;
  showConfirmDelete = false;
  toDeleteId: number | null = null;
  successMsg = ''; errorMsg = '';
  form: any = this.emptyForm();
  filterDisciplinaId: number | null = null;
  filterInstructorId: number | null = null;
  filterDisponible: boolean | null = null;
  displayedColumns = ['nombre', 'disciplina', 'instructor', 'salon', 'horario', 'cupo', 'acciones'];
  dias = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  trimestres = ['2024-Q1','2024-Q2','2024-Q3','2024-Q4'];

  constructor(private data: DataService) {}

  ngOnInit(): void {
    this.data.getDisciplinas().subscribe(disciplinas => this.disciplinas = disciplinas);
    this.data.getInstructores().subscribe(instructores => {
      this.instructores = instructores.filter((i: Instructor) => i.activo);
    });
    this.data.getSalones().subscribe(salones => this.salones = salones);
    this.load();
  }

  load(): void {
    this.data.getTalleres().subscribe(talleres => {
      setTimeout(() => { this.talleres = talleres; this.applyFilter(); });
    });
  }

  emptyForm() {
    return { nombre: '', disciplinaId: null as any, instructorId: null as any, salonId: null as any,
      horario: '', diaSemana: '', horaInicio: '', horaFin: '', cupoMaximo: 20, cupoActual: 0, trimestre: '2024-Q1', activo: true };
  }

  applyFilter(): void {
    this.filtered = this.talleres.filter(t => {
      if (this.filterDisciplinaId && t.disciplinaId !== this.filterDisciplinaId) return false;
      if (this.filterInstructorId && t.instructorId !== this.filterInstructorId) return false;
      if (this.filterDisponible === true && t.cupoActual >= t.cupoMaximo) return false;
      return true;
    });
  }

  buildHorario(): void {
    if (this.form.diaSemana && this.form.horaInicio && this.form.horaFin) {
      this.form.horario = `${this.form.diaSemana} ${this.form.horaInicio}-${this.form.horaFin}`;
    }
  }

  nuevo(): void { this.selected = null; this.isNew = true; this.form = this.emptyForm(); this.clearMessages(); }
  select(t: Taller): void { this.selected = t; this.isNew = false; this.form = { ...t }; this.clearMessages(); }

  guardar(): void {
    console.log('[Talleres] guardar() invoked', { isNew: this.isNew, form: this.form });
    if (!this.form.nombre || !this.form.disciplinaId || !this.form.instructorId || !this.form.salonId) {
      this.errorMsg = 'Nombre, disciplina, instructor y salón son obligatorios.'; return;
    }
    if (!this.form.diaSemana || !this.form.horaInicio || !this.form.horaFin) {
      this.errorMsg = 'Debe especificar el horario completo.'; return;
    }
    this.buildHorario();
    if (this.isNew) {
      this.data.createTaller(this.form).subscribe({
        next: () => {
          this.successMsg = 'Taller creado exitosamente.';
          this.load();
          this.cancelar();
        },
        error: () => {
          this.errorMsg = 'Error al crear el taller.';
        }
      });
    } else if (this.selected) {
      this.data.updateTaller(this.selected.id, this.form).subscribe({
        next: () => {
          this.successMsg = 'Taller actualizado.';
          this.load();
          this.cancelar();
        },
        error: () => {
          this.errorMsg = 'Error al actualizar el taller.';
        }
      });
    }
  }

  confirmarEliminar(id: number): void { this.toDeleteId = id; this.showConfirmDelete = true; }
  eliminar(): void {
    if (this.toDeleteId) {
      this.data.deleteTaller(this.toDeleteId).subscribe({
        next: () => {
          this.successMsg = 'Taller eliminado.';
          this.load();
        },
        error: () => {
          this.errorMsg = 'Error al eliminar el taller.';
        }
      });
    }
    this.showConfirmDelete = false; this.toDeleteId = null;
  }
  cancelar(): void { this.selected = null; this.isNew = false; this.form = this.emptyForm(); this.clearMessages(); }
  clearMessages(): void { this.successMsg = ''; this.errorMsg = ''; }
  clearFilters(): void { this.filterDisciplinaId = null; this.filterInstructorId = null; this.filterDisponible = null; this.applyFilter(); }
  getCupoColor(t: Taller): string {
    const pct = t.cupoActual / t.cupoMaximo;
    if (pct >= 1) return '#ef4444';
    if (pct >= 0.8) return '#f59e0b';
    return '#22c55e';
  }
}
