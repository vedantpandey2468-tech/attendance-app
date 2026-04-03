const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(__dirname));

// Database
const db = new sqlite3.Database("attendance.db");

// Create tables
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS employees (id INTEGER PRIMARY KEY, name TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS attendance (id INTEGER PRIMARY KEY, employee_id INTEGER, status TEXT, date TEXT)");
});

// Get employees
app.get("/employees", (req, res) => {
  db.all("SELECT * FROM employees", [], (err, rows) => {
    res.json(rows);
  });
});

// Add employee
app.post("/add-employee", (req, res) => {
  const { name } = req.body;
  db.run("INSERT INTO employees (name) VALUES (?)", [name]);
  res.sendStatus(200);
});

// Mark attendance
app.post("/mark", (req, res) => {
  const { employee_id, status } = req.body;
  const date = new Date().toISOString().slice(0, 10);

  db.run(
    "INSERT INTO attendance (employee_id, status, date) VALUES (?, ?, ?)",
    [employee_id, status, date]
  );

  res.sendStatus(200);
});

// Monthly report
app.get("/report/:month", (req, res) => {
  const month = req.params.month;

  db.all(
    `SELECT a.date, e.name, a.status 
     FROM attendance a 
     JOIN employees e ON a.employee_id = e.id 
     WHERE a.date LIKE ?`,
    [month + "%"],
    (err, rows) => {
      res.json(rows);
    }
  );
});

// Homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Delete employee
app.delete("/delete-employee/:id", (req, res) => {
  const id = req.params.id;

  db.run("DELETE FROM attendance WHERE employee_id = ?", [id]);
  db.run("DELETE FROM employees WHERE id = ?", [id]);

  res.sendStatus(200);
});
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
