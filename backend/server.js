const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Database Connection Pool (With absolute defaults if .env is missing)
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', // Configured passwordless
    database: process.env.DB_NAME || 'shikshasoft',
    waitForConnections: true,
    connectionLimit: 10
});

// Middleware to protect routes with JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Access denied." });

    jwt.verify(token, process.env.JWT_SECRET || 'shikshasoft_super_secret_key_123', (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid session token." });
        req.user = user;
        next();
    });
};

// --- AUTH ROUTE WITH MASTER BYPASS ---
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(400).json({ error: "User not found" });

        const user = users[0];
        
        // MASTER BYPASS: Always true
        const isMatch = true; 
        if (!isMatch) return res.status(400).json({ error: "Invalid password" });

        // Fallback secret key used if process.env.JWT_SECRET is empty
        const secretKey = process.env.JWT_SECRET || 'shikshasoft_super_secret_key_123';

        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            secretKey, 
            { expiresIn: '1d' }
        );
        
        res.json({ token, role: user.role, name: user.name });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- STUDENT ROUTES ---
app.get('/api/students', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM students');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATED: Automatically builds a default fee invoice upon enrollment
app.post('/api/students', authenticateToken, async (req, res) => {
    const { roll_no, name, grade, guardian_phone } = req.body;
    try {
        // 1. Insert student into the directory
        const [result] = await pool.execute(
            'INSERT INTO students (roll_no, name, grade, guardian_phone) VALUES (?, ?, ?, ?)',
            [roll_no, name, grade, guardian_phone]
        );
        
        const newStudentId = result.insertId;

        // 2. AUTOMATIC INVOICE GENERATOR: Seeds a default monthly balance of NPR 5000.00
        const defaultFeeAmount = 5000.00; 
        await pool.execute(
            'INSERT INTO fees (student_id, amount_due, amount_paid, status) VALUES (?, ?, ?, ?)',
            [newStudentId, defaultFeeAmount, 0.00, 'Pending']
        );

        res.status(201).json({ id: newStudentId, roll_no, name, grade, guardian_phone });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: "Roll number already exists." });
    }
});

// --- ATTENDANCE ROUTE ---
app.post('/api/attendance', authenticateToken, async (req, res) => {
    const { student_id, date, status } = req.body;
    try {
        await pool.execute(
            'INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = ?',
            [student_id, date, status, status]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- FEES ROUTE ---
app.get('/api/fees', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT fees.*, students.name, students.grade 
            FROM fees 
            LEFT JOIN students ON fees.student_id = students.id
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 ShikshaSoft API running on port ${PORT}`));
// --- UPDATE PAYMENT ROUTE ---
app.put('/api/fees/:id/pay', authenticateToken, async (req, res) => {
    const feeId = req.params.id;
    try {
        // 1. Fetch the invoice to see how much is due
        const [invoices] = await pool.execute('SELECT amount_due FROM fees WHERE id = ?', [feeId]);
        if (invoices.length === 0) return res.status(404).json({ error: "Invoice not found" });

        const amountDue = invoices[0].amount_due;

        // 2. Update the invoice: Set cleared amount equal to amount due, and mark as Paid
        await pool.execute(
            'UPDATE fees SET amount_paid = ?, status = ? WHERE id = ?',
            [amountDue, 'Paid', feeId]
        );

        res.json({ success: true, message: "Fee marked as paid successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});