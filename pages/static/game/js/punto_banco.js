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
    let balance = 1000;
    let currentBet = null; // { type: 'player' | 'banker' | 'tie', amount: number }
    let deck = [];
    let playerHand = [];
    let bankerHand = [];

    // --- Game Logic Functions ---

    function createDeck(numDecks = 6) {
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const suits = ['♥', '♦', '♣', '♠'];
        let newDeck = [];
        for (let i = 0; i < numDecks; i++) {
            for (const suit of suits) {
                for (const rank of ranks) {
                    newDeck.push({ rank, suit });
                }
            }
        }
        return newDeck;
    }

    function shuffleDeck() {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    function getCardValue(card) {
        if (['10', 'J', 'Q', 'K'].includes(card.rank)) return 0;
        if (card.rank === 'A') return 1;
        return parseInt(card.rank);
    }

    function calculateHandValue(hand) {
        return hand.reduce((sum, card) => sum + getCardValue(card), 0) % 10;
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

    function updateScores() {
        const playerParent = playerScoreEl.parentElement;
        const bankerParent = bankerScoreEl.parentElement;

        playerScoreEl.textContent = calculateHandValue(playerHand);
        bankerScoreEl.textContent = calculateHandValue(bankerHand);

        // Trigger animation
        playerParent.classList.add('score-update');
        bankerParent.classList.add('score-update');

        // Remove class after animation ends to allow re-triggering
        setTimeout(() => {
            playerParent.classList.remove('score-update');
            bankerParent.classList.remove('score-update');
        }, 500);
    }
    
    function placeBet(betType) {
        const amount = parseInt(betAmountEl.value);
        if (isNaN(amount) || amount <= 0) {
            messageEl.textContent = "Please enter a valid bet amount.";
            return;
        }
        if (amount > balance) {
            messageEl.textContent = "Not enough funds for this bet.";
            return;
        }

        currentBet = { type: betType, amount: amount };
        balance -= amount;
        balanceEl.textContent = balance;
        messageEl.textContent = `You bet ${amount} on ${betType}. Click "Deal".`;
        
        // Deal cards face down
        playerHand = [deck.pop(), deck.pop()];
        bankerHand = [deck.pop(), deck.pop()];
        renderHand(playerHand, playerHandEl, false);
        renderHand(bankerHand, bankerHandEl, false);
        
        betBtns.forEach(btn => btn.disabled = true);
        betAmountEl.disabled = true;
        dealBtn.disabled = false;
    }

    function dealCards() {
        dealBtn.disabled = true;
        messageEl.textContent = "Flipping cards...";

        // Flip the cards
        const allCards = document.querySelectorAll('.card');
        allCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('is-flipped');
            }, index * 200);
        });

        // Wait for flip animation to finish before evaluating
        setTimeout(evaluateGame, 2000);
    }

    function evaluateGame() {
        updateScores(); // Display initial scores after flip
        let playerScore = calculateHandValue(playerHand);
        let bankerScore = calculateHandValue(bankerHand);

        // Natural win check
        if (playerScore >= 8 || bankerScore >= 8) {
            setTimeout(endGame, 1000);
            return;
        }

        let playerDrew = false;
        // Player's third card rule
        if (playerScore <= 5) {
            playerHand.push(deck.pop());
            renderHand(playerHand, playerHandEl, true); // Render face up
            updateScores();
            playerDrew = true;
        }

        // Banker's third card rule
        const playerThirdCardValue = playerDrew ? getCardValue(playerHand[2]) : null;
        bankerScore = calculateHandValue(bankerHand); // Recalculate before decision

        let bankerShouldDraw = false;
        if (!playerDrew) {
            if (bankerScore <= 5) {
                bankerShouldDraw = true;
            }
        } else {
            if (bankerScore <= 2) {
                bankerShouldDraw = true;
            } else if (bankerScore === 3 && playerThirdCardValue !== 8) {
                bankerShouldDraw = true;
            } else if (bankerScore === 4 && [2, 3, 4, 5, 6, 7].includes(playerThirdCardValue)) {
                bankerShouldDraw = true;
            } else if (bankerScore === 5 && [4, 5, 6, 7].includes(playerThirdCardValue)) {
                bankerShouldDraw = true;
            } else if (bankerScore === 6 && [6, 7].includes(playerThirdCardValue)) {
                bankerShouldDraw = true;
            }
        }

        if (bankerShouldDraw) {
            bankerHand.push(deck.pop());
            renderHand(bankerHand, bankerHandEl, true); // Render face up
            updateScores();
        }

        setTimeout(endGame, 1000); // Delay before showing result
    }

    function endGame() {
        const playerScore = calculateHandValue(playerHand);
        const bankerScore = calculateHandValue(bankerHand);
        let winner = null;

        if (playerScore > bankerScore) {
            winner = 'player';
        } else if (bankerScore > playerScore) {
            winner = 'banker';
        } else {
            winner = 'tie';
        }

        let payout = 0;
        if (winner === currentBet.type) {
            if (winner === 'player') {
                payout = currentBet.amount * 2;
                messageEl.textContent = `Player wins! You receive ${payout}.`;
            } else if (winner === 'banker') {
                payout = currentBet.amount * 2 * 0.95; // 5% commission
                messageEl.textContent = `Banker wins! You receive ${payout.toFixed(2)} (after 5% commission).`;
            } else { // Tie
                payout = currentBet.amount * 9; // 8 to 1 payout
                messageEl.textContent = `It's a Tie! You receive ${payout}.`;
            }
            balance += payout;
        } else {
            messageEl.textContent = `You lost. The winner was: ${winner}.`;
        }
        
        balanceEl.textContent = balance.toFixed(2);
        resetBtn.style.display = 'inline-block';
    }
    
    function resetGame() {
        currentBet = null;
        playerHand = [];
        bankerHand = [];
        
        playerHandEl.innerHTML = '';
        bankerHandEl.innerHTML = '';
        playerScoreEl.textContent = '0';
        bankerScoreEl.textContent = '0';
        messageEl.textContent = 'Place your bet to start the game.';

        betBtns.forEach(btn => btn.disabled = false);
        betAmountEl.disabled = false;
        resetBtn.style.display = 'none';
        dealBtn.disabled = true;

        if (deck.length < 20) { // Reshuffle if deck is low
            deck = createDeck();
            shuffleDeck();
            messageEl.textContent += ' Deck has been reshuffled.';
        }
    }

    // --- Event Listeners ---
    betBtns.forEach(btn => {
        btn.addEventListener('click', () => placeBet(btn.dataset.bet));
    });

    dealBtn.addEventListener('click', dealCards);
    resetBtn.addEventListener('click', resetGame);

    // --- Initial Game Setup ---
    function init() {
        balanceEl.textContent = balance;
        deck = createDeck();
        shuffleDeck();
    }

    init();
});
