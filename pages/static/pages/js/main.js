document.addEventListener('DOMContentLoaded', () => {
    // Fade-in animation for elements with the .fade-in class
    const fadeInElements = document.querySelectorAll('.fade-in');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeIn 1s ease-out forwards';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    fadeInElements.forEach(el => {
        observer.observe(el);
    });

    // Add active class to nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (link.href === window.location.href) {
            link.classList.add('active');
        }
    });

    // Function to update the balance in the header
    async function updateHeaderBalance() {
        try {
            const response = await fetch('/accounts/get_balance/');
            const data = await response.json();
            if (data.balance !== undefined) {
                const headerBalanceElement = document.querySelector('.balance-amount');
                if (headerBalanceElement) {
                    headerBalanceElement.innerText = data.balance.toLocaleString("en-GB");
                    console.log('Баланс в шапке обновлен через main.js до:', data.balance);
                }
            }
        } catch (error) {
            console.error('Ошибка при получении баланса для шапки:', error);
        }
    }

    // Call the function to update balance when the page loads
    updateHeaderBalance();
});
