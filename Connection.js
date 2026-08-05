var mysql = require('mysql');

// var connection = mysql.createPool({
//     connectionLimit: 10, // Adjust based on your workload
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'deltasafari'
// });

var connection = mysql.createPool({
    connectionLimit: 10,
    host: '127.0.0.1',
    user: 'u662254688_deltasafari',
    password: 'Admin1q2w--!',
    database: 'u662254688_deltasafari'
});

// Handle errors on pooled connections so ECONNRESET doesn't crash Node.js
connection.on('connection', function (conn) {
    conn.on('error', function (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
            // Socket was closed by MySQL server or network drop
            conn.destroy();
        }
    });
});

module.exports = connection;