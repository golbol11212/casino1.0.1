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
    let balance = 1000;
    let currentBet = 0;

    function updateBalanceDisplay() {
        balanceDisplayElem.textContent = `Balance: $${balance}`;
    }

    function initializeGame() {
        updateBalanceDisplay();
        rollButton.disabled = true;
        placeBetButton.disabled = false;
        betAmountInput.disabled = false;
        betAmountInput.value = '';
    }

    initializeGame();

    placeBetButton.addEventListener('click', () => {
        const betValue = parseInt(betAmountInput.value);
        if (isNaN(betValue) || betValue <= 0) {
            messageElem.innerHTML = '<p class="message error">Please enter a valid bet amount.</p>';
            return;
        }
        if (betValue > balance) {
            messageElem.innerHTML = '<p class="message error">Not enough funds for this bet.</p>';
            return;
        }

        currentBet = betValue;
        balance -= currentBet;
        updateBalanceDisplay();
        
        rollButton.disabled = false;
        placeBetButton.disabled = true;
        betAmountInput.disabled = true;
        messageElem.innerHTML = `<p>Bet of $${currentBet} accepted. Roll the dice!</p>`;
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
        const d1 = rollSingleDice();
        const d2 = rollSingleDice();
        const sum = d1 + d2;

        await animateDice(d1, d2);

        if (isComeOutRoll) {
            handleComeOutRoll(sum);
        } else {
            handlePointRoll(sum);
        }
    });

    function handleComeOutRoll(sum) {
        messageElem.innerHTML = `<p>You rolled: ${sum}</p>`;
        if (sum === 7 || sum === 11) {
            messageElem.innerHTML += '<p class="message success">Pass Line win! A new round begins.</p>';
            balance += currentBet * 2;
            resetForNewRound();
        } else if (sum === 2 || sum === 3 || sum === 12) {
            messageElem.innerHTML += '<p class="message error">Craps! Pass Line loses. A new round begins.</p>';
            resetForNewRound();
        } else {
            point = sum;
            isComeOutRoll = false;
            pointDisplayElem.textContent = `Point: ${point}`;
            messageElem.innerHTML += `<p>Point is set to ${point}. Roll ${point} again before a 7.</p>`;
            rollButton.disabled = false;
        }
    }

    function handlePointRoll(sum) {
        messageElem.innerHTML = `<p>You rolled: ${sum}</p>`;
        if (sum === point) {
            messageElem.innerHTML += `<p class="message success">You hit the Point (${point})! Pass Line wins! A new round begins.</p>`;
            balance += currentBet * 2;
            resetForNewRound();
        } else if (sum === 7) {
            messageElem.innerHTML += '<p class="message error">You rolled a 7. Pass Line loses. A new round begins.</p>';
            resetForNewRound();
        } else {
             messageElem.innerHTML += `<p>Keep rolling. You need a ${point}.</p>`;
             rollButton.disabled = false;
        }
    }

    function resetForNewRound() {
        point = null;
        isComeOutRoll = true;
        currentBet = 0;
        updateBalanceDisplay();
        
        if (balance > 0) {
            rollButton.disabled = true;
            placeBetButton.disabled = false;
            betAmountInput.disabled = false;
            betAmountInput.value = '';
             messageElem.innerHTML += '<p>Place your bet for the next round.</p>';
        } else {
            messageElem.innerHTML += '<p class="message error">Game Over. You are out of money.</p>';
            rollButton.disabled = true;
            placeBetButton.disabled = true;
            betAmountInput.disabled = true;
        }
        
        setTimeout(() => {
             if (isComeOutRoll) pointDisplayElem.textContent = '';
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
