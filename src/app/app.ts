import { Component, OnInit, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from './services/auth.service';
import { filter } from 'rxjs/operators';

@Component({ standalone: false,
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent implements OnInit {
  isLoginPage = true;
  isLoggedIn = false;
  isMobile = false;
  currentPageTitle = 'Dashboard';
  userName = '';
  userInitial = 'A';
  userRole = '';
  isAdmin = false;
  isDarkMode = false;

  private pageTitles: { [key: string]: string } = {
    '/dashboard':     'Dashboard',
    '/participantes': 'Gestión de Participantes',
    '/instructores':  'Gestión de Instructores',
    '/usuarios':      'Gestión de Usuarios',
    '/disciplinas':   'Disciplinas Artísticas',
    '/talleres':      'Talleres',
    '/salones':       'Salones',
    '/inscripciones': 'Inscripciones',
    '/asistencia':    'Registro de Asistencia',
    '/materiales':    'Materiales',
    '/reportes':      'Reportes Municipales',
    '/perfil':        'Mi Perfil',
  };

  constructor(public auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.checkMobile();
    this.isDarkMode = localStorage.getItem('theme') === 'dark';
    this.applyTheme();
    // Set initial state
    this.isLoggedIn = this.auth.isLoggedIn();
    this.isLoginPage = !this.isLoggedIn;

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        const url = e.urlAfterRedirects || e.url;
        this.isLoginPage = url === '/login' || url.startsWith('/login');
        this.isLoggedIn = this.auth.isLoggedIn();
        this.currentPageTitle = this.pageTitles[url] || 'Casa de la Cultura';

        const u = this.auth.getCurrentUser();
        if (u) {
          this.userName    = u.nombre;
          this.userInitial = u.nombre.charAt(0).toUpperCase();
          this.userRole    = u.rol === 'admin' ? 'Administrador' : 'Operador';
          this.isAdmin     = u.rol === 'admin';
        }
      });
  }

  @HostListener('window:resize')
  checkMobile(): void { this.isMobile = window.innerWidth < 768; }

  logout(): void {
    this.auth.logout();
    this.isLoggedIn = false;
    this.isLoginPage = true;
    this.isAdmin = false;
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme(): void {
    document.body.classList.toggle('dark-theme', this.isDarkMode);
  }
}
