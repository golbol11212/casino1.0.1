document.addEventListener('DOMContentLoaded', () => {
    const openCaseBtn = document.getElementById('open-case-btn');
    const casesArea = document.getElementById('cases-area');
    const totalWinningsText = document.getElementById('total-winnings-text');
    const mainBalanceSpan = document.getElementById('main-balance');
    const caseAmountInput = document.getElementById('case-amount');
    const exitBtn = document.getElementById('exit-btn');

    let currentMainBalance = 0;
    // Получаем caseType и caseCost из атрибутов данных HTML
    const mainWrapper = document.querySelector('.main-wrapper');
    const caseType = mainWrapper.dataset.caseType;
    const caseCost = parseFloat(mainWrapper.dataset.caseCost);

    let isOpening = false;

    async function fetchBalances() {
        try {
            const response = await fetch('/accounts/get_balance/'); // Изменено на существующий URL
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            currentMainBalance = data.balance; // Изменено на 'balance'
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
        openCaseBtn.textContent = `Открыть ${amount} ${caseType} кейс(-а) (${totalCost.toFixed(2)} очков)`;

        openCaseBtn.disabled = isOpening || currentMainBalance < totalCost;
        caseAmountInput.disabled = isOpening;
    }

    function generateSingleItem(winningPoints) {
        const items = [];
        // Добавляем 49 случайных элементов
        for (let i = 0; i < 49; i++) {
            const points = Math.floor(Math.random() * 241) + 10; // 10 - 250
            let rarity = 'common';
            if (points > 200) rarity = 'rare';
            else if (points > 100) rarity = 'uncommon';
            items.push({ points, rarity });
        }
        // Вставляем выигрышный элемент на 44-ю позицию (индекс 43)
        let winningRarity = 'common';
        if (winningPoints > 200) winningRarity = 'rare';
        else if (winningPoints > 100) winningRarity = 'uncommon';
        items.splice(43, 0, { points: winningPoints, rarity: winningRarity }); // Вставляем на 44-ю позицию

        return items;
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

    function runSpinAnimation(reelsElement, winningPoints) {
        return new Promise(resolve => {
            reelsElement.style.transition = 'none';
            reelsElement.style.left = '0';
            reelsElement.innerHTML = '';

            const reelItems = generateSingleItem(winningPoints);

            reelItems.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('item', item.rarity);
                itemDiv.textContent = `${item.points.toFixed(2)}`; // Округляем до двух знаков после запятой
                reelsElement.appendChild(itemDiv);
            });

            setTimeout(() => {
                const randomSpeed = 4 + Math.random() * 2;
                reelsElement.style.transition = `left ${randomSpeed}s cubic-bezier(0.25, 1, 0.5, 1)`;
                const containerWidth = reelsElement.parentElement.offsetWidth;
                const itemWidth = 100; // Ширина одного элемента
                // Позиция выигрышного элемента (44-й элемент, индекс 43)
                const winningItemIndex = 43;
                const offset = Math.random() * (itemWidth - 40) - (itemWidth / 2 - 20); // Небольшое смещение для реалистичности
                const winningPosition = winningItemIndex * itemWidth - (containerWidth / 2) + (itemWidth / 2) + offset;
                reelsElement.style.left = `-${winningPosition}px`;
                setTimeout(() => resolve(winningPoints), randomSpeed * 1000);
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
            updateUI();

            const spinPromises = [];
            // data.individual_winnings будет массивом выигрышей для каждого кейса
            for (let i = 0; i < data.individual_winnings.length; i++) {
                const { caseContainer, reels } = createCaseElement();
                casesArea.appendChild(caseContainer);
                spinPromises.push(runSpinAnimation(reels, data.individual_winnings[i]));
            }

            const winnings = await Promise.all(spinPromises);
            const totalWinnings = winnings.reduce((sum, points) => sum + points, 0);

            totalWinningsText.textContent = `Общий выигрыш: ${totalWinnings.toFixed(0)} очков!`; // Округляем до целых чисел
            totalWinningsText.classList.add('winning-animation');

        } catch (error) {
            console.error('Ошибка при открытии кейса:', error);
            totalWinningsText.textContent = `Ошибка: ${error.message}`;
            alert(`Ошибка: ${error.message}`); // Более заметное сообщение об ошибке
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
