import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
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
  showForm = false;
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

  nuevo(): void { this.selected = null; this.isNew = true; this.showForm = true; this.form = this.emptyForm(); this.clearMessages(); }
  select(i: Instructor): void { this.selected = i; this.isNew = false; this.showForm = true; this.form = { ...i }; this.clearMessages(); }

  guardar(instructorForm: NgForm): void {
    if (instructorForm.invalid) {
      instructorForm.form.markAllAsTouched();
      this.errorMsg = 'Corrija los errores del formulario antes de guardar.';
      return;
    }
    if (this.isNew) {
      this.data.createInstructor(this.form).subscribe({
        next: () => {
          this.cancelar();
          this.successMsg = 'Instructor registrado exitosamente.';
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMsg = err.error?.error || 'Error al crear instructor.';
        }
      });
    } else if (this.selected) {
      this.data.updateInstructor(this.selected.id, this.form).subscribe({
        next: () => {
          this.cancelar();
          this.successMsg = 'Instructor actualizado.';
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMsg = err.error?.error || 'Error al actualizar instructor.';
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
        error: (err: HttpErrorResponse) => {
          this.errorMsg = err.error?.error || 'Error al eliminar instructor.';
        }
      });
    }
    this.showConfirmDelete = false; this.toDeleteId = null;
  }
  cancelar(): void { this.selected = null; this.isNew = false; this.showForm = false; this.form = this.emptyForm(); this.clearMessages(); }
  clearMessages(): void { this.successMsg = ''; this.errorMsg = ''; }
}
