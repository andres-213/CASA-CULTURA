import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Material, UsoMaterial, Taller } from '../../models/models';

@Component({ standalone: false,
  selector: 'app-materiales',
  templateUrl: './materiales.component.html',
  styleUrls: ['./materiales.component.scss']
})
export class MaterialesComponent implements OnInit {
  materiales: Material[] = [];
  usoMateriales: UsoMaterial[] = [];
  talleres: Taller[] = [];
  selectedMat: Material | null = null;
  isNew = false;
  showUsoForm = false;
  showConfirmDelete = false;
  toDeleteId: number | null = null;
  activeTab = 0;
  successMsg = ''; errorMsg = '';
  form: any = this.emptyForm();
  usoForm: any = { materialId: null, tallerId: null, fecha: '', cantidadUsada: 1, observaciones: '' };
  displayedColumnsM = ['nombre', 'categoria', 'cantidad', 'costo', 'acciones'];
  displayedColumnsU = ['material', 'taller', 'fecha', 'cantidad', 'costo_total', 'acciones'];

  constructor(private data: DataService) {}

  ngOnInit(): void {
    this.data.getTalleres().subscribe(talleres => {
      this.talleres = talleres.filter((t: Taller) => t.activo);
    });
    this.load();
  }

  load(): void {
    this.data.getMateriales().subscribe(materiales => {
      setTimeout(() => { this.materiales = materiales; });
    });
    this.data.getUsoMateriales().subscribe(usoMateriales => {
      setTimeout(() => { this.usoMateriales = usoMateriales; });
    });
  }

  emptyForm() {
    return { nombre: '', descripcion: '', cantidadDisponible: 10, costoUnitario: 0, unidad: 'unidad', categoria: '' };
  }

  nuevo(): void { this.selectedMat = null; this.isNew = true; this.form = this.emptyForm(); this.clearMessages(); }
  select(m: Material): void { this.selectedMat = m; this.isNew = false; this.form = { ...m }; this.clearMessages(); }

  guardar(materialForm: NgForm): void {
    if (materialForm.invalid) {
      materialForm.form.markAllAsTouched();
      this.errorMsg = 'Complete los campos obligatorios para guardar el material.';
      return;
    }
    if (this.isNew) {
      this.data.createMaterial(this.form).subscribe({
        next: () => {
          this.successMsg = 'Material registrado.';
          this.load();
          this.cancelar();
        },
        error: () => {
          this.errorMsg = 'Error al registrar el material.';
        }
      });
    } else if (this.selectedMat) {
      this.data.updateMaterial(this.selectedMat.id, this.form).subscribe({
        next: () => {
          this.successMsg = 'Material actualizado.';
          this.load();
          this.cancelar();
        },
        error: () => {
          this.errorMsg = 'Error al actualizar el material.';
        }
      });
    }
  }

  confirmarEliminar(id: number): void { this.toDeleteId = id; this.showConfirmDelete = true; }
  eliminar(): void {
    if (this.toDeleteId) {
      this.data.deleteMaterial(this.toDeleteId).subscribe({
        next: () => {
          this.successMsg = 'Material eliminado.';
          this.load();
        },
        error: () => {
          this.errorMsg = 'Error al eliminar el material.';
        }
      });
    }
    this.showConfirmDelete = false; this.toDeleteId = null;
  }

  registrarUso(usoForm: NgForm): void {
    if (usoForm.invalid) {
      usoForm.form.markAllAsTouched();
      this.errorMsg = 'Complete los datos obligatorios para registrar el uso de material.';
      return;
    }
    if (this.usoForm.cantidadUsada < 1) { this.errorMsg = 'La cantidad debe ser mayor a 0.'; return; }
    this.data.registrarUsoMaterial(this.usoForm).subscribe({
      next: () => {
        this.successMsg = 'Uso de material registrado. Inventario actualizado.';
        this.showUsoForm = false;
        this.usoForm = { materialId: null, tallerId: null, fecha: '', cantidadUsada: 1, observaciones: '' };
        this.load();
      },
      error: () => {
        this.errorMsg = 'Error al registrar el uso de material.';
      }
    });
  }

  eliminarUso(id: number): void {
    this.data.deleteUsoMaterial(id).subscribe({
      next: () => {
        this.successMsg = 'Registro de uso eliminado. Inventario restaurado.';
        this.load();
      },
      error: () => {
        this.errorMsg = 'Error al eliminar el uso de material.';
      }
    });
  }

  cancelar(): void { this.selectedMat = null; this.isNew = false; this.form = this.emptyForm(); this.clearMessages(); }
  clearMessages(): void { this.successMsg = ''; this.errorMsg = ''; }
  getStockClass(m: Material): string {
    if (m.cantidadDisponible === 0) return 'stock-agotado';
    if (m.cantidadDisponible < 5) return 'stock-bajo';
    return 'stock-ok';
  }
  getCostoTotal(u: UsoMaterial): number {
    return (u.material?.costoUnitario || 0) * u.cantidadUsada;
  }
  categorias = ['Artes Plásticas','Música','Teatro','Danza','Literatura','General'];
  unidades = ['unidad','set','kit','juego','metro','litro','kg','resma'];
}
