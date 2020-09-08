// import library
var Client = require('mysql2')

// membuat objek koneksi
var conn = Client.createConnection({
    host : 'localhost',
    user : 'root',
    password : '',
    database : 'db_tugas56'
})

// const sql = `
//     CREATE TABLE users (
//         id INT(4) NOT NULL PRIMARY KEY,
//         name VARCHAR(30),
//         email VARCHAR(25),
//         password VARCHAR(20),
//         role VARCHAR(20)
//     )
// `;
const sql = `
    CREATE TABLE products (
        id INT(4) NOT NULL PRIMARY KEY,
        name VARCHAR(30),
        desc VARCHAR(250),
        ingredients VARCHAR(100),
        price VARCHAR(250),
        type VARCHAR(20)
    )
`;
// mengirim perintah SQL
conn.query(sql,function (error, result) {

    if (error) {
        console.log('Tabel gagal dibuat')
        throw error;
    }

    console.log('Tabel berhasil dibuat');



})


conn.end();// memutus koneksi
