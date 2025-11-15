const reel1 = document.getElementById('reel1');
const reel2 = document.getElementById('reel2');
const reel3 = document.getElementById('reel3');
const spinButton = document.getElementById('spinButton');
const resultDiv = document.getElementById('result');
const balanceAmountSpan = document.getElementById('balance-amount');
const betAmountSpan = document.getElementById('bet-amount');
const increaseBetButton = document.getElementById('increase-bet');
const decreaseBetButton = document.getElementById('decrease-bet');

const symbols = ['🍒', '🍋', '🍊', '🍇', '🍉', '🔔', '⭐'];
const reels = [reel1, reel2, reel3];

const payouts = {
    '🍒': 2,
    '🍋': 2,
    '🍊': 2,
    '🍇': 5,
    '🍉': 5,
    '🔔': 10,
    '⭐': 50
};

let currentBalance = 0; // Изменено на currentBalance
let bet = 10;
let gameClickId = null; // Для отслеживания GameClick

async function fetchBalance() {
    try {
        const response = await fetch('/accounts/get_balances/');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        currentBalance = data.main_balance;
        updateUI();
    } catch (error) {
        console.error('Ошибка при получении баланса:', error);
        resultDiv.textContent = "Не удалось загрузить баланс.";
    }
}

function updateUI() {
    balanceAmountSpan.textContent = currentBalance.toFixed(2);
    betAmountSpan.textContent = bet;
    spinButton.disabled = currentBalance < bet;
    increaseBetButton.disabled = bet >= currentBalance;
    decreaseBetButton.disabled = bet <= 1;
}

increaseBetButton.addEventListener('click', () => {
    if (bet < currentBalance) {
        bet += 1;
        updateUI();
    }
});

decreaseBetButton.addEventListener('click', () => {
    if (bet > 1) {
        bet -= 1;
        updateUI();
    }
});

spinButton.addEventListener('click', async () => { // Сделано асинхронной
    if (currentBalance < bet) {
        resultDiv.textContent = "Not enough balance!";
        return;
    }

    resultDiv.textContent = '';
    spinButton.disabled = true;
    increaseBetButton.disabled = true;
    decreaseBetButton.disabled = true;
    reels.forEach(reel => reel.classList.add('spinning'));

    try {
        const response = await fetch('/game/fortune/spin/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ bet_amount: bet, game_click_id: gameClickId })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        currentBalance = data.new_balance;
        gameClickId = data.game_click_id; // Обновляем gameClickId, если он изменился (для нового раунда)

        // Анимация барабанов
        let spins = 0;
        const maxSpins = 20 + Math.floor(Math.random() * 15);

        const spinInterval = setInterval(() => {
            reel1.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            reel2.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            reel3.textContent = symbols[Math.floor(Math.random() * symbols.length)];

            spins++;

            if (spins > maxSpins) {
                clearInterval(spinInterval);
                reels.forEach(reel => reel.classList.remove('spinning'));
                
                // Отображаем результаты с бэкенда
                reel1.textContent = data.symbols[0];
                reel2.textContent = data.symbols[1];
                reel3.textContent = data.symbols[2];

                resultDiv.textContent = data.message;
                resultDiv.style.color = data.status === 'win' ? 'var(--accent)' : '#ff4d4d';
                if (data.status === 'win') {
                    resultDiv.classList.add('win-animation');
                    setTimeout(() => resultDiv.classList.remove('win-animation'), 1000);
                }
                updateUI();
            }
        }, 100);

    } catch (error) {
        console.error('Ошибка при спине:', error);
        resultDiv.textContent = `Ошибка: ${error.message}`;
        resultDiv.style.color = '#ff4d4d';
        reels.forEach(reel => reel.classList.remove('spinning'));
        updateUI();
    } finally {
        spinButton.disabled = false;
        increaseBetButton.disabled = false;
        decreaseBetButton.disabled = false;
    }
});

// Функция getCookie должна быть доступна
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

fetchBalance(); // Инициализация баланса при загрузке страницы
