import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data.service';
import { Instructor, Disciplina } from '../../models/models';

@Component({ standalone: false,
  selector: 'app-instructores',
  templateUrl: './instructores.component.html',
  styleUrls: ['./instructores.component.scss']
})
export class InstructoresComponent implements OnInit {
  instructores: Instructor[] = [];
  filtered: Instructor[] = [];
  disciplinas: Disciplina[] = [];
  selected: Instructor | null = null;
  isNew = false;
  searchTerm = '';
  showConfirmDelete = false;
  toDeleteId: number | null = null;
  successMsg = '';
  errorMsg = '';
  form: any = this.emptyForm();
  displayedColumns = ['nombre', 'disciplina', 'tipo', 'estado', 'acciones'];

  constructor(private data: DataService) {}

  ngOnInit(): void {
    this.data.getDisciplinas().subscribe(disciplinas => {
      this.disciplinas = disciplinas;
    });
    this.load();
  }

  load(): void {
    this.data.getInstructores().subscribe(instructores => {
      this.instructores = instructores;
      this.applyFilter();
    });
  }

  emptyForm() {
    return { nombre: '', apellido: '', email: '', telefono: '', disciplinaId: null as any, tipo: 'contratado', activo: true, fechaIngreso: '' };
  }

  applyFilter(): void {
    const t = this.searchTerm.toLowerCase();
    this.filtered = this.instructores.filter(i =>
      !t || i.nombre.toLowerCase().includes(t) || i.apellido.toLowerCase().includes(t) ||
      (i.disciplina?.nombre || '').toLowerCase().includes(t)
    );
  }

  nuevo(): void { this.selected = null; this.isNew = true; this.form = this.emptyForm(); this.clearMessages(); }
  select(i: Instructor): void { this.selected = i; this.isNew = false; this.form = { ...i }; this.clearMessages(); }

  guardar(): void {
    console.log('[Instructores] guardar() invoked', { isNew: this.isNew, form: this.form });
    if (!this.form.nombre || !this.form.apellido || !this.form.disciplinaId) {
      this.errorMsg = 'Nombre, apellido y disciplina son obligatorios.'; return;
    }
    if (this.isNew) {
      this.data.createInstructor(this.form).subscribe({
        next: () => {
          this.successMsg = 'Instructor registrado exitosamente.';
          this.load();
          this.cancelar();
        },
        error: (err) => {
          this.errorMsg = 'Error al crear instructor: ' + err.message;
        }
      });
    } else if (this.selected) {
      this.data.updateInstructor(this.selected.id, this.form).subscribe({
        next: () => {
          this.successMsg = 'Instructor actualizado.';
          this.load();
          this.cancelar();
        },
        error: (err) => {
          this.errorMsg = 'Error al actualizar instructor: ' + err.message;
        }
      });
    }
  }

  confirmarEliminar(id: number): void { this.toDeleteId = id; this.showConfirmDelete = true; }
  eliminar(): void {
    if (this.toDeleteId) {
      this.data.deleteInstructor(this.toDeleteId).subscribe({
        next: () => {
          this.successMsg = 'Instructor eliminado.';
          this.load();
        },
        error: (err) => {
          this.errorMsg = 'Error al eliminar instructor: ' + err.message;
        }
      });
    }
    this.showConfirmDelete = false; this.toDeleteId = null;
  }
  cancelar(): void { this.selected = null; this.isNew = false; this.form = this.emptyForm(); this.clearMessages(); }
  clearMessages(): void { this.successMsg = ''; this.errorMsg = ''; }
}
