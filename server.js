const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = new sqlite3.Database("./attendance.db");

db.run(`
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE
)
`);

db.run(`
CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER,
  date TEXT,
  status TEXT
)
`);

app.post("/add-employee", (req, res) => {
  const { name } = req.body;
  db.run("INSERT INTO employees (name) VALUES (?)", [name], function(err) {
    if (err) return res.status(500).send("Employee exists or error");
    res.send({ message: "Employee added" });
  });
});

app.get("/employees", (req, res) => {
  db.all("SELECT * FROM employees", [], (err, rows) => {
    res.send(rows);
  });
});

app.post("/mark", (req, res) => {
  const { employee_id, status } = req.body;
  const date = new Date().toISOString().split("T")[0];

  db.get(
    "SELECT * FROM attendance WHERE employee_id=? AND date=?",
    [employee_id, date],
    (err, row) => {
      if (row) return res.send({ message: "Already marked today" });

      db.run(
        "INSERT INTO attendance (employee_id, date, status) VALUES (?, ?, ?)",
        [employee_id, date, status],
        function(err) {
          if (err) return res.status(500).send(err);
          res.send({ message: "Attendance recorded" });
        }
      );
    }
  );
});

app.get("/report/:month", (req, res) => {
  const month = req.params.month;

  db.all(`
    SELECT e.name, a.date, a.status
    FROM attendance a
    JOIN employees e ON e.id = a.employee_id
    WHERE a.date LIKE '${month}%'
    ORDER BY a.date DESC
  `, [], (err, rows) => {
    res.send(rows);
  });
});

app.listen(3000, () => console.log("Server running on port 3000"));