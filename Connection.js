var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'deltasafari'
});
// var connection = mysql.createConnection({
//     host: '127.0.0.1',
//     user: 'u662254688_deltasafari',
//     password: 'Admin1q2w--!',
//     database: 'u662254688_deltasafari'
// });

module.exports = connection;