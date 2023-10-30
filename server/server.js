const mysql = require('mysql2');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.use(express.static('public'));

// Создание пула соединений с базой данных MySQL
const pool = mysql.createPool({
    connectionLimit: 3,
    host: 'localhost',
    user: 'root',
    database: 'morbidity',
    password: 'root'
});

// Обработчик ошибок
function handleError(res, error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
}

// Запрос на получение месяцев
app.get('/months', (req, res) => {
    pool.getConnection((err, connection) => {
        if (err) {
            handleError(res, err);
            return;
        }

        // console.log('connected as id ' + connection.threadId);
        const select = `SELECT distinct MONTHNAME(STR_TO_DATE(date, '%Y%m%d')) AS month_name FROM morbidity.statistics`;
        
        //  Запрос на установление языка для текущего соединения
        connection.query("SET lc_time_names = 'ru_RU'", (err) => {
            if (err) {
                handleError(res, err);
                return;
            }
            //  Выполнение запроса на получение месяцев
            connection.query(select, (err, rows) => {
                connection.release(); // вернуть соединение в пул
                if (err) {
                    handleError(res, err);
                } else {
                    res.send(rows);
                }
            });
        });
    });
});

// Запрос на получение федеральных округов
app.get('/fo', (req, res) => {
    pool.getConnection((err, connection) => {
        if (err) {
            handleError(res, err);
            return;
        }

        // console.log('connected as id ' + connection.threadId);
        const select = `Select name From territory Where parent_id = 1`;
        // Выполнение запроса на получение федеральных округов 
        connection.query(select, (err, rows) => {
            connection.release(); // вернуть соединение в пул
            if (err) {
                handleError(res, err);
            } else {
                res.send(rows);
            }
        });
    });
});

// Запрос на получение данных по параметрам
app.post('/', (req, res) => {
    const { month, fo } = req.body;

    const select = `
        SELECT territory.name AS territory, hospital.name as hospital, disease.name as disease,
        statistics.patients, statistics.issued, (statistics.issued - statistics.patients) as tendencia
        FROM territory
        INNER JOIN hospital ON hospital.terr_id = territory.id
        INNER JOIN statistics ON statistics.hospital_id = hospital.id
        INNER JOIN disease ON disease.id = statistics.disease_id
        WHERE territory.parent_id = (SELECT territory.id
            FROM territory
            WHERE territory.name = ?) 
        AND statistics.date = (
            SELECT statistics.date
            FROM morbidity.statistics 
            WHERE MONTHNAME(STR_TO_DATE(statistics.date, '%Y%m%d')) = ?
            LIMIT 1
        );`;

    pool.getConnection((err, connection) => {
        if (err) {
            handleError(res, err);
            return;
        }
        // Выполнение запроса на получение данных по параметрам
        connection.query(select, [fo, month], (err, rows) => {
            connection.release(); // вернуть соединение в пул
            if (err) {
                handleError(res, err);
            } else {
                res.send(rows);
            }
        });
    });
});

// Запуск сервера на порту 3000
app.listen(3000, () => {
    console.log('Сервер запущен на порту 3000');
});
