// v2.2: corregido error al importar base de datos y limpiando resultados en cada consulta

let db;
let predefinedQueries = {
    create_table: "CREATE TABLE IF NOT EXISTS alumnos (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  nombre TEXT NOT NULL,\n  edad INTEGER,\n  curso TEXT\n);",
    insert_data: "INSERT INTO alumnos (nombre, edad, curso) VALUES\n('Ana García', 20, 'Bases de Datos'),\n('Luis Martínez', 22, 'Programación'),\n('Marta Rodríguez', 21, 'Bases de Datos'),\n('Carlos Sánchez', 19, 'Programación');",
    select_data: "SELECT * FROM alumnos;",
    update_data: "UPDATE alumnos SET edad = 23 WHERE nombre = 'Luis Martínez';",
    join_tables: "CREATE TABLE IF NOT EXISTS cursos (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  nombre TEXT NOT NULL,\n  profesor TEXT\n);\n\nINSERT INTO cursos (nombre, profesor) VALUES\n('Bases de Datos', 'Dr. Pérez'),\n('Programación', 'Dra. Gómez');\n\nSELECT a.nombre, a.edad, c.nombre as curso, c.profesor\nFROM alumnos a\nJOIN cursos c ON a.curso = c.nombre;"
};

// Inicializa la aplicación
document.addEventListener('DOMContentLoaded', function() {
    initApplication();
});

