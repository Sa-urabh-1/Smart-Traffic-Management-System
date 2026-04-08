const express = require('express');
const path = require('path');
const db = require('./db'); // ✅ IMPORT

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 🚦 TRAFFIC DATA
let trafficData = {
    vehicles: 0,
    signal: "RED"
};

// 🔐 LOGIN
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    const sql = "SELECT * FROM users WHERE username=? AND password=?";
    db.query(sql, [username, password], (err, result) => {
        if (err) {
            console.log(err);
            return res.json({ success: false });
        }

        if (result.length > 0) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: "❌ Invalid credentials" });
        }
    });
});

// 🆕 REGISTER
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;

    const check = "SELECT * FROM users WHERE username=?";
    db.query(check, [username], (err, result) => {
        if (result.length > 0) {
            return res.json({ success: false, message: "⚠️ User already exists" });
        }

        const insert = "INSERT INTO users (username, password) VALUES (?, ?)";
        db.query(insert, [username, password], err => {
            if (err) {
                console.log(err);
                return res.json({ success: false });
            }

            res.json({ success: true, message: "✅ Registered successfully" });
        });
    });
});

// 🚗 TRAFFIC
app.post('/api/add', (req, res) => {
    trafficData.vehicles++;
    res.json(trafficData);
});

// 🚀 START SERVER
app.listen(5500, () => {
    console.log("🚀 Server running at http://localhost:5500");
});