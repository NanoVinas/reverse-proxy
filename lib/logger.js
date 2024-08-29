const db = require('./db');

// Función para registrar eventos
function logEvent(eventType, message, details) {
    const query = 'INSERT INTO logs (event_type, ip, domain, url, message, details, timestamp) VALUES (?, ?, ?, ?, ?, ?, NOW())';
    const values = [eventType, details.ip, details.domain, details.url, message, JSON.stringify(details)];

    db.query(query, values, (err, results) => {
        if (err) {
            console.error('Error al registrar evento: ', err);
        } else {
            //console.log('Evento registrado con ID: ', results.insertId);
        }
    });
}

module.exports = { logEvent };