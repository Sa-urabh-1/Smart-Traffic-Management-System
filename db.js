const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '2025srishti',   // or your password
    database: 'trafficai'
});

db.connect(err => {
    if (err) {
        console.log("❌ MySQL Connection Error:", err);
    } else {
        console.log("✅ MySQL Connected");
    }
});

module.exports = db;