import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { DataService } from '../../services/data.service';
import { Salon } from '../../models/models';

@Component({ standalone: false, selector: 'app-salones', templateUrl: './salones.component.html', styleUrls: ['./salones.component.scss'] })
export class SalonesComponent implements OnInit {
  salones: Salon[] = [];
  selected: Salon | null = null;
  isNew = false;
  showForm = false;
  showConfirmDelete = false;
  toDeleteId: number | null = null;
  successMsg = ''; errorMsg = '';
  form: any = this.emptyForm();
  displayedColumns = ['nombre', 'capacidad', 'equipamiento', 'disponible', 'acciones'];

  constructor(private data: DataService) {}
  ngOnInit(): void { this.load(); }
  load(): void {
    this.data.getSalones().subscribe(salones => {
      this.salones = salones;
    });
  }
  emptyForm() { return { nombre: '', capacidad: 20, equipamiento: '', disponible: true }; }
  nuevo(): void { this.selected = null; this.isNew = true; this.showForm = true; this.form = this.emptyForm(); this.clearMessages(); }
  select(s: Salon): void { this.selected = s; this.isNew = false; this.showForm = true; this.form = { ...s }; this.clearMessages(); }
  guardar(salonForm: NgForm): void {
    if (salonForm.invalid) {
      salonForm.form.markAllAsTouched();
      this.errorMsg = 'Corrija los errores del formulario antes de guardar.';
      return;
    }
    if (this.isNew) {
      this.data.createSalon(this.form).subscribe({
        next: () => {
          this.cancelar();
          this.successMsg = 'Salón creado.';
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMsg = err.error?.error || 'Error al crear el salón.';
        }
      });
    } else if (this.selected) {
      this.data.updateSalon(this.selected.id, this.form).subscribe({
        next: () => {
          this.cancelar();
          this.successMsg = 'Salón actualizado.';
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMsg = err.error?.error || 'Error al actualizar el salón.';
        }
      });
    }
  }
  confirmarEliminar(id: number): void { this.toDeleteId = id; this.showConfirmDelete = true; }
  eliminar(): void {
    if (this.toDeleteId) {
      this.data.deleteSalon(this.toDeleteId).subscribe({
        next: () => {
          this.successMsg = 'Salón eliminado.';
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMsg = err.error?.error || 'Error al eliminar el salón.';
        }
      });
    }
    this.showConfirmDelete = false; this.toDeleteId = null;
  }
  cancelar(): void { this.selected = null; this.isNew = false; this.showForm = false; this.form = this.emptyForm(); this.clearMessages(); }
  clearMessages(): void { this.successMsg = ''; this.errorMsg = ''; }
}
