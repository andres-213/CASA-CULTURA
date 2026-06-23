const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de MySQL (ajusta según tu configuración)
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // ← CAMBIA ESTO: pon tu contraseña de MySQL root
  database: 'casa_cultura',
  charset: 'utf8mb4'
});

// Conectar a MySQL
db.connect((err) => {
  if (err) {
    console.error('Error conectando a MySQL:', err);
    return;
  }
  console.log('Conectado a MySQL');
  // No automatic migration for password recovery fields (feature removed)
  console.log('Recuperación de contraseña deshabilitada: no se aplicarán migraciones.');
});

// Helper para ejecutar queries con promesas
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

const hasEmojiOrControl = (value = '') => /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\uFE0F\u200D\p{Cc}]/u.test(value);
const isValidUsername = (value = '') => /^[\p{L}]+$/u.test(value.trim());
const isValidFullName = (value = '') => /^[\p{L}]+(?:\s+[\p{L}]+)*$/u.test(value.trim());
const isValidPassword = (value = '') => typeof value === 'string' && value.length > 8 && !hasEmojiOrControl(value);

const validateUsuario = ({ username, password, nombre }, requirePassword = true) => {
  if (!isValidUsername(username)) {
    return 'El nombre de usuario solo puede contener letras, sin números ni símbolos.';
  }
  if (!isValidFullName(nombre)) {
    return 'El nombre completo solo puede contener letras y espacios.';
  }
  if ((requirePassword || password) && !isValidPassword(password)) {
    return 'La contraseña debe tener más de 8 caracteres y no puede contener emojis.';
  }
  return null;
};

const parseInteger = (value) => {
  const number = Number(value);
  return Number.isInteger(number) ? number : NaN;
};

const parseFloatValue = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
};

const hashPassword = async (password) => bcrypt.hash(password, 6);
const comparePassword = async (plain, hash) => bcrypt.compare(plain, hash);
const isPasswordHashed = (value = '') => typeof value === 'string' && /^\$2[aby]\$/.test(value);
const sanitizeUser = ({ password, ...user }) => user;

const isNonNegativeInteger = (value) => Number.isInteger(value) && value >= 0;

const toBoolean = (value) => value === true || value === 'true' || value === 1 || value === '1';

const isPresentString = (value) => typeof value === 'string' && value.trim().length > 0 && !hasEmojiOrControl(value);
const isAlphaSpace = (value) => isPresentString(value) && /^[\p{L}\s]+$/u.test(value.trim());
const isAlphaNumericSpace = (value) => isPresentString(value) && /^[\p{L}\d\s.,;:\-()¿?¡!"'/%&]+$/u.test(value.trim());
const isValidEmail = (value) => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const isValidPhone = (value) => typeof value === 'string' && /^[0-9+\s()-]{7,25}$/.test(value.trim());
const isValidDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());
const isValidTime = (value) => typeof value === 'string' && /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
const isHexColor = (value) => typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value.trim());
const isValidId = (value) => Number.isInteger(value) && value > 0;
const isValidEstado = (value) => ['activa', 'inactiva', 'pendiente'].includes(value);
const isValidTrimestre = (value) => ['I', 'II', 'III', 'IV', '1', '2', '3', '4'].includes(value);
const isValidDiaSemana = (value) => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].includes(value);

const validateDisciplina = ({ nombre, descripcion, color, icono }) => {
  if (!isAlphaSpace(nombre)) return 'El nombre de la disciplina es obligatorio y solo debe contener letras y espacios.';
  if (descripcion && !isAlphaNumericSpace(descripcion)) return 'La descripción de la disciplina contiene caracteres inválidos.';
  if (color && !isHexColor(color)) return 'El color de la disciplina debe ser un código hexadecimal válido.';
  if (icono && !/^[a-zA-Z0-9_\-]+$/.test(icono)) return 'El ícono de la disciplina contiene caracteres inválidos.';
  return null;
};

const validateSalon = ({ nombre, capacidad, equipamiento }) => {
  if (!isAlphaNumericSpace(nombre)) return 'El nombre del salón es obligatorio y no puede contener caracteres especiales.';
  if (!isValidId(parseInteger(capacidad))) return 'La capacidad del salón debe ser un número entero mayor a 0.';
  if (equipamiento && !isAlphaNumericSpace(equipamiento)) return 'El equipamiento del salón contiene caracteres inválidos.';
  return null;
};

const validateInstructor = ({ nombre, apellido, email, telefono, disciplina_id, tipo, fecha_ingreso }) => {
  if (!isAlphaSpace(nombre)) return 'El nombre del instructor es obligatorio y solo debe contener letras y espacios.';
  if (!isAlphaSpace(apellido)) return 'El apellido del instructor es obligatorio y solo debe contener letras y espacios.';
  if (email && !isValidEmail(email)) return 'El email del instructor no tiene un formato válido.';
  if (telefono && !isValidPhone(telefono)) return 'El teléfono del instructor no tiene un formato válido.';
  if (!isValidId(parseInteger(disciplina_id))) return 'La disciplina seleccionada no es válida.';
  if (!['contratado', 'voluntario'].includes(tipo)) return 'El tipo de instructor no es válido.';
  if (fecha_ingreso && !isValidDate(fecha_ingreso)) return 'La fecha de ingreso no es válida.';
  return null;
};

const validateTaller = ({ nombre, disciplina_id, instructor_id, salon_id, dia_semana, hora_inicio, hora_fin, cupo_maximo, trimestre }) => {
  if (!isAlphaNumericSpace(nombre)) return 'El nombre del taller es obligatorio y no puede contener caracteres especiales.';
  if (!isValidId(parseInteger(disciplina_id))) return 'La disciplina seleccionada no es válida.';
  if (!isValidId(parseInteger(instructor_id))) return 'El instructor seleccionado no es válido.';
  if (!isValidId(parseInteger(salon_id))) return 'El salón seleccionado no es válido.';
  if (!isValidDiaSemana(dia_semana)) return 'El día de la semana no es válido.';
  if (!isValidTime(hora_inicio) || !isValidTime(hora_fin)) return 'El horario debe ingresarse en formato HH:MM.';
  if (hora_inicio >= hora_fin) return 'La hora de inicio debe ser anterior a la hora de fin.';
  if (!isValidId(parseInteger(cupo_maximo))) return 'El cupo máximo debe ser un número entero mayor a 0.';
  if (trimestre && !isValidTrimestre(trimestre)) return 'El trimestre no es válido.';
  return null;
};

