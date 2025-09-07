const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
const balanceInput = document.getElementById('balanceInput');
const balanceAmountEl = document.getElementById('balanceAmount');
let currentBalance = parseFloat(balanceAmountEl.textContent);

const gridContainer = document.getElementById('gridContainer');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const messageDisplay = document.getElementById('messageDisplay');
const luckyNumbersDisplay = document.getElementById('luckyNumbersDisplay');

const attemptsCost = 10;
const maxRevealedCells = 3;
const luckyNumberPayout = 50;

let numbers = [];
let luckyNumbers = [];
let revealedCount = 0;
let score = 0;

async function fetchGameData() {
    try {
        // This endpoint doesn't exist, so I'll remove it.
        // The numbers can be generated on the client side.
        // const response = await fetch('/game/blingo/game-data/');
        // if (!response.ok) {
        //     throw new Error(`HTTP error! status: ${response.status}`);
        // }
        // const data = await response.json();
        // numbers = data.numbers;
        // luckyNumbers = data.lucky_numbers;
        generateGameData();
        luckyNumbersDisplay.textContent = luckyNumbers.join(', ');
    } catch (error) {
        messageDisplay.textContent = "Не удалось загрузить данные игры. Пожалуйста, попробуйте позже.";
        messageDisplay.style.color = 'var(--accent)';
        startBtn.disabled = true;
    }
}

function generateGameData() {
    numbers = Array.from({length: 25}, (_, i) => i + 1);
    // Shuffle numbers
    for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    luckyNumbers = [];
    while(luckyNumbers.length < 3){
        const r = Math.floor(Math.random() * 25) + 1;
        if(luckyNumbers.indexOf(r) === -1) luckyNumbers.push(r);
    }
}

function createGrid() {
    gridContainer.innerHTML = '';
    for (let i = 0; i < 25; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        cell.textContent = '?';
        cell.addEventListener('click', handleCellClick);
        gridContainer.appendChild(cell);
    }
}

function startGame() {
    score = 0;
    revealedCount = 0;
    messageDisplay.textContent = "Выберите 3 ячейки!";
    messageDisplay.style.color = 'var(--text)';
    startBtn.disabled = true;
    resetBtn.disabled = false;
    fetchGameData().then(() => {
        createGrid();
        gridContainer.querySelectorAll('.cell').forEach(cell => {
            cell.style.pointerEvents = 'auto';
            cell.textContent = '?';
            cell.classList.remove('revealed', 'lucky', 'unlucky', 'matched');
        });
    });
}

async function handleCellClick(event) {
    const cell = event.target;
    if (cell.classList.contains('revealed') || revealedCount >= maxRevealedCells) {
        return;
    }

    const index = parseInt(cell.dataset.index);
    const number = numbers[index];
    cell.textContent = number;
    cell.classList.add('revealed');
    revealedCount++;

    if (luckyNumbers.includes(number)) {
        cell.classList.add('lucky', 'matched');
        score += luckyNumberPayout;
        messageDisplay.textContent = `Поздравляем! Вы нашли счастливое число ${number}! +${luckyNumberPayout} к счету. Текущий счет: ${score}`;
        messageDisplay.style.color = 'var(--secondary)';
    } else {
        cell.classList.add('unlucky');
        messageDisplay.textContent = `Вы нашли число ${number}. Текущий счет: ${score}`;
        messageDisplay.style.color = 'var(--text)';
    }

    if (revealedCount === maxRevealedCells) {
        endGame();
    }
}

async function endGame() {
    messageDisplay.textContent = `Игра окончена! Ваш итоговый счет: ${score}.`;
    messageDisplay.style.color = 'var(--primary)';
    gridContainer.querySelectorAll('.cell').forEach(cell => {
        cell.style.pointerEvents = 'none';
    });
    startBtn.disabled = false;
    resetBtn.disabled = false;

    await saveAttempt();
}

