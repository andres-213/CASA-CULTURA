const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'casa_cultura',
  charset: 'utf8mb4'
});

db.connect((err) => {
  if (err) {
    console.error('❌ Error conectando a MySQL:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado a MySQL');

  db.query(
    'UPDATE usuarios SET password = ? WHERE username = ?',
    ['admin123@', 'admin'],
    (err, results) => {
      if (err) {
        console.error('❌ Error al actualizar:', err.message);
        db.end();
        process.exit(1);
      }
      console.log('✅ Contraseña actualizada:', results.affectedRows, 'fila(s) modificada(s)');

      // Verificar el cambio
      db.query(
        'SELECT username, password FROM usuarios WHERE username = ?',
        ['admin'],
        (err, rows) => {
          if (err) {
            console.error('❌ Error al verificar:', err.message);
          } else {
            console.log('✅ Datos verificados:', rows);
          }
          db.end();
          process.exit(0);
        }
      );
    }
  );
});
