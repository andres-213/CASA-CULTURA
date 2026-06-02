import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { ReporteDisciplina } from '../../models/models';

@Component({ standalone: false,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats: any = {};
  reporteDisciplinas: ReporteDisciplina[] = [];
  reporteTalleres: any[] = [];
  userName = '';

  constructor(private data: DataService, private auth: AuthService) {}

  ngOnInit(): void {
    this.data.getEstadisticasDashboard().subscribe(stats => {
      this.stats = stats;
    });
    this.data.getReportePorDisciplina().subscribe(reporteDisciplinas => {
      this.reporteDisciplinas = reporteDisciplinas;
    });
    this.data.getReporteParticipantesPorTaller().subscribe(reporteTalleres => {
      this.reporteTalleres = reporteTalleres.slice(0, 5);
    });
    const u = this.auth.getCurrentUser();
    this.userName = u?.nombre || 'Usuario';
  }

  get today(): Date { return new Date(); }

  getOcupacionPct(taller: any): number {
    return Math.round((taller.totalInscritos / taller.cupoMaximo) * 100);
  }

  getOcupacionColor(pct: number): string {
    if (pct >= 90) return '#ef4444';
    if (pct >= 70) return '#f59e0b';
    return '#22c55e';
  }
}