// Inicializa SQL.js y carga la base de datos
async function initApplication() {
    try {
        // Cargar SQL.js
        const SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}`
        });
        
        // Intentar cargar la base de datos desde localStorage
        const dbData = localStorage.getItem('sqlPlaygroundDB');
        
        if (dbData) {
            const data = new Uint8Array(JSON.parse(dbData));
            db = new SQL.Database(data);
            showMessage("Base de datos cargada correctamente desde tu almacenamiento local.", "success");
        } else {
            db = new SQL.Database();
            // Crear una tabla por defecto
            db.run("CREATE TABLE IF NOT EXISTS alumnos (id INTEGER PRIMARY KEY, nombre TEXT, curso TEXT);");
            db.run("INSERT INTO alumnos (nombre, curso) VALUES ('Ana', 'SQL'), ('Luis', 'SQL');");
            saveDB();
            showMessage("Nueva base de datos SQLite creada en memoria.", "success");
        }
        
        loadCustomButtons();
        showSchema();
        
    } catch (e) {
        showMessage("Error al inicializar la base de datos: " + e.message, "error");
        console.error(e);
    }
}

// Guarda la base de datos en localStorage
function saveDB() {
    if (!db) return;
    
    try {
        const data = db.export();
        const arrayData = Array.from(data);
        localStorage.setItem('sqlPlaygroundDB', JSON.stringify(arrayData));
    } catch (e) {
        console.error("Error al guardar la base de datos:", e);
    }
}

// Carga una consulta de ejemplo en el editor
function loadExample(type) {
    if (predefinedQueries[type]) {
        document.getElementById('sql-input').value = predefinedQueries[type];
        showMessage("Ejemplo cargado. ¡Ahora puedes ejecutarlo o modificarlo!", "info");
    }
}

// CORRECCIÓN: Ejecuta la consulta SQL (limpiando resultados previos)
function runQuery() {
    const input = document.getElementById('sql-input').value.trim();
    if (!input) {
        showMessage("Por favor, escribe una consulta SQL antes de ejecutar.", "error");
        return;
    }
    
    // LIMPIAR RESULTADOS PREVIOS ANTES DE EJECUTAR
    document.getElementById('output').innerHTML = '';
    
    try {
        // Ejecutar la consulta
        const result = db.exec(input);
        
        // Mostrar resultados
        if (result.length === 0) {
            showMessage("Consulta ejecutada correctamente. No se devolvieron resultados.", "success");
        } else {
            let html = "<table><tr>" + 
                result[0].columns.map(col => `<th>${col}</th>`).join("") + 
                "</tr>";
            
            result[0].values.forEach(row => {
                html += "<tr>" + 
                    row.map(val => `<td>${val}</td>`).join("") + 
                    "</tr>";
            });
            
            html += "</table>";
            document.getElementById('output').innerHTML = html;
            showMessage(`Consulta ejecutada correctamente. Se devolvieron ${result[0].values.length} filas.`, "success");
        }
        
        // Actualizar el esquema y guardar la base de datos
        showSchema();
        saveDB();
        
    } catch (e) {
        showMessage("Error en la consulta: " + e.message, "error");
        console.error(e);
    }
}

// Guarda la consulta actual como un botón personalizado
function saveQuery() {
    const query = document.getElementById('sql-input').value.trim();
    if (!query) {
        showMessage("No hay ninguna consulta para guardar.", "error");
        return;
    }
    
    const name = prompt("Nombre para la nueva consulta:");
    if (!name) return;
    
    const saved = JSON.parse(localStorage.getItem('customQueries') || "{}");
    saved[name] = query;
    localStorage.setItem('customQueries', JSON.stringify(saved));
    
    addCustomButton(name, query);
    showMessage(`Consulta guardada como "${name}".`, "success");
}

// Carga los botones personalizados desde localStorage
function loadCustomButtons() {
    const saved = JSON.parse(localStorage.getItem('customQueries') || "{}");
    for (const name in saved) {
        addCustomButton(name, saved[name]);
    }
}

// Añade un botón personalizado a la interfaz
function addCustomButton(name, query) {
    const container = document.getElementById('custom-buttons');
    
    // Comprobar si el botón ya existe
    const existingBtn = document.getElementById(`btn-${name.replace(/\s+/g, '-')}`);
    if (existingBtn) {
        existingBtn.remove();
    }
    
    const btnDiv = document.createElement('div');
    btnDiv.className = 'custom-btn';
    btnDiv.id = `btn-${name.replace(/\s+/g, '-')}`;
    
    const btnText = document.createElement('span');
    btnText.textContent = name;
    btnText.onclick = () => {
        document.getElementById('sql-input').value = query;
        showMessage(`Consulta "${name}" cargada en el editor.`, "info");
    };
    
    const btnActions = document.createElement('div');
    btnActions.className = 'custom-btn-actions';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger btn-sm';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteQuery(name);
    };
    
    btnActions.appendChild(deleteBtn);
    btnDiv.appendChild(btnText);
    btnDiv.appendChild(btnActions);
    container.appendChild(btnDiv);
}

// Elimina una consulta guardada
function deleteQuery(name) {
    if (!confirm(`¿Estás seguro de que quieres eliminar la consulta "${name}"?`)) return;
    
    const saved = JSON.parse(localStorage.getItem('customQueries') || "{}");
    delete saved[name];
    localStorage.setItem('customQueries', JSON.stringify(saved));
    
    const btn = document.getElementById(`btn-${name.replace(/\s+/g, '-')}`);
    if (btn) btn.remove();
    
    showMessage(`Consulta "${name}" eliminada.`, "success");
}

// Muestra un mensaje al usuario
function showMessage(text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = text;
    
    document.getElementById('message-output').appendChild(messageDiv);
    // Hacer scroll al último mensaje
    messageDiv.scrollIntoView({ behavior: 'smooth' });
    
    // Limpiar mensajes después de un tiempo (mantener solo los 5 más recientes)
    setTimeout(() => {
        if (document.getElementById('message-output').children.length > 5) {
            document.getElementById('message-output').removeChild(
                document.getElementById('message-output').firstChild
            );
        }
    }, 5000);
}

// Muestra el esquema de la base de datos
function showSchema() {
    try {
        const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table';");
        let html = "";
        
        if (tables.length && tables[0].values.length) {
            html += "<h3>Tablas en la base de datos:</h3>";
            
            tables[0].values.forEach(table => {
                const tableName = table[0];
                const schema = db.exec(`SELECT sql FROM sqlite_master WHERE name='${tableName}';`);
                
                html += `<div class='schema-table'><h4>Tabla: ${tableName}</h4>`;
                html += `<pre>${schema[0].values[0][0]}</pre></div>`;
            });
        } else {
            html = "<p>No hay tablas en la base de datos.</p>";
        }
        
        document.getElementById('schema-output').innerHTML = html;
    } catch (e) {
        console.error("Error al mostrar el esquema:", e);
        document.getElementById('schema-output').innerHTML = "<p>Error al cargar el esquema.</p>";
    }
}

// Cambia entre pestañas
function switchTab(tabName) {
    // Ocultar todas las pestañas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Mostrar la pestaña seleccionada
    document.getElementById(tabName).classList.add('active');
    
    // Actualizar pestañas activas
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Encontrar y activar la pestaña correspondiente
    const tabs = document.querySelectorAll('.tab');
    for (let i = 0; i < tabs.length; i++) {
        if (tabs[i].textContent.toLowerCase().includes(tabName.toLowerCase())) {
            tabs[i].classList.add('active');
            break;
        }
    }
    
    // Si es la pestaña de esquema, actualizarla
    if (tabName === 'schema') {
        showSchema();
    }
}

// Limpia el editor
function clearEditor() {
    if (confirm("¿Estás seguro de que quieres limpiar el editor?")) {
        document.getElementById('sql-input').value = '';
    }
}

// Formatea el SQL (simplemente una indentación básica)
function formatSQL() {
    const input = document.getElementById('sql-input');
    let sql = input.value;
    
    // Reemplazar palabras clave para añadir saltos de línea
    sql = sql.replace(/(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|GROUP BY|ORDER BY|HAVING|INSERT INTO|UPDATE|DELETE FROM|CREATE TABLE|ALTER TABLE|DROP TABLE|VALUES|SET)/gi, '\n$1');
    
    // Añadir indentación después de comas en SELECT
    sql = sql.replace(/,\s*/g, ',\n  ');
    
    input.value = sql.trim();
    showMessage("SQL formateado. Revisa que el formato sea correcto.", "info");
}

// Exporta la base de datos
function exportDB() {
    if (!db) {
        showMessage("No hay base de datos para exportar.", "error");
        return;
    }
    
    try {
        const data = db.export();
        const blob = new Blob([data], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sql_playground_db.sqlite';
        a.click();
        
        URL.revokeObjectURL(url);
        showMessage("Base de datos exportada correctamente.", "success");
    } catch (e) {
        showMessage("Error al exportar la base de datos: " + e.message, "error");
    }
}

// Importa una base de datos
function importDB() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.sqlite';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function() {
            try {
                const arrayBuffer = reader.result;
                const data = new Uint8Array(arrayBuffer);
                
                // Cerrar la base de datos actual si existe
                if (db) db.close();
                
                // Crear una nueva base de datos con los datos importados
                initSqlJs({
                    locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}`
                }).then(SQL => {
                    db = new SQL.Database(data);
                    saveDB();
                    // Limpiar resultados al importar nueva base
                    clearResults();
                    showMessage("Base de datos importada correctamente.", "success");
                    showSchema();
                });
            } catch (e) {
                showMessage("Error al importar la base de datos: " + e.message, "error");
            }
        };
        
        reader.readAsArrayBuffer(file);
    };
    
    input.click();
}

