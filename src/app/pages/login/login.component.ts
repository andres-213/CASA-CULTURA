import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({ standalone: false,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;
  hidePassword = true;
  

  constructor(private auth: AuthService, private router: Router) {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  login(loginForm: NgForm): void {
    if (loginForm.invalid) {
      this.error = 'Por favor complete todos los campos obligatorios con datos validos.';
      return;
    }

    this.loading = true;
    this.error = '';

    this.auth.login(this.username.trim(), this.password).subscribe({
      next: loggedIn => {
        this.loading = false;
        if (loggedIn) {
          this.router.navigate(['/dashboard']);
        } else {
          this.error = 'Credenciales incorrectas. Verifique su usuario y contrasena.';
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'Ocurrio un error al iniciar sesion. Intente de nuevo mas tarde.';
      }
    });
  }

  showForgotPassword(): void {
    // Removed
  }

  backToLogin(): void {
    // Removed
  }

  requestRecoveryQuestion(): void {
    // Removed
  }

  resetPassword(): void {
    // Removed
  }
}
