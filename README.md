# Casa Cultura Municipal — Sistema de Gestión

Sistema web desarrollado con **Angular 21** y **Angular Material** para la gestión integral de la Casa de la Cultura Municipal. Permite administrar participantes, instructores, disciplinas, talleres, salones, inscripciones, asistencia, materiales e inventario, con generación de reportes de cobertura para el informe municipal.

---

## 🏛️ Descripción

La Casa de la Cultura Municipal ofrece talleres artísticos gratuitos o de bajo costo: **música, danza, artes plásticas, teatro y literatura**. Este sistema reemplaza la gestión manual de inscripciones, asistencia y recursos, eliminando errores de sobrecupo, pérdida de materiales y dificultades en los reportes.

---

## 🗂️ Módulos del Sistema

| Módulo | Descripción |
|--------|-------------|
| **Acceso al Sistema** | Login con validación de usuario y contraseña, guard de rutas |
| **Gestión de Usuarios** | CRUD de usuarios del sistema con roles (admin / operador) |
| **Gestión de Participantes** | CRUD con datos personales, edad, barrio y estado |
| **Gestión de Instructores** | CRUD con disciplina principal, tipo (contratado/voluntario) y estado |
| **Disciplinas Artísticas** | CRUD con color identificador e ícono |
| **Talleres** | CRUD con filtros por disciplina, instructor y disponibilidad de cupo |
| **Salones** | CRUD con capacidad y equipamiento |
| **Inscripciones** | Inscripción muchos-a-muchos con validación de cupo y horario |
| **Asistencia** | Registro de sesiones y control de asistencia por participante |
| **Materiales** | Inventario con registro de uso y descuento automático de stock |
| **Reportes** | Participantes por disciplina (informe municipal), ocupación de talleres, consulta JOIN completa |
| **Dashboard** | KPIs, gráficas de distribución y acceso rápido a módulos |

---

## 🗄️ Modelo de Base de Datos

**11 tablas** con las siguientes relaciones:

```
usuarios            → autenticación
disciplinas         → catálogo artístico
salones             → espacios físicos
instructores        → FK → disciplinas              (1:N)
talleres            → FK → disciplinas, instructores, salones  (1:N)
participantes       → datos personales
inscripciones       → FK → participantes, talleres  (N:M — tabla intermedia)
sesiones_taller     → FK → talleres                 (1:N)
asistencias         → FK → sesiones_taller, participantes (N:M)
materiales          → inventario artístico
uso_materiales      → FK → materiales, talleres     (N:M)
```

---

## ⚙️ Reglas de Negocio Implementadas

1. ❌ No se puede inscribir a un participante en un taller que superó su cupo
2. ❌ Un participante no puede inscribirse en dos talleres con horario simultáneo
3. ❌ El inventario de materiales no puede quedar negativo
4. ❌ No se puede programar un taller en un salón ya ocupado en el mismo horario
5. ❌ Un instructor inactivo no puede ser asignado a un nuevo taller

---

## 🛠️ Herramientas Utilizadas

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Angular | 21.x | Framework principal (SPA) |
| Angular Material | 19.x | Componentes UI (tabla, formularios, menús) |
| TypeScript | 5.x | Lenguaje principal |
| SCSS | — | Estilos con variables CSS custom |
| MySQL 8 / MariaDB | 10.6+ | Base de datos relacional |
| Angular Router | — | Navegación y lazy routing |
| Angular Forms | — | FormsModule (ngModel) |

---

## 🏗️ Arquitectura MVC

```
src/
├── app/
│   ├── models/          → Interfaces TypeScript (Modelos)
│   ├── services/        → DataService, AuthService (lógica de negocio)
│   ├── guards/          → AuthGuard (protección de rutas)
│   └── pages/           → Componentes Vista + Controlador
│       ├── login/
│       ├── dashboard/
│       ├── participantes/
│       ├── instructores/
│       ├── disciplinas/
│       ├── talleres/
│       ├── salones/
│       ├── inscripciones/
│       ├── asistencia/
│       ├── materiales/
│       ├── reportes/
│       └── usuarios/
├── database.sql         → Script SQL completo con datos de prueba
└── README.md
```

---

## 🚀 Instalación y Ejecución

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU_USUARIO/casa-cultura-municipal.git
cd casa-cultura-municipal

# 2. Instalar dependencias
npm install

# 3. Ejecutar en modo desarrollo
ng serve

# 4. Abrir en el navegador
# http://localhost:4200
```

**Credenciales de acceso demo:**
- Usuario: `admin` / Contraseña: `admin12345`
- Usuario: `operador` / Contraseña: `op123`

---

## 🗃️ Base de Datos

```bash
# Importar el script en MySQL
mysql -u root -p < database.sql
```

El script crea la base de datos `casa_cultura` con todas las tablas, triggers, vistas y datos de prueba.

---

## 📦 Compilar para producción

```bash
ng build
# Archivos generados en: dist/casa-cultura/browser/
```

---

## 👤 Autor

**[Miguel Silgado]**  
Materia: Programación Web 
Institución: [SENA]  
Año: 2026

