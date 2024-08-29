const express = require('express');
const fs = require('fs');
const { createProxyMiddleware } = require('http-proxy-middleware');
const https = require('https');
const tls = require('tls');
const { logEvent } = require('./lib/logger'); // Importar función de logging

// Cargar restricciones desde el archivo JSON
const restrictions = require('./config/restrictions.json');

// Cargar configuración de dominios
const domains = require('./config/domains.json');

// Crear una aplicación de Express
const app = express();

// Middleware para verificar las restricciones de acceso
app.use((req, res, next) => {
    const clientIp = req.ip.replace(/^::ffff:/, '');
    const requestUrl = req.path;
    const domain = req.hostname;
    // Buscar si hay alguna restricción que coincida con la IP y la URL
    for (let restriction of restrictions.data) {
        if (restriction.ip === clientIp && (restriction.url === '*' || restriction.url === requestUrl)) {
            // Log de acceso denegado
            logEvent('AccessDenied', restriction.code, {
                ip: clientIp,
                url: requestUrl,
                code: restriction.code,
                domain
            });

            return res.status(restriction.code).send();
        }
    }

    // Si no se encontró ninguna restricción, continuar con la siguiente capa de middleware
    next();
});

// Middleware para redirigir HTTP a HTTPS
app.use((req, res, next) => {
    const clientIp = req.ip.replace(/^::ffff:/, '');
    const domain = req.hostname;
    if (!req.secure) {
        logEvent('Redirect', `Redirigiendo HTTP a HTTPS`, { url: req.url, ip: clientIp, domain });
        return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
});

// Middleware para redirigir de "www" a la versión sin "www"
app.use((req, res, next) => {
    if (req.hostname.startsWith('www.')) {
        const clientIp = req.ip.replace(/^::ffff:/, '');
        const newHost = req.hostname.slice(4);  // Eliminar "www."
        logEvent('Redirect', `Redirigiendo de www a no-www`, { domain: req.hostname, newHost, id: clientIp });
        return res.redirect(301, `https://${newHost}${req.url}`);
    }
    next();
});

// Crear un objeto con las opciones SSL para cada dominio
const sslOptions = {};
const proxyOptions = {};

for (let domain of domains.data) {
    sslOptions[domain.name] = tls.createSecureContext({
        key: fs.readFileSync(domain.ssl.key),
        cert: fs.readFileSync(domain.ssl.cert),
        ca: domain.ssl.ca ? fs.readFileSync(domain.ssl.ca) : undefined,
    });

    // Almacenar las opciones de proxy para cada dominio
    proxyOptions[domain.name] = {
        target: domain.host,
        changeOrigin: true,
        logLevel: 'debug',
    };
}

// Registrar un único listener para manejar el proxy para todos los dominios
app.use((req, res, next) => {
    const domain = req.hostname;
    const clientIp = req.ip.replace(/^::ffff:/, '');
    // Verificar si hay opciones de proxy para el dominio
    if (proxyOptions[domain]) {
        const proxy = createProxyMiddleware(proxyOptions[domain]);

        // Log proxy request
        logEvent('ProxyRequest', `Proxying request`, { domain, url: req.url, ip: clientIp });

        proxy(req, res, (err) => {
            // Log proxy response or error
            if (err) {
                logEvent('ProxyError', `Error en proxy`, { domain, url: req.url, error: err.message, ip: clientIp });
            } else {
                logEvent('ProxySuccess', `Proxy request successful`, { domain, url: req.url, ip: clientIp });
            }
            // Eliminar los listeners después de manejar la solicitud
            proxy.removeAllListeners();
            next(err);
        });
    } else {
        next();
    }
});

// Crear el servidor HTTPS utilizando SNI para elegir el certificado correcto
const server = https.createServer({
    SNICallback: (servername, cb) => {
        const ctx = sslOptions[servername];
        if (ctx) {
            cb(null, ctx);
        } else {
            cb(new Error(`No SSL context found for ${servername}`));
        }
    }
}, app);

// Iniciar el servidor HTTPS
server.listen(443, () => {
    console.log('Servidor HTTPS está corriendo en el puerto 443');
    logEvent('ServerStart', `Servidor HTTPS iniciado`, { port: 443 });
});

// Servidor HTTP para redirigir a HTTPS
app.listen(80, () => {
    console.log('Servidor HTTP está redirigiendo al puerto 443');
    logEvent('ServerStart', `Servidor HTTP iniciado`, { port: 80 });
});