async function saveAttempt() {
    const gameResult = score > 0 ? 'win' : 'lose';

    try {
        const response = await fetch('/game/save-game-attempt/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                attempts_count: 1,
                game_score: score,
                result: gameResult
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Ошибка HTTP: ${response.status} - ${errorData.message || 'Неизвестная ошибка'}`);
        }

        const data = await response.json();
        if (data.status === 'success') {
            if (data.new_balance !== undefined) {
                currentBalance = data.new_balance;
                balanceAmountEl.textContent = currentBalance.toFixed(2);
                balanceInput.value = currentBalance.toFixed(2);
            }
        } else {
            messageDisplay.textContent = 'Ошибка при сохранении игры: ' + data.message;
            messageDisplay.style.color = 'var(--accent)';
        }
    } catch (error) {
        messageDisplay.textContent = 'Произошла критическая ошибка при сохранении игры: ' + error.message;
        messageDisplay.style.color = 'var(--accent)';
    }
}

startBtn.addEventListener('click', async () => {
    if (currentBalance < attemptsCost) {
        messageDisplay.textContent = "Недостаточно средств для начала игры. Пополните баланс!";
        messageDisplay.style.color = 'var(--accent)';
        return;
    }
    
    try {
        const response = await fetch('/game/start-blingo-play/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            }
        });
        const data = await response.json();
        if (data.status === 'success') {
            currentBalance -= attemptsCost;
            balanceAmountEl.textContent = currentBalance.toFixed(2);
            updateBankInput();
            startGame();
        } else {
            messageDisplay.textContent = data.message;
            messageDisplay.style.color = 'var(--accent)';
            startBtn.disabled = true;
        }
    } catch (error) {
        messageDisplay.textContent = 'Не удалось начать игру. Пожалуйста, попробуйте позже.';
        messageDisplay.style.color = 'var(--accent)';
    }
});

resetBtn.addEventListener('click', () => {
    createGrid();
    revealedCount = 0;
    score = 0;
    messageDisplay.textContent = "Выберите 3 ячейки!";
    messageDisplay.style.color = 'var(--text)';
    startBtn.disabled = false;
    resetBtn.disabled = true;
    luckyNumbersDisplay.textContent = '';
    gridContainer.querySelectorAll('.cell').forEach(cell => {
        cell.style.pointerEvents = 'auto';
        cell.textContent = '?';
        cell.classList.remove('revealed', 'lucky', 'unlucky', 'matched');
    });
});

async function initialAttemptCheck() {
    try {
        const response = await fetch('/game/check_blingo_attempts/');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.can_play) {
            messageDisplay.textContent = `У вас есть ${data.max_attempts - data.attempts_today} попыток. Стоимость: ${attemptsCost} кредитов.`;
            messageDisplay.style.color = 'var(--text)';
            startBtn.disabled = false;
        } else {
            messageDisplay.textContent = `У вас нет доступных попыток на сегодня. Использовано: ${data.attempts_today}/${data.max_attempts}. Попробуйте завтра!`;
            messageDisplay.style.color = 'var(--accent)';
            startBtn.disabled = true;
        }
    } catch (error) {
        messageDisplay.textContent = 'Не удалось проверить попытки. Пожалуйста, попробуйте позже.';
        messageDisplay.style.color = 'var(--accent)';
        startBtn.disabled = false;
    }
}

function updateBankInput() {
    balanceInput.value = currentBalance.toFixed(2);
}

updateBankInput();
initialAttemptCheck();

document.getElementById('backForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const data = {};
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    try {
        const response = await fetch(form.action, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Ошибка HTTP: ${response.status} - ${errorData.message || 'Неизвестная ошибка'}`);
        }

        const responseData = await response.json();

        if (responseData.status === 'success') {
            if (responseData.redirect_url) {
                window.location.href = responseData.redirect_url;
            }
        } else {
            alert('Ошибка при сохранении баланса: ' + responseData.message);
        }
    } catch (error) {
        alert('Произошла критическая ошибка: ' + error.message);
    }
});
