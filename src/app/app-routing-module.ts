import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ParticipantesComponent } from './pages/participantes/participantes.component';
import { InstructoresComponent } from './pages/instructores/instructores.component';
import { DisciplinasComponent } from './pages/disciplinas/disciplinas.component';
import { TalleresComponent } from './pages/talleres/talleres.component';
import { SalonesComponent } from './pages/salones/salones.component';
import { InscripcionesComponent } from './pages/inscripciones/inscripciones.component';
import { AsistenciaComponent } from './pages/asistencia/asistencia.component';
import { MaterialesComponent } from './pages/materiales/materiales.component';
import { ReportesComponent } from './pages/reportes/reportes.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';
import { PerfilComponent } from './pages/perfil/perfil.component';

const routes: Routes = [
  { path: 'login',        component: LoginComponent },
  { path: 'dashboard',    component: DashboardComponent,    canActivate: [AuthGuard] },
  { path: 'participantes',component: ParticipantesComponent,canActivate: [AuthGuard] },
  { path: 'instructores', component: InstructoresComponent, canActivate: [AuthGuard] },
  { path: 'disciplinas',  component: DisciplinasComponent,  canActivate: [AuthGuard] },
  { path: 'talleres',     component: TalleresComponent,     canActivate: [AuthGuard] },
  { path: 'salones',      component: SalonesComponent,      canActivate: [AuthGuard] },
  { path: 'inscripciones',component: InscripcionesComponent,canActivate: [AuthGuard] },
  { path: 'asistencia',   component: AsistenciaComponent,   canActivate: [AuthGuard] },
  { path: 'materiales',   component: MaterialesComponent,   canActivate: [AuthGuard] },
  { path: 'reportes',     component: ReportesComponent,     canActivate: [AuthGuard] },
  { path: 'usuarios',     component: UsuariosComponent,     canActivate: [AuthGuard], data: { adminOnly: true } },
  { path: 'perfil',       component: PerfilComponent,       canActivate: [AuthGuard] },
  { path: '',             redirectTo: '/login', pathMatch: 'full' },
  { path: '**',           redirectTo: '/login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
