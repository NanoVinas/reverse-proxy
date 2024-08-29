const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Configuración de la base de datos
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

// Configuración de la ruta donde se generará el archivo restrictions.json
const outputPath = path.join(__dirname, '../config/restrictions.json');

// Función para obtener los datos de la tabla y generar el archivo JSON
async function generateRestrictionsJson() {
    let connection;
    try {
        // Conectar a la base de datos
        connection = await mysql.createConnection(dbConfig);

        // Consultar la tabla que contiene los datos de los dominios
        const [rows] = await connection.execute('SELECT * FROM restrictions');

        // Crear el objeto JSON a partir de los datos obtenidos
        const restrictionsJson = {
            data: rows.map(row => ({
                ip: row.ip,
                url: row.url,
                code: row.code
            }))
        };

        // Escribir el archivo JSON en la ruta especificada
        fs.writeFileSync(outputPath, JSON.stringify(restrictionsJson, null, 2));

        console.log(`Archivo restrictions.json generado correctamente en: ${outputPath}`);
    } catch (error) {
        console.error('Error generando el archivo restrictions.json:', error.message);
    } finally {
        if (connection) {
            // Cerrar la conexión con la base de datos
            await connection.end();
        }
    }
}

// Ejecutar la función para generar el archivo restrictions.json
generateRestrictionsJson();