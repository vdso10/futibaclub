const mysql = require('mysql2/promise')


module.exports = mysql.createConnection({
    host: 'localhost',
    user: 'user',
    password: 'senha',
    database: 'futiba-club'
})