-- Configurar usuario root para acceso sin contraseña
-- Ejecuta esto en MySQL Workbench o terminal MySQL

-- Cambiar método de autenticación a mysql_native_password
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';

-- Otorgar permisos
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;

-- Refrescar privilegios
FLUSH PRIVILEGES;

-- Verificar configuración
SELECT user, plugin, authentication_string FROM mysql.user WHERE user='root';