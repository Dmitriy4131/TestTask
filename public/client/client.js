const selectMonth = document.querySelector('#selectMonth');
const selectFO = document.querySelector('#selectFO');

const button = document.querySelector('#btn');
const dataContainer = document.querySelector('#data-container');
const dataTable = document.querySelector('#data-table');

// запросы при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const responseMonth = await fetch('http://localhost:3000/months');
        const dataMonth = await responseMonth.json();

        dataMonth.forEach(month => {
            const option = document.createElement('option');
            option.value = month.month_name;
            option.textContent = month.month_name;
            selectMonth.appendChild(option);
        });
        
        const responseFO = await fetch('http://localhost:3000/fo');
        const dataFO = await responseFO.json();

        dataFO.forEach(fo => {
            const option = document.createElement('option');
            option.value = fo.name;
            option.textContent = fo.name;
            selectFO.appendChild(option);
        });

        createTableHeader();

        loadWebData();
    } catch (error) {
        console.error('Произошла ошибка:', error);
    }
});


button.addEventListener('click', loadWebData);

function createTableHeader() {
    // Создаем заголовок таблицы
    const thead = dataTable.querySelector('thead');
    thead.innerHTML = `
        <tr>
            <th>Субъект</th>
            <th>Больница</th>
            <th>Болезнь</th>
            <th>Заболевших</th>
            <th>Выздоровевших</th>
            <th>Тенденция</th>
        </tr>
    `;
};

function loadWebData() {
    // Очищаем содержимое таблицы
    dataContainer.innerHTML = '';

    fetch('http://localhost:3000/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ month: selectMonth.value, fo: selectFO.value })
    })
    .then(response => response.json())
    .then(data => {
        // Создаем строки для таблицы
        const tbody = dataTable.querySelector('tbody');

        data.forEach(item => {
            const row = document.createElement('tr');
            let colorTendencia;
            if (item.tendencia > 0)  colorTendencia = 'green';
            else if (item.tendencia < 0) colorTendencia = 'red';
            row.innerHTML = `
                <td>${item.territory}</td>
                <td>${item.hospital}</td>
                <td>${item.disease}</td>
                <td>${item.patients}</td>
                <td>${item.issued}</td>
                <td class="${colorTendencia}">${item.tendencia}</td>
            `;
            tbody.appendChild(row);
        });
    })
    .catch(error => {
        // Обработка ошибок, если таковые возникнут
        console.error('Произошла ошибка:', error);
    });
};