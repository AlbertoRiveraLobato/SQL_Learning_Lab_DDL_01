
let db;
let predefinedQueries = {
    create: "CREATE TABLE IF NOT EXISTS alumnos (id INTEGER PRIMARY KEY, nombre TEXT, curso TEXT);",
    insert: "INSERT INTO alumnos (nombre, curso) VALUES ('Ana', 'SQL'), ('Luis', 'SQL');"
};

initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}` })
    .then(SQL => {
        db = new SQL.Database();
        document.getElementById("output").innerText = "Base de datos SQLite creada en memoria.";
        loadCustomButtons();
    });

function loadQuery(type) {
    if (predefinedQueries[type]) {
        document.getElementById("sql-input").value = predefinedQueries[type];
    }
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

function saveQuery() {
    const query = document.getElementById("sql-input").value;
    const name = prompt("Nombre para el nuevo botón:");
    if (!name || !query) return;

    const saved = JSON.parse(localStorage.getItem("customQueries") || "{}");
    saved[name] = query;
    localStorage.setItem("customQueries", JSON.stringify(saved));
    addCustomButton(name, query);
}

function loadCustomButtons() {
    const saved = JSON.parse(localStorage.getItem("customQueries") || "{}");
    for (const name in saved) {
        addCustomButton(name, saved[name]);
    }
}

function addCustomButton(name, query) {
    const btn = document.createElement("button");
    btn.textContent = name;
    btn.onclick = () => {
        document.getElementById("sql-input").value = query;
    };
    document.getElementById("custom-buttons").appendChild(btn);
}
