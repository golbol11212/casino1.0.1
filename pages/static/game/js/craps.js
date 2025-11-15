document.addEventListener('DOMContentLoaded', () => {
    const rollButton = document.getElementById('roll-button');
    const dice1Elem = document.getElementById('dice1');
    const dice2Elem = document.getElementById('dice2');
    const messageElem = document.getElementById('message-area');
    const pointDisplayElem = document.getElementById('point-display');
    const balanceDisplayElem = document.getElementById('balance-display');
    const betAmountInput = document.getElementById('bet-amount');
    const placeBetButton = document.getElementById('place-bet-button');

    let point = null;
    let isComeOutRoll = true;
    let currentBalance = 0; // Изменено на currentBalance
    let currentBet = 0;
    let gameClickId = null; // Для отслеживания GameClick

    async function fetchBalance() {
        try {
            const response = await fetch('/accounts/get_balances/'); // Изменено на get_balances
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            currentBalance = data.main_balance; // Изменено на main_balance
            updateBalanceDisplay();
        } catch (error) {
            console.error('Ошибка при получении баланса:', error);
            messageElem.innerHTML = '<p class="message error">Не удалось загрузить баланс.</p>';
        }
    }

    function updateBalanceDisplay() {
        balanceDisplayElem.textContent = `Balance: $${currentBalance.toFixed(2)}`;
    }

    async function initializeGame() { // Сделано асинхронной
        await fetchBalance(); // Ожидаем получения баланса с бэкенда
        rollButton.disabled = true;
        placeBetButton.disabled = false;
        betAmountInput.disabled = false;
        betAmountInput.value = '';
        pointDisplayElem.textContent = '';
        messageElem.innerHTML = '<p>Place your bet to start the game.</p>';
    }

    initializeGame();

    placeBetButton.addEventListener('click', async () => {
        const betValue = parseInt(betAmountInput.value);
        if (isNaN(betValue) || betValue <= 0) {
            messageElem.innerHTML = '<p class="message error">Please enter a valid bet amount.</p>';
            return;
        }
        if (betValue > currentBalance) { // Проверяем против currentBalance
            messageElem.innerHTML = '<p class="message error">Not enough funds for this bet.</p>';
            return;
        }

        try {
            const response = await fetch('/game/craps/place_bet/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ bet_amount: betValue })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            currentBalance = data.new_balance;
            gameClickId = data.game_click_id; // Сохраняем game_click_id
            currentBet = betValue;
            updateBalanceDisplay();
            
            rollButton.disabled = false;
            placeBetButton.disabled = true;
            betAmountInput.disabled = true;
            messageElem.innerHTML = `<p>Bet of $${currentBet} accepted. Roll the dice!</p>`;

        } catch (error) {
            console.error('Ошибка при размещении ставки:', error);
            messageElem.innerHTML = `<p class="message error">Ошибка: ${error.message}</p>`;
        }
    });

    function rollSingleDice() {
        return Math.floor(Math.random() * 6) + 1;
    }

    function animateDice(d1, d2) {
        const rotations = {
            1: 'rotateY(0deg)',
            2: 'rotateY(90deg)',
            3: 'rotateX(-90deg)',
            4: 'rotateX(90deg)',
            5: 'rotateY(-90deg)',
            6: 'rotateY(180deg)'
        };
        
        const randomX1 = 360 * (Math.random() * 2 + 3);
        const randomY1 = 360 * (Math.random() * 2 + 3);
        const randomZ1 = 360 * (Math.random() * 2 + 3);
        const randomX2 = 360 * (Math.random() * 2 + 3);
        const randomY2 = 360 * (Math.random() * 2 + 3);
        const randomZ2 = 360 * (Math.random() * 2 + 3);

        dice1Elem.style.transform = `rotateX(${randomX1}deg) rotateY(${randomY1}deg) rotateZ(${randomZ1}deg)`;
        dice2Elem.style.transform = `rotateX(${randomX2}deg) rotateY(${randomY2}deg) rotateZ(${randomZ2}deg)`;

        return new Promise(resolve => {
            setTimeout(() => {
                dice1Elem.style.transform = rotations[d1];
                dice2Elem.style.transform = rotations[d2];
                setTimeout(resolve, 1200);
            }, 100);
        });
    }

    rollButton.addEventListener('click', async () => {
        rollButton.disabled = true;
        
        try {
            const response = await fetch('/game/craps/roll_dice/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ 
                    game_click_id: gameClickId,
                    point: point,
                    is_come_out_roll: isComeOutRoll,
                    current_bet: currentBet
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            await animateDice(data.dice_roll[0], data.dice_roll[1]);

            messageElem.innerHTML = `<p>${data.message}</p>`;
            currentBalance = data.new_balance;
            updateBalanceDisplay();

            if (data.game_status === 'new_round_win' || data.game_status === 'new_round_lose') {
                resetForNewRound();
            } else {
                point = data.point;
                isComeOutRoll = data.is_come_out_roll;
                pointDisplayElem.textContent = `Point: ${point}`;
                rollButton.disabled = false;
            }

        } catch (error) {
            console.error('Ошибка при броске кубиков:', error);
            messageElem.innerHTML = `<p class="message error">Ошибка: ${error.message}</p>`;
            rollButton.disabled = false; // Разблокировать кнопку для повторной попытки
        }
    });

    function resetForNewRound() {
        point = null;
        isComeOutRoll = true;
        currentBet = 0;
        gameClickId = null; // Сбрасываем gameClickId
        updateBalanceDisplay();
        
        if (currentBalance > 0) {
            rollButton.disabled = true;
            placeBetButton.disabled = false;
            betAmountInput.disabled = false;
            betAmountInput.value = '';
            pointDisplayElem.textContent = '';
            messageElem.innerHTML += '<p>Place your bet for the next round.</p>';
        } else {
            messageElem.innerHTML += '<p class="message error">Game Over. You are out of money.</p>';
            rollButton.disabled = true;
            placeBetButton.disabled = true;
            betAmountInput.disabled = true;
        }
        
        setTimeout(() => {
             dice1Elem.style.transition = 'none';
             dice2Elem.style.transition = 'none';
             dice1Elem.style.transform = 'rotateX(-30deg) rotateY(35deg)';
             dice2Elem.style.transform = 'rotateX(-30deg) rotateY(35deg)';
             setTimeout(() => {
                dice1Elem.style.transition = 'transform 1.2s cubic-bezier(0.25, 1, 0.5, 1)';
                dice2Elem.style.transition = 'transform 1.2s cubic-bezier(0.25, 1, 0.5, 1)';
             }, 50);
        }, 2000);
    }
});
