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

// Configuración de la ruta donde se generará el archivo domains.json
const outputPath = path.join(__dirname, '../config/domains.json');

// Función para obtener los datos de la tabla y generar el archivo JSON
async function generateDomainsJson() {
    let connection;
    try {
        // Conectar a la base de datos
        connection = await mysql.createConnection(dbConfig);

        // Consultar la tabla que contiene los datos de los dominios
        const [rows] = await connection.execute('SELECT domains.name, domains.host, certificates.key, certificates.cert, certificates.ca FROM domains LEFT JOIN certificates on domains.certificate=certificates.name');

        // Crear el objeto JSON a partir de los datos obtenidos
        const domainsJson = {
            data: rows.map(row => ({
                name: row.name,
                host: row.host,
                ssl: {
                    key: row.key,
                    cert: row.cert,
                    ca: row.ca
                }
            }))
        };

        // Escribir el archivo JSON en la ruta especificada
        fs.writeFileSync(outputPath, JSON.stringify(domainsJson, null, 2));

        console.log(`Archivo domains.json generado correctamente en: ${outputPath}`);
    } catch (error) {
        console.error('Error generando el archivo domains.json:', error.message);
    } finally {
        if (connection) {
            // Cerrar la conexión con la base de datos
            await connection.end();
        }
    }
}

// Ejecutar la función para generar el archivo domains.json
generateDomainsJson();
