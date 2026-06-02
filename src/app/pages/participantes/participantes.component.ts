import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data.service';
import { Participante } from '../../models/models';

@Component({ standalone: false,
  selector: 'app-participantes',
  templateUrl: './participantes.component.html',
  styleUrls: ['./participantes.component.scss']
})
export class ParticipantesComponent implements OnInit {
  participantes: Participante[] = [];
  filtered: Participante[] = [];
  selected: Participante | null = null;
  isNew = false;
  searchTerm = '';
  showConfirmDelete = false;
  toDeleteId: number | null = null;
  successMsg = '';
  errorMsg = '';

  form: Omit<Participante, 'id'> = this.emptyForm();

  displayedColumns = ['nombre', 'cedula', 'edad', 'barrio', 'email', 'activo', 'acciones'];

  constructor(private data: DataService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.data.getParticipantes().subscribe(participantes => {
      this.participantes = participantes;
      this.applyFilter();
    });
  }

  emptyForm(): Omit<Participante, 'id'> {
    return { nombre: '', apellido: '', cedula: '', email: '', telefono: '', fechaNacimiento: '', edad: 0, barrio: '', activo: true };
  }

  applyFilter(): void {
    const t = this.searchTerm.toLowerCase();
    this.filtered = this.participantes.filter(p =>
      !t || p.nombre.toLowerCase().includes(t) || p.apellido.toLowerCase().includes(t) ||
      p.cedula.includes(t) || p.barrio.toLowerCase().includes(t)
    );
  }

  nuevo(): void {
    this.selected = null;
    this.isNew = true;
    this.form = this.emptyForm();
    this.clearMessages();
  }

  select(p: Participante): void {
    this.selected = p;
    this.isNew = false;
    this.form = { ...p };
    this.clearMessages();
  }

  calcularEdad(): void {
    if (this.form.fechaNacimiento) {
      const hoy = new Date();
      const nac = new Date(this.form.fechaNacimiento);
      let edad = hoy.getFullYear() - nac.getFullYear();
      const m = hoy.getMonth() - nac.getMonth();
      if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
      this.form.edad = edad;
    }
  }

  guardar(): void {
    console.log('[Participantes] guardar() invoked', { isNew: this.isNew, form: this.form });
    if (!this.form.nombre || !this.form.apellido || !this.form.cedula) {
      this.errorMsg = 'Nombre, apellido y cédula son obligatorios.';
      return;
    }
    if (this.isNew) {
      this.data.createParticipante(this.form).subscribe({
        next: () => {
          this.successMsg = 'Participante registrado exitosamente.';
          this.load();
          this.cancelar();
          this.isNew = false;
        },
        error: () => {
          this.errorMsg = 'Error al registrar el participante.';
        }
      });
    } else if (this.selected) {
      this.data.updateParticipante(this.selected.id, this.form).subscribe({
        next: () => {
          this.successMsg = 'Participante actualizado exitosamente.';
          this.load();
          this.cancelar();
          this.isNew = false;
        },
        error: () => {
          this.errorMsg = 'Error al actualizar el participante.';
        }
      });
    }
  }

  confirmarEliminar(id: number): void { this.toDeleteId = id; this.showConfirmDelete = true; }

  eliminar(): void {
    if (this.toDeleteId) {
      this.data.deleteParticipante(this.toDeleteId).subscribe({
        next: () => {
          this.successMsg = 'Participante eliminado.';
          if (this.selected?.id === this.toDeleteId) this.selected = null;
          this.load();
        },
        error: () => {
          this.errorMsg = 'Error al eliminar el participante.';
        }
      });
    }
    this.showConfirmDelete = false;
    this.toDeleteId = null;
  }

  cancelar(): void { this.selected = null; this.isNew = false; this.form = this.emptyForm(); this.clearMessages(); }
  clearMessages(): void { this.successMsg = ''; this.errorMsg = ''; }
}