// CORRECCIÓN: Reinicia la base de datos (limpiando la interfaz)
function resetDB() {
    if (confirm("¿Estás seguro de que quieres reiniciar la base de datos? Se perderán todos los datos.")) {
        localStorage.removeItem('sqlPlaygroundDB');
        
        initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}`
        }).then(SQL => {
            db = new SQL.Database();
            // Crear una tabla por defecto
            db.run("CREATE TABLE IF NOT EXISTS alumnos (id INTEGER PRIMARY KEY, nombre TEXT, curso TEXT);");
            db.run("INSERT INTO alumnos (nombre, curso) VALUES ('Ana', 'SQL'), ('Luis', 'SQL');");
            saveDB();
            
            // LIMPIAR LA INTERFAZ COMPLETAMENTE
            clearResults();
            
            showMessage("Base de datos reiniciada correctamente.", "success");
            showSchema();
        });
    }
}

// NUEVA FUNCIÓN: Limpia todos los resultados y mensajes
function clearResults() {
    document.getElementById('output').innerHTML = '<p class="message info">Ejecuta una consulta para ver los resultados aquí.</p>';
    document.getElementById('message-output').innerHTML = '<p class="message info">Los mensajes de tus consultas aparecerán aquí.</p>';
    document.getElementById('schema-output').innerHTML = '<p class="message info">El esquema de tu base de datos aparecerá aquí.</p>';
}