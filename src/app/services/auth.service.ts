import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Usuario } from '../models/models';
import { DataService } from './data.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser: Usuario | null = null;

  constructor(private data: DataService, private router: Router) {
    const stored = sessionStorage.getItem('currentUser');
    if (stored) this.currentUser = JSON.parse(stored);
  }

  login(username: string, password: string): Observable<boolean> {
    return this.data.login(username, password).pipe(
      map(user => {
        if (user) {
          this.currentUser = user;
          sessionStorage.setItem('currentUser', JSON.stringify(user));
          return true;
        }
        this.currentUser = null;
        sessionStorage.removeItem('currentUser');
        return false;
      }),
      catchError(() => {
        this.currentUser = null;
        sessionStorage.removeItem('currentUser');
        return of(false);
      })
    );
  }

  logout(): void {
    this.currentUser = null;
    sessionStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean { return this.currentUser !== null; }
  getCurrentUser(): Usuario | null { return this.currentUser; }
  isAdmin(): boolean { return this.currentUser?.rol === 'admin'; }
}
