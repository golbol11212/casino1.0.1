const suits = ['♠', '♥', '♦', '♣'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

let deck = [];
let dealerCards = [];
let playerCards = [];
let gameOver = true;
let currentBet = 0;
let bankAmount = parseInt(document.getElementById('bank-amount').textContent) || 1000;

// DOM элементы
const dealerCardsEl = document.getElementById('dealer-cards');
const playerCardsEl = document.getElementById('player-cards');
const dealerScoreEl = document.getElementById('dealer-score');
const playerScoreEl = document.getElementById('player-score');
const messageEl = document.getElementById('message');
const hitBtn = document.getElementById('hit-btn');
const standBtn = document.getElementById('stand-btn');
const newGameBtn = document.getElementById('new-game-btn');
const exitBtn = document.getElementById('exit-btn');
const bankAmountEl = document.getElementById('bank-amount');
const betButtons = document.querySelectorAll('.bet-btn');

function createCardElement(card, isHidden = false) {
    const cardEl = document.createElement('div');
    cardEl.classList.add('card');
    if (card.suit === '♥' || card.suit === '♦') {
        cardEl.classList.add('red');
    }
    if (isHidden) {
        cardEl.classList.add('hidden-card');
    }
    
    cardEl.innerHTML = `
        <div class="card-content">
            <span class="corner-value top-left">${card.value}<span class="suit">${card.suit}</span></span>
            <span class="center-value">${card.value === '10' ? '10' : card.value}</span>
            <span class="corner-value bottom-right">${card.value}<span class="suit">${card.suit}</span></span>
        </div>
    `;
    if (isHidden) {
        cardEl.querySelector('.card-content').style.display = 'none';
    }
    return cardEl;
}

function initGame() {
    if (currentBet <= 0) {
        messageEl.textContent = 'Пожалуйста, сделайте вашу ставку';
        return false;
    }
    
    if (currentBet > bankAmount) {
        messageEl.textContent = 'Недостаточно денег на счету';
        return false;
    }
    
    bankAmount -= currentBet;
    updateBank();
    
    deck = createDeck();
    shuffleDeck(deck);
    
    dealerCardsEl.innerHTML = '';
    playerCardsEl.innerHTML = '';

    dealerCards = [];
    playerCards = [];
    
    gameOver = false; 

    const dealerCard1Data = drawCard();
    const dealerCard1El = createCardElement(dealerCard1Data, true); 
    dealerCards.push(dealerCard1Data);
    dealerCardsEl.appendChild(dealerCard1El);
    setTimeout(() => dealerCard1El.classList.add('dealt'), 50); 

    const playerCard1Data = drawCard();
    const playerCard1El = createCardElement(playerCard1Data);
    playerCards.push(playerCard1Data);
    playerCardsEl.appendChild(playerCard1El);
    setTimeout(() => playerCard1El.classList.add('dealt'), 100); 

    const dealerCard2Data = drawCard();
    const dealerCard2El = createCardElement(dealerCard2Data);
    dealerCards.push(dealerCard2Data);
    dealerCardsEl.appendChild(dealerCard2El);
    setTimeout(() => dealerCard2El.classList.add('dealt'), 150); 

    const playerCard2Data = drawCard();
    const playerCard2El = createCardElement(playerCard2Data);
    playerCards.push(playerCard2Data);
    playerCardsEl.appendChild(playerCard2El);
    
    setTimeout(() => {
        playerCard2El.classList.add('dealt');
        updateDisplay(); 
        if (calculateScore(playerCards) === 21) {
            endGame('blackjack');
        } else {
            hitBtn.disabled = false;
            standBtn.disabled = false;
            messageEl.textContent = 'Взять карту или Остановиться?';
        }
        updateBetButtons(); 
    }, 200); 
    
    return true;
}

function createDeck() {
    const deck = [];
    for (let suit of suits) {
        for (let value of values) {
            deck.push({ suit, value });
        }
    }
    return deck;
}

function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function drawCard() {
    return deck.pop();
}

function calculateScore(cards) {
    let score = 0;
    let aces = 0;
    
    for (let card of cards) {
        if (card.value === 'A') {
            aces++;
            score += 11;
        } else if (['K', 'Q', 'J'].includes(card.value)) {
            score += 10;
        } else {
            score += parseInt(card.value);
        }
    }
    
    while (score > 21 && aces > 0) {
        score -= 10;
        aces--;
    }
    
    return score;
}

function updateDisplay() {
    dealerCardsEl.innerHTML = '';
    for (let i = 0; i < dealerCards.length; i++) {
        const card = dealerCards[i];
        const isHidden = (i === 0 && !gameOver); 
        const cardEl = createCardElement(card, isHidden);
        dealerCardsEl.appendChild(cardEl);
        setTimeout(() => cardEl.classList.add('dealt'), i * 30); 
    }
    
    playerCardsEl.innerHTML = '';
    for (let i = 0; i < playerCards.length; i++) {
        const card = playerCards[i];
        const cardEl = createCardElement(card);
        playerCardsEl.appendChild(cardEl);
        setTimeout(() => cardEl.classList.add('dealt'), i * 30); 
    }
    
    dealerScoreEl.textContent = gameOver 
        ? `Счет: ${calculateScore(dealerCards)}` 
        : `Счет: ${calculateScore([dealerCards[1]])} + ?`;
        
    playerScoreEl.textContent = `Счет: ${calculateScore(playerCards)}`;
    
    hitBtn.disabled = gameOver;
    standBtn.disabled = gameOver;
}

function updateBank() {
    bankAmountEl.textContent = bankAmount;
    document.getElementById('balance-input').value = bankAmount;
}

function revealDealerCards() {
    const hiddenCardEl = dealerCardsEl.querySelector('.card.hidden-card');
    if (hiddenCardEl) {
        hiddenCardEl.classList.add('revealed'); 
        setTimeout(() => {
            hiddenCardEl.querySelector('.card-content').style.display = 'flex';
            hiddenCardEl.classList.remove('hidden-card'); 
            updateDisplay(); 
        }, 150); 
    } else {
         updateDisplay();
    }
}

function dealerTurn() {
    revealDealerCards(); 
    
    let dealerScore = calculateScore(dealerCards);
    
    return new Promise(resolve => {
        let delay = 200; 

        const dealNextDealerCard = () => {
            if (dealerScore < 17) {
                const newCard = drawCard();
                dealerCards.push(newCard);
                const newCardEl = createCardElement(newCard);
                dealerCardsEl.appendChild(newCardEl);
                setTimeout(() => {
                    newCardEl.classList.add('dealt');
                    dealerScore = calculateScore(dealerCards);
                    updateDisplay();
                    setTimeout(dealNextDealerCard, 300); 
                }, 50); 
            } else {
                resolve(dealerScore);
            }
        };
        setTimeout(dealNextDealerCard, delay);
    });
}

function endGame(result) {
    let winnings = 0;
    messageEl.classList.remove('win', 'lose', 'push'); 
    
    switch(result) {
        case 'win':
            winnings = currentBet * 2;
            messageEl.textContent = `Вы выиграли $${winnings}!`;
            messageEl.classList.add('win');
            break;
        case 'blackjack':
            winnings = Math.floor(currentBet * 2.5);
            messageEl.textContent = `Блэкджек! Вы выиграли $${winnings}!`;
            messageEl.classList.add('win');
            break;
        case 'lose':
            winnings = 0;
            messageEl.textContent = 'Вы проиграли!';
            messageEl.classList.add('lose');
            break;
        case 'push':
            winnings = currentBet;
            messageEl.textContent = 'Ничья!';
            messageEl.classList.add('push');
            break;
    }
    
    bankAmount += winnings;
    updateBank();
    currentBet = 0; 
    
    revealDealerCards(); 
    hitBtn.disabled = true;
    standBtn.disabled = true;
    gameOver = true; 
    updateBetButtons(); 
}

function updateBetButtons() {
    betButtons.forEach(btn => {
        const bet = parseInt(btn.dataset.bet);
        btn.classList.toggle('active', bet === currentBet);
        btn.disabled = !gameOver || (bet > bankAmount); 
    });
}

hitBtn.addEventListener('click', () => {
    if (gameOver) return;
    
    const newCard = drawCard();
    playerCards.push(newCard);
    const newCardEl = createCardElement(newCard);
    playerCardsEl.appendChild(newCardEl);
    setTimeout(() => {
        newCardEl.classList.add('dealt');
        const playerScore = calculateScore(playerCards);
        
        if (playerScore > 21) {
            endGame('lose');
        } else if (playerScore === 21) {
            messageEl.textContent = '21!';
            setTimeout(() => standBtn.click(), 100); 
        }
        updateDisplay();
    }, 50); 
});

standBtn.addEventListener('click', () => {
    if (gameOver) return;
    
    hitBtn.disabled = true;
    standBtn.disabled = true;
    
    dealerTurn().then(dealerScore => {
        const playerScore = calculateScore(playerCards);
        
        if (dealerScore > 21) {
            endGame('win');
        } else if (dealerScore > playerScore) {
            endGame('lose');
        } else if (dealerScore < playerScore) {
            endGame('win');
        } else {
            endGame('push');
        }
    });
});

newGameBtn.addEventListener('click', () => {
    if (gameOver) {
        if (currentBet > 0) {
            if (bankAmount < currentBet) {
                messageEl.textContent = 'Недостаточно денег для этой ставки. Выберите меньшую ставку или пополните банк.';
                return; 
            }
            initGame(); 
        } else {
            messageEl.textContent = 'Сначала сделайте вашу ставку';
        }
    } else {
        if (confirm('Вы уверены, что хотите начать новую игру? Текущая ставка будет потеряна.')) {
            bankAmount += currentBet; 
            currentBet = 0;
            updateBank();
            messageEl.textContent = 'Сделайте вашу ставку';
            dealerCards = [];
            playerCards = [];
            gameOver = true; 
            updateDisplay(); 
            hitBtn.disabled = true;
            standBtn.disabled = true;
            updateBetButtons(); 
        }
    }
});

betButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const bet = parseInt(btn.dataset.bet);
        
        if (gameOver) { 
            currentBet = bet;
            updateBetButtons();
            messageEl.textContent = `Ставка: $${currentBet}. Нажмите "Новая игра", чтобы начать.`;
        } else { 
            if (confirm('Изменить ставку? Текущая игра будет завершена.')) {
                bankAmount += currentBet; 
                currentBet = bet;
                updateBank();
                updateBetButtons();
                gameOver = true;
                dealerCards = [];
                playerCards = [];
                messageEl.textContent = `Ставка: $${currentBet}. Нажмите "Новая игра", чтобы начать.`;
                updateDisplay(); 
                hitBtn.disabled = true;
                standBtn.disabled = true;
            }
        }
    });
});

updateBank();
updateBetButtons(); 
messageEl.textContent = 'Сделайте вашу ставку, чтобы начать Новую игру.';

document.addEventListener('DOMContentLoaded', () => {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    const exitBtn = document.getElementById('exit-btn');

    async function submitBalanceAndExit() {
        const form = document.getElementById('back-form');
        const balanceInput = document.getElementById('balance-input');
        balanceInput.value = bankAmount;

        const formData = new FormData(form);

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Ошибка HTTP: ${response.status} - ${errorData.message || 'Неизвестная ошибка'}`);
            }

            const data = await response.json();

            if (data.status === 'success') {
                if (data.redirect_url) {
                    window.location.href = data.redirect_url;
                }
            } else {
                alert('Ошибка при сохранении баланса: ' + data.message);
            }
        } catch (error) {
            alert('Произошла критическая ошибка: ' + error.message);
        }
    }

    if (exitBtn) {
        exitBtn.addEventListener('click', () => {
            submitBalanceAndExit();
        });
    }
});
