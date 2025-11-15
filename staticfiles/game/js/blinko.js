const canvas = document.getElementById('plinkoCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const balanceEl = document.getElementById('balance');
const betSelect = document.getElementById('bet');
const dropBallBtn = document.getElementById('drop-ball-btn');
const gameOverControls = document.getElementById('game-over-controls');
const saveAndExitBtn = document.getElementById('save-and-exit-btn');

const pegs = [];
const balls = [];
const slots = [];
let score = 0;
let balance = parseInt(balanceEl.textContent) || 1000;
let canPlay = true;

const pegSpacing = 50;
const rows = 8;
const slotCount = 15;
const slotWidth = canvas.width / slotCount;
const slotMultipliers = [10, 5, 2, 1, 1, 0.2, 0.2, 0, 0.2, 0.2, 1, 1, 2, 5, 10];

class Ball {
  constructor(x, y, bet) {
    this.x = x;
    this.y = y;
    this.radius = 6;
    this.stopped = false;
    this.timer = 0;
    this.bet = bet;
    this.currentRow = 0;
    this.moveDelay = 0;
    this.targetPeg = null;
    this.falling = false;
  }
  
  update() {
    if (this.stopped) {
      this.timer++;
      if (this.timer > 30) {
        const index = balls.indexOf(this);
        if (index > -1) balls.splice(index, 1);
        checkBalanceAndToggleButtons(); 
      }
      return;
    }

    if (this.moveDelay > 0) {
      this.moveDelay--;
      return;
    }

    if (this.falling) {
      this.y += 5;
      if (this.y + this.radius >= canvas.height - 20) {
        this.y = canvas.height - 20 - this.radius;
        this.stopped = true;
        this.calculatePayout();
      }
      return;
    }

    if (!this.targetPeg) {
      this.findNextPeg();
    }

    if (!this.targetPeg) {
      this.falling = true;
      return;
    }

    const dx = this.targetPeg.x - this.x;
    const dy = this.targetPeg.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 2) {
      this.x = this.targetPeg.x;
      this.y = this.targetPeg.y;
      this.currentRow++;
      this.targetPeg = null;
      this.moveDelay = 5;
    } else {
      this.x += dx * 0.2;
      this.y += dy * 0.2;
    }
  }
  
  findNextPeg() {
    if (this.currentRow >= rows - 1) return null;
    
    let candidates = [];
    
    for (let peg of pegs) {
      if (Math.floor(peg.y / pegSpacing) === this.currentRow + 1) {
        candidates.push(peg);
      }
    }
    
    candidates.sort((a, b) => Math.abs(a.x - this.x) - Math.abs(b.x - this.x));
    const closestPegs = candidates.slice(0, 2);
    
    if (closestPegs.length > 0) {
      this.targetPeg = closestPegs[Math.floor(Math.random() * closestPegs.length)];
    }
  }
  
  calculatePayout() {
    const index = Math.floor(this.x / slotWidth);
    if (slotMultipliers[index] !== undefined) {
      const payout = Math.floor(this.bet * slotMultipliers[index]);
      score += payout;
      balance += payout;
      scoreEl.textContent = score;
      balanceEl.textContent = balance;
    }
  }
  
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'red';
    ctx.fill();
  }
}

class Peg {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 5;
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
  }
}

function createPegs() {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < canvas.width / pegSpacing; col++) {
      let x = col * pegSpacing + (row % 2) * (pegSpacing / 2);
      let y = row * pegSpacing + 50;
      pegs.push(new Peg(x, y));
    }
  }
}

function createSlots() {
  for (let i = 0; i < slotCount; i++) {
    slots.push({ x: i * slotWidth, multiplier: slotMultipliers[i] });
  }
}

function drawSlots() {
  ctx.fillStyle = '#333';
  for (let i = 0; i < slots.length; i++) {
    ctx.fillRect(slots[i].x, canvas.height - 20, slotWidth, 20);
    ctx.fillStyle = slotMultipliers[i] === 0 ? 'red' : 'lime';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText("x" + slots[i].multiplier, slots[i].x + slotWidth / 2, canvas.height - 5);
    ctx.fillStyle = '#333';
  }
}

function handleDropBall() {
    const bet = parseInt(betSelect.value);
    if (balance < bet) {
        alert("Недостаточно баланса для ставки " + bet + "!");
        return;
    }

    balance -= bet;
    balanceEl.textContent = balance;
    balls.push(new Ball(canvas.width / 2, 10, bet));
    checkBalanceAndToggleButtons();
}

function dropBall() {
    handleDropBall();
}

function checkBalanceAndToggleButtons() {
    const currentBet = parseInt(betSelect.value);
    if (!canPlay || (balance < currentBet && balls.length === 0)) {
        dropBallBtn.disabled = true;
        betSelect.disabled = true;
        if (balance < currentBet) {
            gameOverControls.style.display = 'flex';
        }
    } else {
        dropBallBtn.disabled = false;
        betSelect.disabled = false;
        gameOverControls.style.display = 'none';
    }
}

async function saveScoreAndExit() {
    try {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        
        const response = await fetch('/game/save-blinko-score/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                game_name: 'blinko',
                game_score: score,
                result: 'manual_exit'
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Ошибка сохранения счета: ${errorData.message}`);
        }

        window.location.href = '/';

    } catch (error) {
        console.error('Ошибка при сохранении или выходе:', error);
        alert('Ошибка при сохранении счета или обновлении баланса: ' + error.message);
    }
}

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let peg of pegs) {
    peg.draw();
  }

  for (let ball of balls) {
    ball.update();
    ball.draw();
  }

  drawSlots();
  requestAnimationFrame(update);
}

dropBallBtn.addEventListener('click', dropBall);
saveAndExitBtn.addEventListener('click', saveScoreAndExit);

createPegs();
createSlots();
checkBalanceAndToggleButtons();
// initialAttemptCheck is no longer needed as the check is done server-side before rendering.
update();
