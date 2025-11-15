document.addEventListener('DOMContentLoaded', () => {
    const openCaseBtn = document.getElementById('open-case-btn');
    const casesArea = document.getElementById('cases-area');
    const totalWinningsText = document.getElementById('total-winnings-text');
    const mainBalanceSpan = document.getElementById('main-balance');
    const caseAmountInput = document.getElementById('case-amount');
    const exitBtn = document.getElementById('exit-btn');

    let currentMainBalance = 0;
    const caseType = 'gold'; // Тип кейса для этого файла
    const caseCost = 2000; // Вартість золотого кейса

    let isOpening = false;

    async function fetchBalances() {
        try {
            const response = await fetch('/accounts/get_balances/');
            console.log('Response from get_balances:', response);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Data from get_balances:', data);
            currentMainBalance = data.main_balance;
            updateUI();
        } catch (error) {
            console.error('Ошибка при получении балансов:', error);
            // Можно показать сообщение об ошибке пользователю
        }
    }

    function updateUI() {
        const amount = parseInt(caseAmountInput.value, 10) || 1;
        const totalCost = caseCost * amount;

        if (mainBalanceSpan) {
            mainBalanceSpan.textContent = currentMainBalance.toFixed(2);
        }
        openCaseBtn.textContent = `Открыть ${amount} золотой кейс(-а) (${totalCost} очков)`;

        openCaseBtn.disabled = isOpening || currentMainBalance < totalCost;
        caseAmountInput.disabled = isOpening;
    }

    function generateSingleItem() {
        const points = Math.floor(Math.random() * 4501) + 500; // 500 - 5000
        let rarity = 'rare';
        if (points > 4500) rarity = 'legendary';
        else if (points > 3000) rarity = 'mythical';
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

        try {
            const response = await fetch('/game/open-case/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ case_type: caseType, amount: amount })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            currentMainBalance = data.new_main_balance;
            updateUI(); // Додано для оновлення UI

            const spinPromises = [];
            for (let i = 0; i < amount; i++) {
                const { caseContainer, reels } = createCaseElement();
                casesArea.appendChild(caseContainer);
                spinPromises.push(runSpinAnimation(reels));
            }

            const winnings = await Promise.all(spinPromises);
            const totalWinnings = winnings.reduce((sum, points) => sum + points, 0);

            totalWinningsText.textContent = `Общий выигрыш: ${totalWinnings} очков!`;
            totalWinningsText.classList.add('winning-animation');

        } catch (error) {
            console.error('Ошибка при открытии кейса:', error);
            totalWinningsText.textContent = `Ошибка: ${error.message}`;
            // Можно показать сообщение об ошибке пользователю
        } finally {
            isOpening = false;
            updateUI();
        }
    }

    openCaseBtn.addEventListener('click', () => {
        const amount = parseInt(caseAmountInput.value, 10);
        const totalCost = caseCost * amount;
        if (isNaN(amount) || amount < 1 || currentMainBalance < totalCost) {
            alert('Недостаточно средств на основном балансе или неверное количество.');
            return;
        }
        if (isOpening) return;
        startOpeningSequence(amount);
    });

    caseAmountInput.addEventListener('input', updateUI);
    if (exitBtn) {
        exitBtn.addEventListener('click', () => {
            window.location.href = '/';
        });
    }

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

    fetchBalances();
});
