import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data.service';
import { ReporteDisciplina, ReporteParticipantesTaller } from '../../models/models';

@Component({ standalone: false,
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss']
})
export class ReportesComponent implements OnInit {
  reporteDisciplinas: ReporteDisciplina[] = [];
  reporteTalleres: ReporteParticipantesTaller[] = [];
  joinCompleto: any[] = [];
  joinFiltered: any[] = [];
  joinSearch = '';
  activeTab = 0;

  colsDisciplinas = ['disciplina', 'talleres', 'instructores', 'participantes', 'porcentaje'];
  colsTalleres = ['taller', 'disciplina', 'instructor', 'salon', 'horario', 'inscritos', 'disponible'];
  colsJoin = ['participante', 'cedula', 'barrio', 'taller', 'disciplina', 'instructor', 'horario', 'fecha'];

  totalParticipantes = 0;

  constructor(private data: DataService) {}

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.data.getReportePorDisciplina().subscribe(reporteDisciplinas => {
      this.reporteDisciplinas = reporteDisciplinas;
      this.totalParticipantes = reporteDisciplinas.reduce((s, d) => s + d.totalParticipantes, 0);
    });
    this.data.getReporteParticipantesPorTaller().subscribe(reporteTalleres => {
      this.reporteTalleres = reporteTalleres;
    });
    this.data.getReporteJoinCompleto().subscribe(joinCompleto => {
      this.joinCompleto = joinCompleto;
      this.joinFiltered = [...joinCompleto];
    });
  }

  getPorcentaje(d: ReporteDisciplina): number {
    const total = this.reporteDisciplinas.reduce((s, r) => s + r.totalParticipantes, 0);
    return total > 0 ? Math.round((d.totalParticipantes / total) * 100) : 0;
  }

  applyJoinFilter(): void {
    const t = this.joinSearch.toLowerCase();
    this.joinFiltered = this.joinCompleto.filter(r =>
      !t || r.participante.toLowerCase().includes(t) || r.taller.toLowerCase().includes(t) ||
      r.disciplina.toLowerCase().includes(t) || r.instructor.toLowerCase().includes(t) ||
      r.cedula.includes(t)
    );
  }

  getTotalInscritos(): number {
    return this.reporteTalleres.reduce((s, t) => s + t.totalInscritos, 0);
  }

  getOcupacionPct(t: ReporteParticipantesTaller): number {
    return Math.round((t.totalInscritos / t.cupoMaximo) * 100);
  }

  imprimirReporte(): void { window.print(); }

  exportarCsv(): void {
    const fileName = ['disciplinas', 'ocupacion-talleres', 'join-completo'][this.activeTab] || 'reporte';
    const rows = this.getActiveRows();
    if (!rows.length) return;

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map(row => headers.map(header => this.csvValue(row[header])).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private getActiveRows(): any[] {
    if (this.activeTab === 0) return this.reporteDisciplinas;
    if (this.activeTab === 1) return this.reporteTalleres;
    return this.joinFiltered;
  }

  private csvValue(value: any): string {
    const text = String(value ?? '').replace(/"/g, '""');
    return `"${text}"`;
  }
}
