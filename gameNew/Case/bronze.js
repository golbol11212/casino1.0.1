document.addEventListener('DOMContentLoaded', () => {
    const openCaseBtn = document.getElementById('open-case-btn');
    const casesArea = document.getElementById('cases-area');
    const totalWinningsText = document.getElementById('total-winnings-text');
    const balanceSpan = document.getElementById('balance');
    const caseAmountInput = document.getElementById('case-amount');
    const exitBtn = document.getElementById('exit-btn');

    let balance = 10000;
    const caseCost = 100; // Дешевле
    let isOpening = false;

    // Используем localStorage для синхронизации баланса
    function getBalance() {
        return parseInt(localStorage.getItem('caseBalance') || '10000', 10);
    }

    function saveBalance(newBalance) {
        localStorage.setItem('caseBalance', newBalance);
        balance = newBalance;
        updateUI();
    }
    
    balance = getBalance();

    function updateUI() {
        const amount = parseInt(caseAmountInput.value, 10) || 1;
        const totalCost = caseCost * amount;

        balanceSpan.textContent = balance;
        openCaseBtn.textContent = `Открыть ${amount} кейс(-а) (${totalCost} очков)`;

        openCaseBtn.disabled = isOpening || balance < totalCost;
        caseAmountInput.disabled = isOpening;
    }

    function generateSingleItem() {
        const points = Math.floor(Math.random() * 241) + 10; // 10 - 250
        let rarity = 'common';
        if (points > 200) rarity = 'rare';
        else if (points > 100) rarity = 'uncommon';
        return { points, rarity };
    }

    function createCaseElement() {
        const caseContainer = document.createElement('div');
        caseContainer.className = 'case-container';
        const reels = document.createElement('div');
        reels.className = 'reels';
        const pointer = document.createElement('div');
        pointer.className = 'pointer';
        caseContainer.appendChild(reels);
        caseContainer.appendChild(pointer);
        return { caseContainer, reels };
    }

    function runSpinAnimation(reelsElement) {
        return new Promise(resolve => {
            reelsElement.style.transition = 'none';
            reelsElement.style.left = '0';
            reelsElement.innerHTML = '';

            const reelItems = Array.from({ length: 50 }, generateSingleItem);
            const winningItem = generateSingleItem();
            reelItems[44] = winningItem;

            reelItems.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('item', item.rarity);
                itemDiv.textContent = `${item.points}`;
                reelsElement.appendChild(itemDiv);
            });

            setTimeout(() => {
                const randomSpeed = 4 + Math.random() * 2;
                reelsElement.style.transition = `left ${randomSpeed}s cubic-bezier(0.25, 1, 0.5, 1)`;
                const containerWidth = reelsElement.parentElement.offsetWidth;
                const itemWidth = 100;
                const offset = Math.random() * (itemWidth - 40) - (itemWidth / 2 - 20);
                const winningPosition = 44 * itemWidth - (containerWidth / 2) + (itemWidth / 2) + offset;
                reelsElement.style.left = `-${winningPosition}px`;
                setTimeout(() => resolve(winningItem.points), randomSpeed * 1000);
            }, 100);
        });
    }

    async function startOpeningSequence(amount) {
        isOpening = true;
        updateUI();
        casesArea.innerHTML = '';
        totalWinningsText.textContent = 'Открытие кейсов...';
        totalWinningsText.classList.remove('winning-animation');

        saveBalance(balance - caseCost * amount);

        const spinPromises = [];
        for (let i = 0; i < amount; i++) {
            const { caseContainer, reels } = createCaseElement();
            casesArea.appendChild(caseContainer);
            spinPromises.push(runSpinAnimation(reels));
        }

        const winnings = await Promise.all(spinPromises);
        const totalWinnings = winnings.reduce((sum, points) => sum + points, 0);
        saveBalance(balance + totalWinnings);

        totalWinningsText.textContent = `Общий выигрыш: ${totalWinnings} очков!`;
        totalWinningsText.classList.add('winning-animation');
        isOpening = false;
        updateUI();
    }

    openCaseBtn.addEventListener('click', () => {
        const amount = parseInt(caseAmountInput.value, 10);
        if (isNaN(amount) || amount < 1 || amount > 10) return;
        const totalCost = caseCost * amount;
        if (balance < totalCost || isOpening) return;
        startOpeningSequence(amount);
    });

    caseAmountInput.addEventListener('input', updateUI);
    exitBtn.addEventListener('click', () => window.close());
    
    // Слушаем изменения в localStorage от других вкладок
    window.addEventListener('storage', (event) => {
        if (event.key === 'caseBalance') {
            balance = parseInt(event.newValue, 10);
            updateUI();
        }
    });

    updateUI();
});