const validateParticipante = ({ nombre, apellido, cedula, email, telefono, fecha_nacimiento, barrio }) => {
  if (!isAlphaSpace(nombre)) return 'El nombre del participante es obligatorio y solo debe contener letras y espacios.';
  if (!isAlphaSpace(apellido)) return 'El apellido del participante es obligatorio y solo debe contener letras y espacios.';
  if (!isPresentString(cedula) || !/^[0-9\-]+$/.test(String(cedula).trim())) return 'La cédula es obligatoria y solo debe contener dígitos o guiones.';
  if (email && !isValidEmail(email)) return 'El email del participante no tiene un formato válido.';
  if (telefono && !isValidPhone(telefono)) return 'El teléfono del participante no tiene un formato válido.';
  if (fecha_nacimiento && !isValidDate(fecha_nacimiento)) return 'La fecha de nacimiento no es válida.';
  if (barrio && !isAlphaNumericSpace(barrio)) return 'El barrio contiene caracteres inválidos.';
  return null;
};

const validateInscripcion = ({ participanteId, tallerId, estado }) => {
  if (!isValidId(parseInteger(participanteId))) return 'El participante seleccionado no es válido.';
  if (!isValidId(parseInteger(tallerId))) return 'El taller seleccionado no es válido.';
  if (estado && !isValidEstado(estado)) return 'El estado de la inscripción no es válido.';
  return null;
};

const validateMaterial = ({ nombre, descripcion, cantidad_disponible, costo_unitario, unidad, categoria }) => {
  if (!isAlphaNumericSpace(nombre)) return 'El nombre del material es obligatorio y no puede contener caracteres especiales.';
  if (descripcion && !isAlphaNumericSpace(descripcion)) return 'La descripción del material contiene caracteres inválidos.';
  if (cantidad_disponible !== undefined && !isNonNegativeInteger(parseInteger(cantidad_disponible))) return 'La cantidad disponible debe ser un número entero mayor o igual a 0.';
  if (costo_unitario !== undefined && (Number.isNaN(parseFloatValue(costo_unitario)) || parseFloatValue(costo_unitario) < 0)) return 'El costo unitario no puede ser negativo.';
  if (unidad && !isAlphaNumericSpace(unidad)) return 'La unidad del material contiene caracteres inválidos.';
  if (categoria && !isAlphaNumericSpace(categoria)) return 'La categoría del material contiene caracteres inválidos.';
  return null;
};

const validateSesion = ({ tallerId, fecha, tema, observaciones }) => {
  if (!isValidId(parseInteger(tallerId))) return 'El taller seleccionado no es válido.';
  if (!isValidDate(fecha)) return 'La fecha de la sesión no es válida.';
  if (!isPresentString(tema)) return 'El tema de la sesión es obligatorio.';
  if (observaciones && !isAlphaNumericSpace(observaciones)) return 'Las observaciones contienen caracteres inválidos.';
  return null;
};

const validateAsistencia = ({ sesionId, participanteId, asistio, observacion }) => {
  if (!isValidId(parseInteger(sesionId))) return 'La sesión seleccionada no es válida.';
  if (!isValidId(parseInteger(participanteId))) return 'El participante seleccionado no es válido.';
  if (asistio !== undefined && typeof asistio !== 'boolean' && asistio !== 0 && asistio !== 1 && asistio !== 'true' && asistio !== 'false') return 'El valor de asistencia no es válido.';
  if (observacion && !isAlphaNumericSpace(observacion)) return 'La observación contiene caracteres inválidos.';
  return null;
};

const validateUsoMaterial = ({ materialId, tallerId, fecha, cantidadUsada, observaciones }) => {
  if (!isValidId(parseInteger(materialId))) return 'El material seleccionado no es válido.';
  if (!isValidId(parseInteger(tallerId))) return 'El taller seleccionado no es válido.';
  if (!isValidDate(fecha)) return 'La fecha de uso no es válida.';
  if (!isValidId(parseInteger(cantidadUsada))) return 'La cantidad usada debe ser un número entero mayor a 0.';
  if (observaciones && !isAlphaNumericSpace(observaciones)) return 'Las observaciones contienen caracteres inválidos.';
  return null;
};

