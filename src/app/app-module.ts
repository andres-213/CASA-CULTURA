import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';

import { AppRoutingModule } from './app-routing-module';
import { AppComponent } from './app';
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

@NgModule({
  declarations: [
    AppComponent, LoginComponent, DashboardComponent,
    ParticipantesComponent, InstructoresComponent, DisciplinasComponent,
    TalleresComponent, SalonesComponent, InscripcionesComponent,
    AsistenciaComponent, MaterialesComponent, ReportesComponent, UsuariosComponent,
    PerfilComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    MatSidenavModule, MatToolbarModule, MatButtonModule, MatIconModule,
    MatListModule, MatCardModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatTableModule, MatPaginatorModule, MatSortModule,
    MatSnackBarModule, MatDialogModule, MatProgressSpinnerModule,
    MatSlideToggleModule, MatChipsModule, MatBadgeModule, MatTooltipModule,
    MatMenuModule, MatTabsModule, MatCheckboxModule, MatDividerModule,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
