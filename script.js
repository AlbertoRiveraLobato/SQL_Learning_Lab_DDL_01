
let db;

initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}` })
    .then(SQL => {
        db = new SQL.Database();
        document.getElementById("output").innerText = "Base de datos SQLite creada en memoria.";
    });

function createTable() {
    const sql = `CREATE TABLE IF NOT EXISTS alumnos (id INTEGER PRIMARY KEY, nombre TEXT, curso TEXT);`;
    db.run(sql);
    document.getElementById("output").innerText = "Tabla 'alumnos' creada.";
}

function insertData() {
    const sql = `INSERT INTO alumnos (nombre, curso) VALUES ('Ana', 'SQL'), ('Luis', 'SQL');`;
    db.run(sql);
    document.getElementById("output").innerText = "Datos insertados en la tabla 'alumnos'.";
}

function runQuery() {
    const input = document.getElementById("sql-input").value;
    try {
        const result = db.exec(input);
        if (result.length === 0) {
            document.getElementById("output").innerText = "Consulta ejecutada sin resultados.";
            return;
        }
        let html = "<table><tr>" + result[0].columns.map(col => `<th>${col}</th>`).join("") + "</tr>";
        result[0].values.forEach(row => {
            html += "<tr>" + row.map(val => `<td>${val}</td>`).join("") + "</tr>";
        });
        html += "</table>";
        document.getElementById("output").innerHTML = html;
    } catch (e) {
        document.getElementById("output").innerText = "Error: " + e.message;
    }
}
