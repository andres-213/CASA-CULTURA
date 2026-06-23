import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { DataService } from '../../services/data.service';
import { Disciplina } from '../../models/models';

@Component({ standalone: false, selector: 'app-disciplinas', templateUrl: './disciplinas.component.html', styleUrls: ['./disciplinas.component.scss'] })
export class DisciplinasComponent implements OnInit {
  disciplinas: Disciplina[] = [];
  selected: Disciplina | null = null;
  isNew = false;
  showForm = false;
  showConfirmDelete = false;
  toDeleteId: number | null = null;
  successMsg = ''; errorMsg = '';
  form: any = this.emptyForm();
  displayedColumns = ['color', 'nombre', 'descripcion', 'acciones'];
  colores = ['#FF6B6B','#4ECDC4','#FFE66D','#A8E6CF','#DDA0DD','#FF8C42','#6C5CE7','#00B894','#E17055','#74B9FF'];
  iconos = ['music_note','directions_run','palette','theater_comedy','menu_book','brush','piano','mic'];

  constructor(private data: DataService) {}
  ngOnInit(): void { this.load(); }
  load(): void {
    this.data.getDisciplinas().subscribe(disciplinas => {
      this.disciplinas = disciplinas;
    });
  }
  emptyForm() { return { nombre: '', descripcion: '', color: '#1f5f8b', icono: 'palette' }; }
  nuevo(): void { this.selected = null; this.isNew = true; this.showForm = true; this.form = this.emptyForm(); this.clearMessages(); }
  select(d: Disciplina): void { this.selected = d; this.isNew = false; this.showForm = true; this.form = { ...d }; this.clearMessages(); }
  guardar(disciplinaForm: NgForm): void {
    if (disciplinaForm.invalid) {
      disciplinaForm.form.markAllAsTouched();
      this.errorMsg = 'Corrija los errores del formulario antes de guardar.';
      return;
    }
    if (this.isNew) {
      this.data.createDisciplina(this.form).subscribe({
        next: () => {
          this.cancelar();
          this.successMsg = 'Disciplina creada.';
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMsg = err.error?.error || 'Error al crear la disciplina.';
        }
      });
    } else if (this.selected) {
      this.data.updateDisciplina(this.selected.id, this.form).subscribe({
        next: () => {
          this.cancelar();
          this.successMsg = 'Disciplina actualizada.';
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMsg = err.error?.error || 'Error al actualizar la disciplina.';
        }
      });
    }
  }
  confirmarEliminar(id: number): void { this.toDeleteId = id; this.showConfirmDelete = true; }
  eliminar(): void {
    if (this.toDeleteId) {
      this.data.deleteDisciplina(this.toDeleteId).subscribe({
        next: () => {
          this.successMsg = 'Disciplina eliminada.';
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMsg = err.error?.error || 'Error al eliminar la disciplina.';
        }
      });
    }
    this.showConfirmDelete = false; this.toDeleteId = null;
  }
  cancelar(): void { this.selected = null; this.isNew = false; this.showForm = false; this.form = this.emptyForm(); this.clearMessages(); }
  clearMessages(): void { this.successMsg = ''; this.errorMsg = ''; }
}
