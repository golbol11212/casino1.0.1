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

let balance = 100;
let bet = 10;

function updateUI() {
    balanceAmountSpan.textContent = balance;
    betAmountSpan.textContent = bet;
    spinButton.disabled = balance < bet;
    increaseBetButton.disabled = bet >= balance;
    decreaseBetButton.disabled = bet <= 1;
}

increaseBetButton.addEventListener('click', () => {
    if (bet < balance) {
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

spinButton.addEventListener('click', () => {
    if (balance < bet) {
        resultDiv.textContent = "Not enough balance!";
        return;
    }

    balance -= bet;
    updateUI();

    resultDiv.textContent = '';
    spinButton.disabled = true;
    increaseBetButton.disabled = true;
    decreaseBetButton.disabled = true;
    reels.forEach(reel => reel.classList.add('spinning'));

    let spins = 0;
    const maxSpins = 20 + Math.floor(Math.random() * 15);

    const spinInterval = setInterval(() => {
        const s1 = symbols[Math.floor(Math.random() * symbols.length)];
        const s2 = symbols[Math.floor(Math.random() * symbols.length)];
        const s3 = symbols[Math.floor(Math.random() * symbols.length)];

        reel1.textContent = s1;
        reel2.textContent = s2;
        reel3.textContent = s3;

        spins++;

        if (spins > maxSpins) {
            clearInterval(spinInterval);
            reels.forEach(reel => reel.classList.remove('spinning'));
            checkWin(s1, s2, s3);
            updateUI();
        }
    }, 100);
});

function checkWin(s1, s2, s3) {
    if (s1 === s2 && s2 === s3) {
        const payout = payouts[s1] * bet;
        balance += payout;
        resultDiv.textContent = `You won ${payout}!`;
        resultDiv.style.color = 'var(--accent)';
        resultDiv.classList.add('win-animation');
        setTimeout(() => resultDiv.classList.remove('win-animation'), 1000);
    } else {
        resultDiv.textContent = 'Try Again!';
        resultDiv.style.color = '#ff4d4d';
    }
    if (balance === 0 && bet > 0) {
        resultDiv.textContent = "Game Over!";
        spinButton.disabled = true;
    }
}

updateUI();
