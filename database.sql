-- ============================================================
-- SISTEMA DE GESTIÓN CASA DE LA CULTURA MUNICIPAL
-- Script de creación de base de datos con datos de prueba
-- SGBD: MySQL 8.0+ / MariaDB 10.6+
-- ============================================================

CREATE DATABASE IF NOT EXISTS casa_cultura
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE casa_cultura;

-- ============================================================
-- TABLA 1: USUARIOS (autenticación al sistema)
-- ============================================================
CREATE TABLE usuarios (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    nombre      VARCHAR(120) NOT NULL,
    rol         ENUM('admin','operador') NOT NULL DEFAULT 'operador',
    activo      TINYINT(1)   NOT NULL DEFAULT 1,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_rol CHECK (rol IN ('admin','operador'))
) ENGINE=InnoDB;

-- ============================================================
-- TABLA 2: DISCIPLINAS (catálogo de disciplinas artísticas)
-- Relación: 1 disciplina → N instructores, N talleres
-- ============================================================
CREATE TABLE disciplinas (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(80)  NOT NULL,
    descripcion TEXT,
    color       VARCHAR(10)  NOT NULL DEFAULT '#6c2bd9',
    icono       VARCHAR(50)  NOT NULL DEFAULT 'palette'
) ENGINE=InnoDB;

-- ============================================================
-- TABLA 3: SALONES (espacios físicos disponibles)
-- ============================================================
CREATE TABLE salones (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre        VARCHAR(100) NOT NULL,
    capacidad     SMALLINT UNSIGNED NOT NULL,
    equipamiento  TEXT,
    disponible    TINYINT(1)   NOT NULL DEFAULT 1,
    CONSTRAINT chk_capacidad CHECK (capacidad > 0)
) ENGINE=InnoDB;

-- ============================================================
-- TABLA 4: INSTRUCTORES
-- Relación: N instructores → 1 disciplina (FK)
-- ============================================================
CREATE TABLE instructores (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(80)  NOT NULL,
    apellido        VARCHAR(80)  NOT NULL,
    email           VARCHAR(120) NOT NULL,
    telefono        VARCHAR(20),
    disciplina_id   INT UNSIGNED NOT NULL,
    tipo            ENUM('voluntario','contratado') NOT NULL DEFAULT 'voluntario',
    activo          TINYINT(1)   NOT NULL DEFAULT 1,
    fecha_ingreso   DATE,
    CONSTRAINT fk_inst_disc FOREIGN KEY (disciplina_id)
        REFERENCES disciplinas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_tipo CHECK (tipo IN ('voluntario','contratado'))
) ENGINE=InnoDB;

