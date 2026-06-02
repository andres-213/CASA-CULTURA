import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DataService } from '../../services/data.service';
import { Usuario } from '../../models/models';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: false,
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss']
})
export class UsuariosComponent implements OnInit, AfterViewInit {
  usuarios: Usuario[] = [];
  dataSource = new MatTableDataSource<Usuario>([]);
  selected: Usuario | null = null;
  isNew = false;
  showConfirmDelete = false;
  toDeleteId: number | null = null;
  successMsg = '';
  errorMsg = '';
  form: any = this.emptyForm();
  hidePass = true;
  displayedColumns = ['usuario', 'nombre', 'rol', 'activo', 'acciones'];
  currentUserId = 0;
  searchTerm = '';
  roleFilter = 'todos';
  statusFilter = 'todos';
  // Allow letters (including Spanish accents), numbers and spaces in username
  usernamePattern = '^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñÜü]+(?:\\s+[A-Za-z0-9ÁÉÍÓÚáéíóúÑñÜü]+)*$';
  // Allow letters (including Spanish accents) and spaces in full name
  nombrePattern = '^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+(?:\\s+[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)*$';
  passwordMinLength = 9;

  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  constructor(private data: DataService, private auth: AuthService, private snack: MatSnackBar) {}

  ngOnInit(): void {
    this.currentUserId = this.auth.getCurrentUser()?.id || 0;
    this.dataSource.filterPredicate = (user, filter) => {
      const criteria = JSON.parse(filter);
      const text = `${user.username} ${user.nombre} ${user.rol}`.toLowerCase();
      const matchesSearch = !criteria.search || text.includes(criteria.search);
      const matchesRole = criteria.role === 'todos' || user.rol === criteria.role;
      const matchesStatus = criteria.status === 'todos' ||
        (criteria.status === 'activo' && user.activo) ||
        (criteria.status === 'inactivo' && !user.activo);
      return matchesSearch && matchesRole && matchesStatus;
    };
    this.load();
  }

  ngAfterViewInit(): void {
    if (this.paginator) this.dataSource.paginator = this.paginator;
    if (this.sort) this.dataSource.sort = this.sort;
  }

  load(): void {
    this.data.getUsuarios().subscribe(usuarios => {
      this.usuarios = [...usuarios];
      this.dataSource.data = [...usuarios];
      this.applyFilters();
    });
  }

  emptyForm() {
    return { username: '', password: '', nombre: '', rol: 'operador', activo: true };
  }

  containsEmojiOrControl(value: string): boolean {
    return /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\uFE0F\u200D\p{Cc}]/u.test(value);
  }

  isValidUsername(value: string): boolean {
    return !!value && /^[\p{L}\p{N}]+(?:\s+[\p{L}\p{N}]+)*$/u.test(value.trim());
  }

  isValidNombre(value: string): boolean {
    return !!value && /^[\p{L}]+(?:\s+[\p{L}]+)*$/u.test(value.trim());
  }

  isValidPassword(value: string): boolean {
    return typeof value === 'string' &&
      value.length >= this.passwordMinLength &&
      !this.containsEmojiOrControl(value);
  }

  nuevo(): void {
    this.selected = null;
    this.isNew = true;
    this.form = this.emptyForm();
    this.clearMessages();
  }

  select(u: Usuario): void {
    this.selected = u;
    this.isNew = false;
    this.form = { ...u, password: '' };
    this.clearMessages();
  }

  editar(u: Usuario): void {
    this.select(u);
  }

  applyFilters(): void {
    this.dataSource.filter = JSON.stringify({
      search: this.searchTerm.trim().toLowerCase(),
      role: this.roleFilter,
      status: this.statusFilter
    });
    this.dataSource.paginator?.firstPage();
  }

  guardar(): void {
    console.log('[Usuarios] guardar() invoked', { isNew: this.isNew, form: this.form });
    this.form.username = (this.form.username || '').trim();
    this.form.nombre = (this.form.nombre || '').trim();

    if (!this.isValidUsername(this.form.username)) {
      this.errorMsg = 'El nombre de usuario solo puede contener letras, números y espacios.';
      return;
    }

    if (!this.isValidNombre(this.form.nombre)) {
      this.errorMsg = 'El nombre completo solo puede contener letras y espacios.';
      return;
    }

    if (this.isNew && !this.isValidPassword(this.form.password)) {
      this.errorMsg = 'La contrasena debe tener mas de 8 caracteres y no puede contener emojis.';
      return;
    }

    if (!this.isNew && this.form.password && !this.isValidPassword(this.form.password)) {
      this.errorMsg = 'La contrasena debe tener mas de 8 caracteres y no puede contener emojis.';
      return;
    }

    const payload: any = {
      username: this.form.username,
      nombre: this.form.nombre,
      rol: this.form.rol,
      activo: this.form.activo
    };

    if (this.form.password) {
      payload.password = this.form.password;
    }

    if (this.isNew) {
      this.data.getUsuarios().subscribe(usuarios => {
        const existe = usuarios.find((u: Usuario) => u.username.toLowerCase() === payload.username.toLowerCase());
        if (existe) {
          this.errorMsg = 'El nombre de usuario ya existe.';
          return;
        }
        this.data.createUsuario(payload).subscribe({
          next: () => {
            this.successMsg = 'Usuario creado exitosamente.';
            this.notify(this.successMsg);
            this.resetFormState();
            this.load();
          },
          error: (err: HttpErrorResponse) => {
            this.errorMsg = err.error?.error || 'Error al crear usuario.';
          }
        });
      });
    } else if (this.selected) {
      const selectedId = this.selected.id;
      this.data.updateUsuario(selectedId, payload).subscribe({
        next: (updated) => {
          const usuarioActualizado = updated || { ...this.selected!, ...payload };
          this.usuarios = this.usuarios.map(u => u.id === selectedId ? { ...u, ...usuarioActualizado, id: selectedId } : u);
          this.dataSource.data = [...this.usuarios];
          this.applyFilters();
          this.successMsg = 'Usuario actualizado.';
          this.notify(this.successMsg);
          this.resetFormState();
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMsg = err.error?.error || 'Error al actualizar usuario.';
        }
      });
    }
  }

  confirmarEliminar(id: number): void {
    this.clearMessages();
    if (id === this.currentUserId) {
      this.errorMsg = 'No puede eliminar su propio usuario.';
      return;
    }
    this.toDeleteId = id;
    this.showConfirmDelete = true;
  }

  eliminar(): void {
    if (this.toDeleteId) {
      const deleteId = this.toDeleteId;
      this.data.deleteUsuario(this.toDeleteId).subscribe({
        next: () => {
          this.usuarios = this.usuarios.filter(u => u.id !== deleteId);
          this.dataSource.data = [...this.usuarios];
          this.applyFilters();
          if (this.selected?.id === deleteId) {
            this.resetFormState();
          }
          this.successMsg = 'Usuario eliminado.';
          this.notify(this.successMsg);
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMsg = err.error?.error || 'Error al eliminar usuario.';
        }
      });
    }
    this.showConfirmDelete = false;
    this.toDeleteId = null;
  }

  cancelar(): void {
    this.resetFormState();
    this.clearMessages();
  }

  resetFormState(): void {
    this.selected = null;
    this.isNew = false;
    this.form = this.emptyForm();
  }

  clearMessages(): void {
    this.successMsg = '';
    this.errorMsg = '';
  }

  private notify(message: string): void {
    this.snack.open(message, 'Cerrar', { duration: 2800 });
  }
}