// ==========================================
// AUTENTICACIÓN
// ==========================================
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!isValidUsername(username) || !isPresentString(password)) {
      return res.status(400).json({ error: 'Usuario y contraseña son obligatorios y deben tener formato válido.' });
    }

    const users = await query(
      'SELECT id, username, password, nombre, rol, activo, created_at AS createdAt FROM usuarios WHERE username = ? AND activo = 1',
      [username.trim()]
    );
    if (users.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const user = users[0];
    let validPassword = false;

    if (isPasswordHashed(user.password)) {
      validPassword = await comparePassword(password, user.password);
    } else {
      validPassword = password === user.password;
    }

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    if (!isPasswordHashed(user.password)) {
      const hashedPassword = await hashPassword(password);
      await query('UPDATE usuarios SET password = ? WHERE id = ?', [hashedPassword, user.id]);
      user.password = hashedPassword;
    }

    res.json(sanitizeUser(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// USUARIOS
// ==========================================
app.get('/api/usuarios', async (req, res) => {
  try {
    const users = await query('SELECT id, username, password, nombre, rol, activo, created_at AS createdAt FROM usuarios ORDER BY id');
    res.json(users.map(sanitizeUser));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/usuarios/:id', async (req, res) => {
  try {
    const users = await query('SELECT id, username, password, nombre, rol, activo, created_at AS createdAt FROM usuarios WHERE id = ?', [req.params.id]);
    if (users.length > 0) {
      res.json(sanitizeUser(users[0]));
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/usuarios', async (req, res) => {
  try {
    const username = (req.body.username || '').trim();
    const password = req.body.password || '';
    const nombre = (req.body.nombre || '').trim();
    const rol = req.body.rol || 'operador';
    const activo = req.body.activo;
    const validationError = validateUsuario({ username, password, nombre }, true);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    if (!['admin', 'operador'].includes(rol)) {
      return res.status(400).json({ error: 'Rol inválido.' });
    }
    const hashedPassword = await hashPassword(password);
    const result = await query(
      'INSERT INTO usuarios (username, password, nombre, rol, activo) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, nombre, rol, activo !== undefined ? activo : true]
    );
    const newUser = await query('SELECT id, username, password, nombre, rol, activo, created_at AS createdAt FROM usuarios WHERE id = ?', [result.insertId]);
    res.status(201).json(sanitizeUser(newUser[0]));
  } catch (err) {
    const duplicate = err.code === 'ER_DUP_ENTRY';
    res.status(duplicate ? 400 : 500).json({
      error: duplicate ? 'El nombre de usuario ya existe.' : err.message
    });
  }
});

app.put('/api/usuarios/:id', async (req, res) => {
  try {
    const users = await query('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const current = users[0];
    const username = (req.body.username ?? current.username).trim();
    const nombre = (req.body.nombre ?? current.nombre).trim();
    const rol = req.body.rol ?? current.rol;
    const activo = req.body.activo !== undefined ? req.body.activo : current.activo;
    const newPassword = req.body.password;
    const currentPassword = req.body.currentPassword;

    if (newPassword) {
      if (!isPresentString(currentPassword)) {
        return res.status(400).json({ error: 'La contraseña actual es obligatoria para cambiar la contraseña.' });
      }

      const validCurrent = isPasswordHashed(current.password)
        ? await comparePassword(currentPassword, current.password)
        : currentPassword === current.password;

      if (!validCurrent) {
        return res.status(400).json({ error: 'La contraseña actual es incorrecta.' });
      }
    }

    const validationError = validateUsuario(
      { username, password: newPassword || '', nombre },
      Boolean(newPassword)
    );
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    if (!['admin', 'operador'].includes(rol)) {
      return res.status(400).json({ error: 'Rol inválido.' });
    }
    let password = current.password;
    if (newPassword) {
      password = await hashPassword(newPassword);
    } else if (!isPasswordHashed(current.password)) {
      password = await hashPassword(current.password);
    }
    await query(
      'UPDATE usuarios SET username = ?, password = ?, nombre = ?, rol = ?, activo = ? WHERE id = ?',
      [username, password, nombre, rol, activo, req.params.id]
    );
    const updatedUser = await query('SELECT id, username, password, nombre, rol, activo, created_at AS createdAt FROM usuarios WHERE id = ?', [req.params.id]);
    res.json(sanitizeUser(updatedUser[0]));
  } catch (err) {
    const duplicate = err.code === 'ER_DUP_ENTRY';
    res.status(duplicate ? 400 : 500).json({
      error: duplicate ? 'El nombre de usuario ya existe.' : err.message
    });
  }
});

app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    await query('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Recovery endpoints removed per request

// ==========================================
// DISCIPLINAS
// ==========================================
app.get('/api/disciplinas', async (req, res) => {
  try {
    const disciplinas = await query('SELECT * FROM disciplinas ORDER BY id');
    res.json(disciplinas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/disciplinas', async (req, res) => {
  try {
    const { nombre, descripcion, color, icono } = req.body;
    const validationError = validateDisciplina({ nombre, descripcion, color, icono });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    const result = await query(
      'INSERT INTO disciplinas (nombre, descripcion, color, icono) VALUES (?, ?, ?, ?)',
      [nombre.trim(), descripcion ? descripcion.trim() : '', color || '#6c2bd9', icono || 'palette']
    );
    const newDisciplina = await query('SELECT * FROM disciplinas WHERE id = ?', [result.insertId]);
    res.status(201).json(newDisciplina[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/disciplinas/:id', async (req, res) => {
  try {
    const disciplinas = await query('SELECT * FROM disciplinas WHERE id = ?', [req.params.id]);
    if (disciplinas.length > 0) res.json(disciplinas[0]);
    else res.status(404).json({ error: 'Disciplina no encontrada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/disciplinas/:id', async (req, res) => {
  try {
    const { nombre, descripcion, color, icono } = req.body;
    const validationError = validateDisciplina({ nombre, descripcion, color, icono });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    await query(
      'UPDATE disciplinas SET nombre = ?, descripcion = ?, color = ?, icono = ? WHERE id = ?',
      [nombre.trim(), descripcion ? descripcion.trim() : '', color || '#6c2bd9', icono || 'palette', req.params.id]
    );
    const updated = await query('SELECT * FROM disciplinas WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/disciplinas/:id', async (req, res) => {
  try {
    await query('DELETE FROM disciplinas WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// SALONES
// ==========================================
app.get('/api/salones', async (req, res) => {
  try {
    const salones = await query('SELECT * FROM salones ORDER BY id');
    res.json(salones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/salones', async (req, res) => {
  try {
    const { nombre, capacidad, equipamiento, disponible } = req.body;
    const validationError = validateSalon({ nombre, capacidad, equipamiento });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    const result = await query(
      'INSERT INTO salones (nombre, capacidad, equipamiento, disponible) VALUES (?, ?, ?, ?)',
      [nombre.trim(), parseInteger(capacidad), equipamiento ? equipamiento.trim() : '', disponible !== undefined ? toBoolean(disponible) : true]
    );
    const newSalon = await query('SELECT * FROM salones WHERE id = ?', [result.insertId]);
    res.status(201).json(newSalon[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/salones/:id', async (req, res) => {
  try {
    const salones = await query('SELECT * FROM salones WHERE id = ?', [req.params.id]);
    if (salones.length > 0) res.json(salones[0]);
    else res.status(404).json({ error: 'Salón no encontrado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/salones/:id', async (req, res) => {
  try {
    const { nombre, capacidad, equipamiento, disponible } = req.body;
    const validationError = validateSalon({ nombre, capacidad, equipamiento });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    await query(
      'UPDATE salones SET nombre = ?, capacidad = ?, equipamiento = ?, disponible = ? WHERE id = ?',
      [nombre.trim(), parseInteger(capacidad), equipamiento ? equipamiento.trim() : '', toBoolean(disponible), req.params.id]
    );
    const updated = await query('SELECT * FROM salones WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/salones/:id', async (req, res) => {
  try {
    await query('DELETE FROM salones WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// INSTRUCTORES
// ==========================================
app.get('/api/instructores', async (req, res) => {
  try {
    const instructores = await query(`
      SELECT i.*, d.nombre as disciplina_nombre, d.color as disciplina_color
      FROM instructores i
      LEFT JOIN disciplinas d ON i.disciplina_id = d.id
      ORDER BY i.id
    `);
    res.json(instructores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/instructores', async (req, res) => {
  try {
    const { nombre, apellido, email, telefono, tipo, activo } = req.body;
    const disciplina_id = req.body.disciplina_id ?? req.body.disciplinaId;
    const fecha_ingreso = req.body.fecha_ingreso ?? req.body.fechaIngreso;
    const validationError = validateInstructor({ nombre, apellido, email, telefono, disciplina_id, tipo: tipo || 'voluntario', fecha_ingreso });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    const result = await query(
      'INSERT INTO instructores (nombre, apellido, email, telefono, disciplina_id, tipo, activo, fecha_ingreso) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [nombre.trim(), apellido.trim(), email ? email.trim() : '', telefono ? telefono.trim() : '', parseInteger(disciplina_id), tipo || 'voluntario', activo !== undefined ? toBoolean(activo) : true, fecha_ingreso || null]
    );
    const newInstructor = await query('SELECT * FROM instructores WHERE id = ?', [result.insertId]);
    res.status(201).json(newInstructor[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/instructores/:id', async (req, res) => {
  try {
    const instructors = await query('SELECT * FROM instructores WHERE id = ?', [req.params.id]);
    if (instructors.length > 0) res.json(instructors[0]);
    else res.status(404).json({ error: 'Instructor no encontrado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/instructores/:id', async (req, res) => {
  try {
    const { nombre, apellido, email, telefono, tipo, activo } = req.body;
    const disciplina_id = req.body.disciplina_id ?? req.body.disciplinaId;
    const fecha_ingreso = req.body.fecha_ingreso ?? req.body.fechaIngreso;
    const validationError = validateInstructor({ nombre, apellido, email, telefono, disciplina_id, tipo: tipo || 'voluntario', fecha_ingreso });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    await query(
      'UPDATE instructores SET nombre = ?, apellido = ?, email = ?, telefono = ?, disciplina_id = ?, tipo = ?, activo = ?, fecha_ingreso = ? WHERE id = ?',
      [nombre.trim(), apellido.trim(), email ? email.trim() : '', telefono ? telefono.trim() : '', parseInteger(disciplina_id), tipo || 'voluntario', toBoolean(activo), fecha_ingreso || null, req.params.id]
    );
    const updated = await query('SELECT * FROM instructores WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/instructores/:id', async (req, res) => {
  try {
    await query('DELETE FROM instructores WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// TALLERES
// ==========================================
app.get('/api/talleres', async (req, res) => {
  try {
    const talleres = await query(`
      SELECT t.*, d.nombre as disciplina_nombre, d.color as disciplina_color,
             i.nombre as instructor_nombre, i.apellido as instructor_apellido,
             s.nombre as salon_nombre
      FROM talleres t
      LEFT JOIN disciplinas d ON t.disciplina_id = d.id
      LEFT JOIN instructores i ON t.instructor_id = i.id
      LEFT JOIN salones s ON t.salon_id = s.id
      ORDER BY t.id
    `);
    res.json(talleres);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/talleres', async (req, res) => {
  try {
    const { nombre, horario, trimestre, activo } = req.body;
    const disciplina_id = req.body.disciplina_id ?? req.body.disciplinaId;
    const instructor_id = req.body.instructor_id ?? req.body.instructorId;
    const salon_id = req.body.salon_id ?? req.body.salonId;
    const dia_semana = req.body.dia_semana ?? req.body.diaSemana;
    const hora_inicio = req.body.hora_inicio ?? req.body.horaInicio;
    const hora_fin = req.body.hora_fin ?? req.body.horaFin;
    const cupo_maximo = req.body.cupo_maximo ?? req.body.cupoMaximo;

    const validationError = validateTaller({ nombre, disciplina_id, instructor_id, salon_id, dia_semana, hora_inicio, hora_fin, cupo_maximo, trimestre });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Verificar conflicto de horario
    const conflictos = await query(`
      SELECT id FROM talleres
      WHERE salon_id = ? AND dia_semana = ? AND activo = 1
      AND ((hora_inicio < ? AND hora_fin > ?) OR (hora_inicio < ? AND hora_fin > ?) OR (hora_inicio >= ? AND hora_fin <= ?))
    `, [salon_id, dia_semana, hora_fin, hora_inicio, hora_inicio, hora_fin, hora_inicio, hora_fin]);

    if (conflictos.length > 0) {
      return res.status(400).json({ error: 'El salón ya está ocupado en ese horario' });
    }

    const result = await query(
      'INSERT INTO talleres (nombre, disciplina_id, instructor_id, salon_id, horario, dia_semana, hora_inicio, hora_fin, cupo_maximo, cupo_actual, trimestre, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)',
      [nombre.trim(), parseInteger(disciplina_id), parseInteger(instructor_id), parseInteger(salon_id), horario ? horario.trim() : '', dia_semana, hora_inicio, hora_fin, parseInteger(cupo_maximo), trimestre, activo !== undefined ? toBoolean(activo) : true]
    );
    const newTaller = await query('SELECT * FROM talleres WHERE id = ?', [result.insertId]);
    res.status(201).json(newTaller[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/talleres/:id', async (req, res) => {
  try {
    const talleres = await query('SELECT * FROM talleres WHERE id = ?', [req.params.id]);
    if (talleres.length > 0) res.json(talleres[0]);
    else res.status(404).json({ error: 'Taller no encontrado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/talleres/:id', async (req, res) => {
  try {
    const { nombre, horario, trimestre, activo } = req.body;
    const disciplina_id = req.body.disciplina_id ?? req.body.disciplinaId;
    const instructor_id = req.body.instructor_id ?? req.body.instructorId;
    const salon_id = req.body.salon_id ?? req.body.salonId;
    const dia_semana = req.body.dia_semana ?? req.body.diaSemana;
    const hora_inicio = req.body.hora_inicio ?? req.body.horaInicio;
    const hora_fin = req.body.hora_fin ?? req.body.horaFin;
    const cupo_maximo = req.body.cupo_maximo ?? req.body.cupoMaximo;
    const cupo_actual = req.body.cupo_actual ?? req.body.cupoActual;

    const validationError = validateTaller({ nombre, disciplina_id, instructor_id, salon_id, dia_semana, hora_inicio, hora_fin, cupo_maximo, trimestre });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    await query(
      'UPDATE talleres SET nombre = ?, disciplina_id = ?, instructor_id = ?, salon_id = ?, horario = ?, dia_semana = ?, hora_inicio = ?, hora_fin = ?, cupo_maximo = ?, cupo_actual = ?, trimestre = ?, activo = ? WHERE id = ?',
      [nombre.trim(), parseInteger(disciplina_id), parseInteger(instructor_id), parseInteger(salon_id), horario ? horario.trim() : '', dia_semana, hora_inicio, hora_fin, parseInteger(cupo_maximo), parseInteger(cupo_actual), trimestre, toBoolean(activo), req.params.id]
    );
    const updated = await query('SELECT * FROM talleres WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/talleres/:id', async (req, res) => {
  try {
    await query('DELETE FROM talleres WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PARTICIPANTES
// ==========================================
app.get('/api/participantes', async (req, res) => {
  try {
    const participantes = await query('SELECT * FROM participantes ORDER BY id');
    res.json(participantes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/participantes', async (req, res) => {
  try {
    const { nombre, apellido, cedula, email, telefono, barrio, activo } = req.body;
    const fecha_nacimiento = req.body.fecha_nacimiento ?? req.body.fechaNacimiento;
    const validationError = validateParticipante({ nombre, apellido, cedula, email, telefono, fecha_nacimiento, barrio });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    const result = await query(
      'INSERT INTO participantes (nombre, apellido, cedula, email, telefono, fecha_nacimiento, barrio, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [nombre.trim(), apellido.trim(), cedula.trim(), email ? email.trim() : '', telefono ? telefono.trim() : '', fecha_nacimiento || null, barrio ? barrio.trim() : '', activo !== undefined ? toBoolean(activo) : true]
    );
    const newParticipante = await query('SELECT * FROM participantes WHERE id = ?', [result.insertId]);
    res.status(201).json(newParticipante[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/participantes/:id', async (req, res) => {
  try {
    const participantes = await query('SELECT * FROM participantes WHERE id = ?', [req.params.id]);
    if (participantes.length > 0) res.json(participantes[0]);
    else res.status(404).json({ error: 'Participante no encontrado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/participantes/:id', async (req, res) => {
  try {
    const { nombre, apellido, cedula, email, telefono, barrio, activo } = req.body;
    const fecha_nacimiento = req.body.fecha_nacimiento ?? req.body.fechaNacimiento;
    const validationError = validateParticipante({ nombre, apellido, cedula, email, telefono, fecha_nacimiento, barrio });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    await query(
      'UPDATE participantes SET nombre = ?, apellido = ?, cedula = ?, email = ?, telefono = ?, fecha_nacimiento = ?, barrio = ?, activo = ? WHERE id = ?',
      [nombre.trim(), apellido.trim(), cedula.trim(), email ? email.trim() : '', telefono ? telefono.trim() : '', fecha_nacimiento || null, barrio ? barrio.trim() : '', toBoolean(activo), req.params.id]
    );
    const updated = await query('SELECT * FROM participantes WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/participantes/:id', async (req, res) => {
  try {
    await query('DELETE FROM participantes WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// INSCRIPCIONES
// ==========================================
app.get('/api/inscripciones', async (req, res) => {
  try {
    const inscripciones = await query(`
      SELECT i.id,
             i.participante_id AS participanteId,
             i.taller_id AS tallerId,
             i.fecha_inscripcion AS fechaInscripcion,
             i.estado,
             p.nombre AS participante_nombre,
             p.apellido AS participante_apellido,
             p.cedula AS participante_cedula,
             p.email AS participante_email,
             p.telefono AS participante_telefono,
             p.fecha_nacimiento AS participante_fecha_nacimiento,
             TIMESTAMPDIFF(YEAR, p.fecha_nacimiento, CURDATE()) AS participante_edad,
             p.barrio AS participante_barrio,
             p.activo AS participante_activo,
             t.nombre AS taller_nombre,
             t.disciplina_id AS taller_disciplinaId,
             t.instructor_id AS taller_instructorId,
             t.salon_id AS taller_salonId,
             t.horario AS taller_horario,
             t.dia_semana AS taller_diaSemana,
             t.hora_inicio AS taller_horaInicio,
             t.hora_fin AS taller_horaFin,
             t.cupo_maximo AS taller_cupoMaximo,
             t.cupo_actual AS taller_cupoActual,
             t.trimestre AS taller_trimestre,
             t.activo AS taller_activo,
             d.nombre AS disciplina_nombre,
             d.color AS disciplina_color,
             d.descripcion AS disciplina_descripcion,
             d.icono AS disciplina_icono
      FROM inscripciones i
      LEFT JOIN participantes p ON i.participante_id = p.id
      LEFT JOIN talleres t ON i.taller_id = t.id
      LEFT JOIN disciplinas d ON t.disciplina_id = d.id
      ORDER BY i.id
    `);
    res.json(inscripciones.map(row => ({
      id: row.id,
      participanteId: row.participanteId,
      tallerId: row.tallerId,
      fechaInscripcion: row.fechaInscripcion,
      estado: row.estado,
      participante: {
        id: row.participanteId,
        nombre: row.participante_nombre,
        apellido: row.participante_apellido,
        cedula: row.participante_cedula,
        email: row.participante_email,
        telefono: row.participante_telefono,
        fechaNacimiento: row.participante_fecha_nacimiento,
        edad: row.participante_edad,
        barrio: row.participante_barrio,
        activo: Boolean(row.participante_activo)
      },
      taller: {
        id: row.tallerId,
        nombre: row.taller_nombre,
        disciplinaId: row.taller_disciplinaId,
        instructorId: row.taller_instructorId,
        salonId: row.taller_salonId,
        horario: row.taller_horario,
        diaSemana: row.taller_diaSemana,
        horaInicio: row.taller_horaInicio,
        horaFin: row.taller_horaFin,
        cupoMaximo: row.taller_cupoMaximo,
        cupoActual: row.taller_cupoActual,
        trimestre: row.taller_trimestre,
        activo: Boolean(row.taller_activo),
        disciplina: {
          id: row.taller_disciplinaId,
          nombre: row.disciplina_nombre,
          descripcion: row.disciplina_descripcion,
          color: row.disciplina_color,
          icono: row.disciplina_icono
        }
      }
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/inscripciones', async (req, res) => {
  try {
    const participanteId = req.body.participanteId ?? req.body.participante_id;
    const tallerId = req.body.tallerId ?? req.body.taller_id;
    const fechaInscripcion = req.body.fechaInscripcion ?? req.body.fecha_inscripcion ?? new Date().toISOString().split('T')[0];
    const estado = req.body.estado || 'activa';

    const validationError = validateInscripcion({ participanteId, tallerId, fechaInscripcion, estado });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const taller = await query('SELECT * FROM talleres WHERE id = ?', [tallerId]);
    if (taller.length === 0) {
      return res.status(404).json({ error: 'Taller no encontrado.' });
    }

    const participante = await query('SELECT id FROM participantes WHERE id = ? AND activo = 1', [participanteId]);
    if (participante.length === 0) {
      return res.status(404).json({ error: 'Participante no encontrado o inactivo.' });
    }

    const duplicada = await query(
      'SELECT id FROM inscripciones WHERE participante_id = ? AND taller_id = ? AND estado = "activa"',
      [participanteId, tallerId]
    );
    if (duplicada.length > 0) {
      return res.status(400).json({ error: 'El participante ya está inscrito en este taller.' });
    }

    const conflictos = await query(`
      SELECT t.nombre
      FROM inscripciones i
      JOIN talleres t ON t.id = i.taller_id
      WHERE i.participante_id = ?
        AND i.estado = 'activa'
        AND t.dia_semana = ?
        AND ((? < t.hora_fin AND ? > t.hora_inicio))
    `, [participanteId, taller[0].dia_semana, taller[0].hora_inicio, taller[0].hora_fin]);

    if (conflictos.length > 0) {
      return res.status(400).json({ error: `Conflicto de horario con el taller "${conflictos[0].nombre}".` });
    }

    const result = await query(
      'INSERT INTO inscripciones (participante_id, taller_id, fecha_inscripcion, estado) VALUES (?, ?, ?, ?)',
      [parseInteger(participanteId), parseInteger(tallerId), fechaInscripcion, estado]
    );
    const newInscripcion = await query(`
      SELECT id, participante_id AS participanteId, taller_id AS tallerId,
             fecha_inscripcion AS fechaInscripcion, estado
      FROM inscripciones WHERE id = ?
    `, [result.insertId]);
    res.status(201).json(newInscripcion[0]);
  } catch (err) {
    const duplicate = err.code === 'ER_DUP_ENTRY';
    res.status(duplicate ? 400 : 500).json({
      error: duplicate ? 'El participante ya tiene una inscripción registrada en este taller.' : err.message
    });
  }
});

app.put('/api/inscripciones/:id', async (req, res) => {
  try {
    const inscripciones = await query('SELECT * FROM inscripciones WHERE id = ?', [req.params.id]);
    if (inscripciones.length === 0) {
      return res.status(404).json({ error: 'Inscripción no encontrada.' });
    }

    const actual = inscripciones[0];
    const estado = req.body.estado ?? actual.estado;

    const validationError = validateInscripcion({ participanteId: actual.participante_id, tallerId: actual.taller_id, fechaInscripcion: actual.fecha_inscripcion, estado });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    await query('UPDATE inscripciones SET estado = ? WHERE id = ?', [estado, req.params.id]);

    if (actual.estado === 'activa' && estado !== 'activa') {
      await query('UPDATE talleres SET cupo_actual = cupo_actual - 1 WHERE id = ? AND cupo_actual > 0', [actual.taller_id]);
    } else if (actual.estado !== 'activa' && estado === 'activa') {
      await query('UPDATE talleres SET cupo_actual = cupo_actual + 1 WHERE id = ? AND cupo_actual < cupo_maximo', [actual.taller_id]);
    }

    const updated = await query(`
      SELECT id, participante_id AS participanteId, taller_id AS tallerId,
             fecha_inscripcion AS fechaInscripcion, estado
      FROM inscripciones WHERE id = ?
    `, [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/inscripciones/:id', async (req, res) => {
  try {
    const inscripciones = await query('SELECT * FROM inscripciones WHERE id = ?', [req.params.id]);
    if (inscripciones.length === 0) {
      return res.status(404).json({ error: 'Inscripción no encontrada.' });
    }
    await query('DELETE FROM inscripciones WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// MATERIALES
// ==========================================
app.get('/api/materiales', async (req, res) => {
  try {
    const materiales = await query('SELECT * FROM materiales ORDER BY id');
    res.json(materiales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/materiales', async (req, res) => {
  try {
    const { nombre, descripcion, unidad, categoria } = req.body;
    const cantidad_disponible = req.body.cantidad_disponible ?? req.body.cantidadDisponible;
    const costo_unitario = req.body.costo_unitario ?? req.body.costoUnitario;
    const validationError = validateMaterial({ nombre, descripcion, cantidad_disponible, costo_unitario, unidad, categoria });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    const result = await query(
      'INSERT INTO materiales (nombre, descripcion, cantidad_disponible, costo_unitario, unidad, categoria) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre.trim(), descripcion ? descripcion.trim() : '', parseInteger(cantidad_disponible), parseFloatValue(costo_unitario), unidad ? unidad.trim() : 'unidad', categoria ? categoria.trim() : 'general']
    );
    const newMaterial = await query('SELECT * FROM materiales WHERE id = ?', [result.insertId]);
    res.status(201).json(newMaterial[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/materiales/:id', async (req, res) => {
  try {
    const materiales = await query('SELECT * FROM materiales WHERE id = ?', [req.params.id]);
    if (materiales.length > 0) res.json(materiales[0]);
    else res.status(404).json({ error: 'Material no encontrado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/materiales/:id', async (req, res) => {
  try {
    const { nombre, descripcion, unidad, categoria } = req.body;
    const cantidad_disponible = req.body.cantidad_disponible ?? req.body.cantidadDisponible;
    const costo_unitario = req.body.costo_unitario ?? req.body.costoUnitario;
    const validationError = validateMaterial({ nombre, descripcion, cantidad_disponible, costo_unitario, unidad, categoria });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    await query(
      'UPDATE materiales SET nombre = ?, descripcion = ?, cantidad_disponible = ?, costo_unitario = ?, unidad = ?, categoria = ? WHERE id = ?',
      [nombre.trim(), descripcion ? descripcion.trim() : '', parseInteger(cantidad_disponible), parseFloatValue(costo_unitario), unidad ? unidad.trim() : 'unidad', categoria ? categoria.trim() : 'general', req.params.id]
    );
    const updated = await query('SELECT * FROM materiales WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/materiales/:id', async (req, res) => {
  try {
    await query('DELETE FROM materiales WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// SESIONES
// ==========================================
app.get('/api/sesiones', async (req, res) => {
  try {
    const sesiones = await query('SELECT * FROM sesiones_taller ORDER BY id');
    res.json(sesiones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sesiones', async (req, res) => {
  try {
    const tallerId = req.body.tallerId ?? req.body.taller_id;
    const { fecha, tema, observaciones } = req.body;
    const validationError = validateSesion({ tallerId, fecha, tema, observaciones });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    const result = await query(
      'INSERT INTO sesiones_taller (taller_id, fecha, tema, observaciones) VALUES (?, ?, ?, ?)',
      [parseInteger(tallerId), fecha, tema ? tema.trim() : '', observaciones ? observaciones.trim() : '']
    );
    const newSesion = await query('SELECT * FROM sesiones_taller WHERE id = ?', [result.insertId]);
    res.status(201).json(newSesion[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/sesiones/:id', async (req, res) => {
  try {
    const tallerId = req.body.tallerId ?? req.body.taller_id;
    const { fecha, tema, observaciones } = req.body;
    const validationError = validateSesion({ tallerId, fecha, tema, observaciones });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    await query(
      'UPDATE sesiones_taller SET taller_id = ?, fecha = ?, tema = ?, observaciones = ? WHERE id = ?',
      [parseInteger(tallerId), fecha, tema ? tema.trim() : '', observaciones ? observaciones.trim() : '', req.params.id]
    );
    const updated = await query('SELECT * FROM sesiones_taller WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sesiones/:id', async (req, res) => {
  try {
    await query('DELETE FROM sesiones_taller WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ASISTENCIAS
// ==========================================
app.get('/api/asistencias', async (req, res) => {
  try {
    const asistencias = await query('SELECT * FROM asistencias ORDER BY id');
    res.json(asistencias);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/asistencias', async (req, res) => {
  try {
    const sesionId = req.body.sesionId ?? req.body.sesion_id;
    const participanteId = req.body.participanteId ?? req.body.participante_id;
    const { asistio, observacion } = req.body;
    const validationError = validateAsistencia({ sesionId, participanteId, asistio, observacion });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    const result = await query(
      'INSERT INTO asistencias (sesion_id, participante_id, asistio, observacion) VALUES (?, ?, ?, ?)',
      [parseInteger(sesionId), parseInteger(participanteId), asistio !== undefined ? toBoolean(asistio) : true, observacion ? observacion.trim() : '']
    );
    const newAsistencia = await query('SELECT * FROM asistencias WHERE id = ?', [result.insertId]);
    res.status(201).json(newAsistencia[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/asistencias/:id', async (req, res) => {
  try {
    const sesionId = req.body.sesionId ?? req.body.sesion_id;
    const participanteId = req.body.participanteId ?? req.body.participante_id;
    const { asistio, observacion } = req.body;
    const validationError = validateAsistencia({ sesionId, participanteId, asistio, observacion });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    await query(
      'UPDATE asistencias SET sesion_id = ?, participante_id = ?, asistio = ?, observacion = ? WHERE id = ?',
      [parseInteger(sesionId), parseInteger(participanteId), toBoolean(asistio), observacion ? observacion.trim() : '', req.params.id]
    );
    const updated = await query('SELECT * FROM asistencias WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// USO DE MATERIALES
// ==========================================
app.get('/api/uso-materiales', async (req, res) => {
  try {
    const rows = await query(`
      SELECT u.*, 
             m.id AS material_id, m.nombre AS material_nombre, m.descripcion AS material_descripcion,
             m.cantidad_disponible AS material_cantidad_disponible, m.costo_unitario AS material_costo_unitario,
             m.unidad AS material_unidad, m.categoria AS material_categoria,
             t.id AS taller_id, t.nombre AS taller_nombre, t.horario AS taller_horario
      FROM uso_materiales u
      LEFT JOIN materiales m ON u.material_id = m.id
      LEFT JOIN talleres t ON u.taller_id = t.id
      ORDER BY u.id
    `);
    const usage = rows.map(row => ({
      id: row.id,
      materialId: row.material_id,
      tallerId: row.taller_id,
      fecha: row.fecha,
      cantidadUsada: row.cantidad_usada,
      observaciones: row.observaciones,
      material: {
        id: row.material_id,
        nombre: row.material_nombre,
        descripcion: row.material_descripcion,
        cantidadDisponible: row.material_cantidad_disponible,
        costoUnitario: row.material_costo_unitario,
        unidad: row.material_unidad,
        categoria: row.material_categoria
      },
      taller: {
        id: row.taller_id,
        nombre: row.taller_nombre,
        horario: row.taller_horario
      }
    }));
    res.json(usage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/uso-materiales', async (req, res) => {
  try {
    const materialId = req.body.materialId ?? req.body.material_id;
    const tallerId = req.body.tallerId ?? req.body.taller_id;
    const { fecha, cantidadUsada, observaciones } = req.body;
    const validationError = validateUsoMaterial({ materialId, tallerId, fecha, cantidadUsada, observaciones });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    const result = await query(
      'INSERT INTO uso_materiales (material_id, taller_id, fecha, cantidad_usada, observaciones) VALUES (?, ?, ?, ?, ?)',
      [parseInteger(materialId), parseInteger(tallerId), fecha, parseInteger(cantidadUsada), observaciones ? observaciones.trim() : '']
    );
    const newUso = await query('SELECT * FROM uso_materiales WHERE id = ?', [result.insertId]);
    res.status(201).json(newUso[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/uso-materiales/:id', async (req, res) => {
  try {
    const usos = await query('SELECT * FROM uso_materiales WHERE id = ?', [req.params.id]);
    if (usos.length === 0) {
      return res.status(404).json({ error: 'Uso de material no encontrado' });
    }
    const uso = usos[0];
    await query('UPDATE materiales SET cantidad_disponible = cantidad_disponible + ? WHERE id = ?', [uso.cantidad_usada, uso.material_id]);
    await query('DELETE FROM uso_materiales WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// REPORTES
// ==========================================
app.get('/api/reportes/participantes-taller', async (req, res) => {
  try {
    const report = await query(`
      SELECT t.id AS tallerId,
             t.nombre AS tallerNombre,
             d.nombre AS disciplinaNombre,
             CONCAT(i.nombre, ' ', i.apellido) AS instructorNombre,
             s.nombre AS salonNombre,
             t.horario,
             t.cupo_maximo AS cupoMaximo,
             COUNT(CASE WHEN ins.estado = 'activa' THEN 1 END) AS totalInscritos,
             (t.cupo_maximo - COUNT(CASE WHEN ins.estado = 'activa' THEN 1 END)) AS disponibilidad
      FROM talleres t
      LEFT JOIN disciplinas d ON d.id = t.disciplina_id
      LEFT JOIN instructores i ON i.id = t.instructor_id
      LEFT JOIN salones s ON s.id = t.salon_id
      LEFT JOIN inscripciones ins ON ins.taller_id = t.id AND ins.estado = 'activa'
      GROUP BY t.id
      ORDER BY totalInscritos DESC
    `);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reportes/disciplinas', async (req, res) => {
  try {
    const report = await query(`
      SELECT d.id AS disciplinaId,
             d.nombre AS disciplinaNombre,
             d.color,
             COUNT(DISTINCT t.id) AS totalTalleres,
             COUNT(DISTINCT t.instructor_id) AS totalInstructores,
             COUNT(DISTINCT CASE WHEN ins.estado = 'activa' THEN ins.participante_id END) AS totalParticipantes
      FROM disciplinas d
      LEFT JOIN talleres t ON t.disciplina_id = d.id
      LEFT JOIN inscripciones ins ON ins.taller_id = t.id
      GROUP BY d.id, d.nombre, d.color
      ORDER BY totalParticipantes DESC
    `);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reportes/join-completo', async (req, res) => {
  try {
    const report = await query(`
      SELECT p.nombre AS participante,
             p.cedula,
             p.barrio,
             t.nombre AS taller,
             d.nombre AS disciplina,
             CONCAT(i2.nombre, ' ', i2.apellido) AS instructor,
             t.horario,
             i.fecha_inscripcion AS fecha
      FROM inscripciones i
      JOIN participantes p ON p.id = i.participante_id
      JOIN talleres t ON t.id = i.taller_id
      JOIN disciplinas d ON d.id = t.disciplina_id
      JOIN instructores i2 ON i2.id = t.instructor_id
      ORDER BY i.fecha_inscripcion DESC
    `);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dashboard/estadisticas', async (req, res) => {
  try {
    const stats = await query(`
      SELECT
        (SELECT COUNT(*) FROM participantes WHERE activo = 1) AS totalParticipantes,
        (SELECT COUNT(*) FROM instructores WHERE activo = 1) AS totalInstructores,
        (SELECT COUNT(*) FROM talleres WHERE activo = 1) AS totalTalleres,
        (SELECT COUNT(*) FROM inscripciones WHERE estado = 'activa') AS totalInscritos,
        (SELECT COUNT(*) FROM talleres WHERE cupo_actual >= cupo_maximo AND activo = 1) AS talleresSinCupo,
        (SELECT COUNT(*) FROM materiales WHERE cantidad_disponible < 5) AS materialesEnStockBajo
    `);
    res.json(stats[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