-- ============================================================
-- TABLA 5: TALLERES
-- Relación 1:N con disciplinas, instructores y salones
-- Regla: no se puede ocupar un salón dos veces en el mismo horario
-- ============================================================
CREATE TABLE talleres (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre        VARCHAR(120) NOT NULL,
    disciplina_id INT UNSIGNED NOT NULL,
    instructor_id INT UNSIGNED NOT NULL,
    salon_id      INT UNSIGNED NOT NULL,
    horario       VARCHAR(60)  NOT NULL,
    dia_semana    VARCHAR(15)  NOT NULL,
    hora_inicio   TIME         NOT NULL,
    hora_fin      TIME         NOT NULL,
    cupo_maximo   SMALLINT UNSIGNED NOT NULL DEFAULT 20,
    cupo_actual   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    trimestre     VARCHAR(10)  NOT NULL,
    activo        TINYINT(1)   NOT NULL DEFAULT 1,
    CONSTRAINT fk_tall_disc   FOREIGN KEY (disciplina_id)  REFERENCES disciplinas(id)  ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tall_inst   FOREIGN KEY (instructor_id)  REFERENCES instructores(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tall_salon  FOREIGN KEY (salon_id)       REFERENCES salones(id)      ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_horario    CHECK (hora_fin > hora_inicio),
    CONSTRAINT chk_cupo       CHECK (cupo_actual <= cupo_maximo)
) ENGINE=InnoDB;

-- ============================================================
-- TABLA 6: PARTICIPANTES
-- ============================================================
CREATE TABLE participantes (
    id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre            VARCHAR(80)  NOT NULL,
    apellido          VARCHAR(80)  NOT NULL,
    cedula            VARCHAR(20)  NOT NULL UNIQUE,
    email             VARCHAR(120),
    telefono          VARCHAR(20),
    fecha_nacimiento  DATE,
    edad              TINYINT UNSIGNED,
    barrio            VARCHAR(80),
    activo            TINYINT(1)   NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- ============================================================
-- TABLA 7: INSCRIPCIONES (relación MUCHOS A MUCHOS: participantes ↔ talleres)
-- Tabla intermedia obligatoria
-- Reglas: no sobrecupo, no horario simultáneo
-- ============================================================
CREATE TABLE inscripciones (
    id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    participante_id    INT UNSIGNED NOT NULL,
    taller_id          INT UNSIGNED NOT NULL,
    fecha_inscripcion  DATE         NOT NULL DEFAULT (CURDATE()),
    estado             ENUM('activa','retirada','completada') NOT NULL DEFAULT 'activa',
    CONSTRAINT fk_insc_part  FOREIGN KEY (participante_id) REFERENCES participantes(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_insc_tall  FOREIGN KEY (taller_id)       REFERENCES talleres(id)      ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT uq_insc       UNIQUE (participante_id, taller_id)
) ENGINE=InnoDB;

-- ============================================================
-- TABLA 8: SESIONES_TALLER (instancias de cada sesión de clase)
-- ============================================================
CREATE TABLE sesiones_taller (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    taller_id       INT UNSIGNED NOT NULL,
    fecha           DATE         NOT NULL,
    tema            VARCHAR(200) NOT NULL,
    observaciones   TEXT,
    CONSTRAINT fk_ses_tall FOREIGN KEY (taller_id) REFERENCES talleres(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TABLA 9: ASISTENCIAS (participante por sesión)
-- ============================================================
CREATE TABLE asistencias (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sesion_id       INT UNSIGNED NOT NULL,
    participante_id INT UNSIGNED NOT NULL,
    asistio         TINYINT(1)   NOT NULL DEFAULT 1,
    observacion     VARCHAR(255),
    CONSTRAINT fk_asis_ses  FOREIGN KEY (sesion_id)       REFERENCES sesiones_taller(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_asis_part FOREIGN KEY (participante_id) REFERENCES participantes(id)   ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT uq_asis      UNIQUE (sesion_id, participante_id)
) ENGINE=InnoDB;

-- ============================================================
-- TABLA 10: MATERIALES (inventario artístico)
-- ============================================================
CREATE TABLE materiales (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre               VARCHAR(120)      NOT NULL,
    descripcion          TEXT,
    cantidad_disponible  INT UNSIGNED      NOT NULL DEFAULT 0,
    costo_unitario       DECIMAL(12,2)     NOT NULL DEFAULT 0,
    unidad               VARCHAR(30)       NOT NULL DEFAULT 'unidad',
    categoria            VARCHAR(60),
    CONSTRAINT chk_costo CHECK (costo_unitario >= 0)
) ENGINE=InnoDB;

-- ============================================================
-- TABLA 11: USO_MATERIALES (registro de uso por taller)
-- Regla: inventario no puede quedar negativo
-- ============================================================
CREATE TABLE uso_materiales (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    material_id     INT UNSIGNED  NOT NULL,
    taller_id       INT UNSIGNED  NOT NULL,
    fecha           DATE          NOT NULL,
    cantidad_usada  INT UNSIGNED  NOT NULL,
    observaciones   TEXT,
    CONSTRAINT fk_uso_mat   FOREIGN KEY (material_id) REFERENCES materiales(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_uso_tall  FOREIGN KEY (taller_id)   REFERENCES talleres(id)   ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_cantidad CHECK (cantidad_usada > 0)
) ENGINE=InnoDB;

-- ============================================================
-- TRIGGER: Controlar cupo al inscribir (regla de negocio)
-- ============================================================
DELIMITER $$
CREATE TRIGGER before_inscripcion_insert
BEFORE INSERT ON inscripciones
FOR EACH ROW
BEGIN
    DECLARE v_cupo_actual SMALLINT;
    DECLARE v_cupo_maximo SMALLINT;
    SELECT cupo_actual, cupo_maximo INTO v_cupo_actual, v_cupo_maximo
    FROM talleres WHERE id = NEW.taller_id;
    IF v_cupo_actual >= v_cupo_maximo THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El taller ha superado su cupo máximo.';
    END IF;
    UPDATE talleres SET cupo_actual = cupo_actual + 1 WHERE id = NEW.taller_id;
END$$

CREATE TRIGGER after_inscripcion_delete
AFTER DELETE ON inscripciones
FOR EACH ROW
BEGIN
    IF OLD.estado = 'activa' THEN
        UPDATE talleres SET cupo_actual = cupo_actual - 1 WHERE id = OLD.taller_id AND cupo_actual > 0;
    END IF;
END$$

-- TRIGGER: Controlar inventario de materiales
CREATE TRIGGER before_uso_material_insert
BEFORE INSERT ON uso_materiales
FOR EACH ROW
BEGIN
    DECLARE v_disponible INT;
    SELECT cantidad_disponible INTO v_disponible FROM materiales WHERE id = NEW.material_id;
    IF v_disponible < NEW.cantidad_usada THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Inventario insuficiente para registrar el uso del material.';
    END IF;
    UPDATE materiales SET cantidad_disponible = cantidad_disponible - NEW.cantidad_usada WHERE id = NEW.material_id;
END$$

DELIMITER ;

-- ============================================================
-- VISTAS (equivalente a consultas JOIN)
-- ============================================================

CREATE VIEW v_inscripciones_completa AS
SELECT
    i.id              AS inscripcion_id,
    p.nombre          AS participante_nombre,
    p.apellido        AS participante_apellido,
    p.cedula,
    p.barrio,
    t.nombre          AS taller_nombre,
    d.nombre          AS disciplina_nombre,
    CONCAT(ins.nombre,' ',ins.apellido) AS instructor_nombre,
    s.nombre          AS salon_nombre,
    t.horario,
    i.fecha_inscripcion,
    i.estado
FROM inscripciones i
JOIN participantes p  ON p.id  = i.participante_id
JOIN talleres      t  ON t.id  = i.taller_id
JOIN disciplinas   d  ON d.id  = t.disciplina_id
JOIN instructores  ins ON ins.id = t.instructor_id
JOIN salones       s  ON s.id  = t.salon_id;

CREATE VIEW v_reporte_por_disciplina AS
SELECT
    d.id                    AS disciplina_id,
    d.nombre                AS disciplina,
    COUNT(DISTINCT t.id)    AS total_talleres,
    COUNT(DISTINCT t.instructor_id) AS total_instructores,
    COUNT(DISTINCT CASE WHEN i.estado='activa' THEN i.participante_id END) AS total_participantes
FROM disciplinas d
LEFT JOIN talleres      t ON t.disciplina_id = d.id
LEFT JOIN inscripciones i ON i.taller_id     = t.id
GROUP BY d.id, d.nombre;

-- ============================================================
-- DATOS DE PRUEBA
-- ============================================================

INSERT INTO usuarios (username, password, nombre, rol) VALUES
('admin',    'admin123',  'Administrador Sistema', 'admin'),
('operador', 'op123',     'Operador General',      'operador');

INSERT INTO disciplinas (nombre, descripcion, color, icono) VALUES
('Música',          'Teoría musical, instrumentos y composición',       '#FF6B6B', 'music_note'),
('Danza',           'Diferentes estilos de danza y expresión corporal', '#4ECDC4', 'directions_run'),
('Artes Plásticas', 'Pintura, escultura y dibujo',                      '#FFE66D', 'palette'),
('Teatro',          'Actuación, dramaturgia y dirección escénica',      '#A8E6CF', 'theater_comedy'),
('Literatura',      'Escritura creativa, poesía y narrativa',           '#DDA0DD', 'menu_book');

INSERT INTO salones (nombre, capacidad, equipamiento) VALUES
('Salón Principal',  30, 'Sillas, tablero, proyector, equipo de sonido'),
('Sala de Música',   20, 'Pianos, guitarras, amplificadores, atriles'),
('Estudio de Danza', 25, 'Espejos, barra de ballet, equipo de sonido, piso laminado'),
('Taller de Artes',  20, 'Caballetes, mesas de trabajo, lavamanos, iluminación especial'),
('Sala de Teatro',   35, 'Escenario, iluminación escénica, camerinos, graderías');

INSERT INTO instructores (nombre, apellido, email, telefono, disciplina_id, tipo, activo, fecha_ingreso) VALUES
('Carlos',    'Ramírez',  'carlos.r@cultura.gov',  '3001234567', 1, 'contratado', 1, '2022-01-15'),
('María',     'González', 'maria.g@cultura.gov',   '3107654321', 2, 'contratado', 1, '2021-08-01'),
('Luis',      'Martínez', 'luis.m@cultura.gov',    '3209876543', 3, 'voluntario', 1, '2023-02-10'),
('Ana',       'Herrera',  'ana.h@cultura.gov',     '3151122334', 4, 'contratado', 1, '2022-09-05'),
('Jorge',     'Pedraza',  'jorge.p@cultura.gov',   '3005566778', 5, 'voluntario', 0, '2020-03-20');

INSERT INTO talleres (nombre, disciplina_id, instructor_id, salon_id, horario, dia_semana, hora_inicio, hora_fin, cupo_maximo, cupo_actual, trimestre) VALUES
('Guitarra Básica',     1, 1, 2, 'Lunes 08:00-10:00',      'Lunes',     '08:00', '10:00', 15, 0, '2024-Q1'),
('Danza Folclórica',    2, 2, 3, 'Martes 10:00-12:00',     'Martes',    '10:00', '12:00', 20, 0, '2024-Q1'),
('Pintura en Acuarela', 3, 3, 4, 'Miércoles 14:00-16:00',  'Miércoles', '14:00', '16:00', 15, 0, '2024-Q1'),
('Teatro Juvenil',      4, 4, 5, 'Jueves 16:00-18:00',     'Jueves',    '16:00', '18:00', 25, 0, '2024-Q1'),
('Escritura Creativa',  5, 1, 1, 'Viernes 09:00-11:00',    'Viernes',   '09:00', '11:00', 20, 0, '2024-Q1'),
('Piano Intermedio',    1, 1, 2, 'Lunes 14:00-16:00',      'Lunes',     '14:00', '16:00', 10, 0, '2024-Q1');

INSERT INTO participantes (nombre, apellido, cedula, email, telefono, fecha_nacimiento, edad, barrio) VALUES
('Sofía',     'Vargas',  '1001234567', 'sofia.v@mail.com',   '3101234567', '2005-03-15', 19, 'El Centro'),
('Miguel',    'Torres',  '1002345678', 'miguel.t@mail.com',  '3202345678', '2008-07-22', 15, 'Las Américas'),
('Valentina', 'Ríos',    '1003456789', 'vale.r@mail.com',    '3003456789', '2003-11-30', 20, 'Bello Horizonte'),
('Andrés',    'Castro',  '1004567890', 'andres.c@mail.com',  '3154567890', '2010-01-10', 14, 'Villa del Mar'),
('Camila',    'Moreno',  '1005678901', 'camila.m@mail.com',  '3005678901', '2007-05-25', 17, 'El Centro'),
('Sebastián', 'Díaz',    '1006789012', 'seba.d@mail.com',    '3106789012', '2004-09-08', 19, 'La Floresta'),
('Isabella',  'Mejía',   '1007890123', 'isa.m@mail.com',     '3207890123', '2009-12-03', 14, 'Las Américas'),
('Daniel',    'Ortiz',   '1008901234', 'daniel.o@mail.com',  '3008901234', '2006-04-17', 18, 'San Nicolás');

-- Inscripciones (MUCHOS A MUCHOS)
INSERT INTO inscripciones (participante_id, taller_id, fecha_inscripcion, estado) VALUES
(1, 1, '2024-01-10', 'activa'),
(2, 2, '2024-01-10', 'activa'),
(3, 3, '2024-01-11', 'activa'),
(4, 4, '2024-01-11', 'activa'),
(5, 1, '2024-01-12', 'activa'),
(6, 2, '2024-01-12', 'activa'),
(7, 5, '2024-01-13', 'activa'),
(8, 3, '2024-01-13', 'activa'),
(1, 5, '2024-01-14', 'activa'),
(3, 4, '2024-01-14', 'activa');

INSERT INTO sesiones_taller (taller_id, fecha, tema, observaciones) VALUES
(1, '2024-01-15', 'Introducción a los acordes', 'Buena participación del grupo'),
(1, '2024-01-22', 'Escalas básicas',             'Se requiere más práctica individual'),
(2, '2024-01-16', 'Pasos básicos de cumbia',     'Excelente disposición y actitud'),
(3, '2024-01-17', 'Manejo del pincel',           'Técnica inicial satisfactoria');

INSERT INTO asistencias (sesion_id, participante_id, asistio, observacion) VALUES
(1, 1, 1, ''), (1, 5, 1, ''),
(2, 1, 0, 'Excusa médica'), (2, 5, 1, ''),
(3, 2, 1, ''), (3, 6, 1, '');

INSERT INTO materiales (nombre, descripcion, cantidad_disponible, costo_unitario, unidad, categoria) VALUES
('Acuarelas Premium',   'Set de 24 colores profesionales',          15, 45000, 'set',    'Artes Plásticas'),
('Cuerdas de Guitarra', 'Cuerdas de nylon para guitarra clásica',   30, 18000, 'juego',  'Música'),
('Lienzo 40x50',        'Lienzo de algodón preparado',              25, 22000, 'unidad', 'Artes Plásticas'),
('Cuadernos de Notas',  'Cuadernos pautados para música',           50,  8000, 'unidad', 'Música'),
('Pinceles Set x10',    'Set de pinceles profesionales',            12, 35000, 'set',    'Artes Plásticas'),
('Maquillaje Teatral',  'Kit de maquillaje para escena',             8, 65000, 'kit',    'Teatro');

-- ============================================================
-- CONSULTAS DE VERIFICACIÓN
-- ============================================================

-- 1. Reporte JOIN: participantes con taller, instructor y disciplina
-- SELECT * FROM v_inscripciones_completa;

-- 2. Reporte municipal: participantes por disciplina
-- SELECT * FROM v_reporte_por_disciplina ORDER BY total_participantes DESC;

-- 3. Talleres disponibles (con cupo)
-- SELECT nombre, cupo_maximo - cupo_actual AS disponible FROM talleres WHERE cupo_actual < cupo_maximo AND activo = 1;

-- 4. Filtro por disciplina
-- SELECT t.nombre, d.nombre AS disciplina, CONCAT(i.nombre,' ',i.apellido) AS instructor
-- FROM talleres t JOIN disciplinas d ON d.id = t.disciplina_id JOIN instructores i ON i.id = t.instructor_id
-- WHERE t.disciplina_id = 1;
