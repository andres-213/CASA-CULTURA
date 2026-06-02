import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { Usuario } from '../../models/models';

@Component({
  standalone: false,
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {
  user: Usuario | null = null;
  password = '';
  confirmPassword = '';
  hidePassword = true;
  currentPassword = '';
  currentPasswordTouched = false;
  passwordTouched = false;
  confirmPasswordTouched = false;

  constructor(
    private auth: AuthService,
    private data: DataService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.user = this.auth.getCurrentUser();
  }

  get initial(): string {
    return this.user?.nombre?.charAt(0).toUpperCase() || 'U';
  }

  cambiarPassword(): void {
    if (!this.user) return;
    if (this.currentPassword.length === 0) {
      this.notify('Ingrese la contraseña actual.');
      return;
    }
    if (this.containsEmojiOrControl(this.currentPassword)) {
      this.notify('La contraseña actual contiene caracteres no válidos.');
      return;
    }
    if (this.password.length < 9) {
      this.notify('La contrasena debe tener al menos 9 caracteres.');
      return;
    }
    if (this.containsEmojiOrControl(this.password)) {
      this.notify('La contraseña contiene caracteres no válidos (emojis no permitidos).');
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.notify('Las contrasenas no coinciden.');
      return;
    }
    // Send currentPassword along with new password - backend should verify it.
    this.data.updateUsuario(this.user.id, { currentPassword: this.currentPassword, password: this.password }).subscribe({
      next: () => {
        this.password = '';
        this.confirmPassword = '';
        this.currentPassword = '';
        this.passwordTouched = this.confirmPasswordTouched = this.currentPasswordTouched = false;
        this.notify('Contrasena actualizada.');
      },
      error: () => this.notify('No se pudo actualizar la contrasena.')
    });
  }

  containsEmojiOrControl(value: string): boolean {
    return /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\uFE0F\u200D\p{Cc}]/u.test(value);
  }

  private notify(message: string): void {
    this.snack.open(message, 'Cerrar', { duration: 3000 });
  }
}
