import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data.service';
import { Salon } from '../../models/models';

@Component({ standalone: false, selector: 'app-salones', templateUrl: './salones.component.html', styleUrls: ['./salones.component.scss'] })
export class SalonesComponent implements OnInit {
  salones: Salon[] = [];
  selected: Salon | null = null;
  isNew = false;
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
  nuevo(): void { this.selected = null; this.isNew = true; this.form = this.emptyForm(); this.clearMessages(); }
  select(s: Salon): void { this.selected = s; this.isNew = false; this.form = { ...s }; this.clearMessages(); }
  guardar(): void {
    console.log('[Salones] guardar() invoked', { isNew: this.isNew, form: this.form });
    if (!this.form.nombre) { this.errorMsg = 'El nombre es obligatorio.'; return; }
    if (this.form.capacidad < 1) { this.errorMsg = 'La capacidad debe ser mayor a 0.'; return; }
    if (this.isNew) {
      this.data.createSalon(this.form).subscribe({
        next: () => {
          this.successMsg = 'Salón creado.';
          this.load();
          this.cancelar();
        },
        error: (err) => {
          this.errorMsg = 'Error al crear el salón.' + (err?.message ? ' ' + err.message : '');
        }
      });
    } else if (this.selected) {
      this.data.updateSalon(this.selected.id, this.form).subscribe({
        next: () => {
          this.successMsg = 'Salón actualizado.';
          this.load();
          this.cancelar();
        },
        error: (err) => {
          this.errorMsg = 'Error al actualizar el salón.' + (err?.message ? ' ' + err.message : '');
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
        error: (err) => {
          this.errorMsg = 'Error al eliminar el salón.' + (err?.message ? ' ' + err.message : '');
        }
      });
    }
    this.showConfirmDelete = false; this.toDeleteId = null;
  }
  cancelar(): void { this.selected = null; this.isNew = false; this.form = this.emptyForm(); this.clearMessages(); }
  clearMessages(): void { this.successMsg = ''; this.errorMsg = ''; }
}
