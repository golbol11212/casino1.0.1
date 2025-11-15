document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const balanceEl = document.getElementById('balance');
    const betAmountEl = document.getElementById('bet-amount');
    const betBtns = document.querySelectorAll('.bet-btn');
    const dealBtn = document.getElementById('deal-btn');
    const resetBtn = document.getElementById('reset-btn');
    const playerHandEl = document.getElementById('player-hand');
    const bankerHandEl = document.getElementById('banker-hand');
    const playerScoreEl = document.getElementById('player-score');
    const bankerScoreEl = document.getElementById('banker-score');
    const messageEl = document.getElementById('message');

    // Game State
    let currentBalance = 0;
    let currentBet = null; // { type: 'player' | 'banker' | 'tie', amount: number }
    let gameClickId = null; // Для отслеживания GameClick

    // --- Helper Functions ---
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

    async function fetchBalance() {
        try {
            const response = await fetch('/accounts/get_balances/');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            currentBalance = data.main_balance;
            updateBalanceDisplay();
        } catch (error) {
            console.error('Ошибка при получении баланса:', error);
            messageEl.textContent = "Не удалось загрузить баланс.";
        }
    }

    function updateBalanceDisplay() {
        balanceEl.textContent = currentBalance.toFixed(2);
    }

    function renderHand(hand, element, faceUp = false) {
        element.innerHTML = '';
        hand.forEach(card => {
            const cardWrapper = document.createElement('div');
            cardWrapper.className = 'card';
            if (faceUp) {
                cardWrapper.classList.add('is-flipped');
            }

            const cardInner = document.createElement('div');
            cardInner.className = 'card-inner';

            const cardBack = document.createElement('div');
            cardBack.className = 'card-face card-back';

            const cardFront = document.createElement('div');
            cardFront.className = 'card-face card-front';
            cardFront.textContent = `${card.rank}${card.suit}`;

            if (card.suit === '♥' || card.suit === '♦') {
                cardFront.classList.add('red');
            }

            cardInner.appendChild(cardBack);
            cardInner.appendChild(cardFront);
            cardWrapper.appendChild(cardInner);
            element.appendChild(cardWrapper);
        });
    }

    function updateScores(playerScore, bankerScore) {
        const playerParent = playerScoreEl.parentElement;
        const bankerParent = bankerScoreEl.parentElement;

        playerScoreEl.textContent = playerScore;
        bankerScoreEl.textContent = bankerScore;

        // Trigger animation
        playerParent.classList.add('score-update');
        bankerParent.classList.add('score-update');

        // Remove class after animation ends to allow re-triggering
        setTimeout(() => {
            playerParent.classList.remove('score-update');
            bankerParent.classList.remove('score-update');
        }, 500);
    }
    
    async function placeBet(betType) {
        const amount = parseInt(betAmountEl.value);
        if (isNaN(amount) || amount <= 0) {
            messageEl.textContent = "Please enter a valid bet amount.";
            return;
        }
        if (amount > currentBalance) {
            messageEl.textContent = "Not enough funds for this bet.";
            return;
        }

        try {
            const response = await fetch('/game/punto_banco/place_bet/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ bet_amount: amount, bet_type: betType })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            currentBalance = data.new_balance;
            gameClickId = data.game_click_id;
            currentBet = { type: betType, amount: amount };
            updateBalanceDisplay();
            messageEl.textContent = `You bet ${amount} on ${betType}. Click "Deal".`;
            
            betBtns.forEach(btn => btn.disabled = true);
            betAmountEl.disabled = true;
            dealBtn.disabled = false;

        } catch (error) {
            console.error('Ошибка при размещении ставки:', error);
            messageEl.textContent = `Ошибка: ${error.message}`;
        }
    }

    async function dealCards() {
        dealBtn.disabled = true;
        messageEl.textContent = "Flipping cards...";

        try {
            const response = await fetch('/game/punto_banco/deal/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ game_click_id: gameClickId, bet_type: currentBet.type, bet_amount: currentBet.amount })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            currentBalance = data.new_balance;
            updateBalanceDisplay();

            // Render initial hands face down
            renderHand(data.player_hand.slice(0, 2), playerHandEl, false);
            renderHand(data.banker_hand.slice(0, 2), bankerHandEl, false);

            // Flip the cards
            const allCards = document.querySelectorAll('.card');
            allCards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('is-flipped');
                }, index * 200);
            });

            // Wait for flip animation to finish before displaying full hands and scores
            setTimeout(() => {
                renderHand(data.player_hand, playerHandEl, true);
                renderHand(data.banker_hand, bankerHandEl, true);
                updateScores(data.player_score, data.banker_score);
                messageEl.textContent = data.message;
                resetBtn.style.display = 'inline-block';
            }, 2000); // Adjust delay as needed for animation

        } catch (error) {
            console.error('Ошибка при раздаче карт:', error);
            messageEl.textContent = `Ошибка: ${error.message}`;
            resetBtn.style.display = 'inline-block';
        }
    }
    
    function resetGame() {
        currentBet = null;
        gameClickId = null;
        
        playerHandEl.innerHTML = '';
        bankerHandEl.innerHTML = '';
        playerScoreEl.textContent = '0';
        bankerScoreEl.textContent = '0';
        messageEl.textContent = 'Place your bet to start the game.';

        betBtns.forEach(btn => btn.disabled = false);
        betAmountEl.disabled = false;
        resetBtn.style.display = 'none';
        dealBtn.disabled = true;

        fetchBalance(); // Обновляем баланс после сброса
    }

    // --- Event Listeners ---
    betBtns.forEach(btn => {
        btn.addEventListener('click', () => placeBet(btn.dataset.bet));
    });

    dealBtn.addEventListener('click', dealCards);
    resetBtn.addEventListener('click', resetGame);

    // --- Initial Game Setup ---
    function init() {
        fetchBalance(); // Инициализация баланса при загрузке страницы
    }

    init();
});
