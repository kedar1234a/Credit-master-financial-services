const RAZORPAY_PAYMENT_LINK = 'https://razorpay.me/@creditmaster';

function toggleMenu() {
    const menu = document.getElementById('nav-menu');
    if (menu) {
        menu.classList.toggle('active');
    } else {
        console.error('Navigation menu with ID "nav-menu" not found.');
    }
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const target = document.querySelector(targetId);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        } else {
            console.log('Navigating to external page:', targetId);
            window.location.href = targetId;
        }
    });
});

function calculateEMI(principal, annualRate, years) {
    if (isNaN(principal) || principal <= 0 || isNaN(annualRate) || isNaN(years)) {
        console.error('Invalid EMI parameters:', { principal, annualRate, years });
        return 0;
    }
    const monthlyRate = annualRate / 12 / 100;
    const months = years * 12;
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
    return isFinite(emi) ? emi.toFixed(2) : 0;
}

function populateOfferPage() {
    const formData = JSON.parse(sessionStorage.getItem('formData'));
    if (!formData) {
        console.error('No formData found in sessionStorage.');
        alert('No application data found. Please submit the form again.');
        window.location.href = 'index.html#loan-form';
        return;
    }

    const requiredFields = ['name', 'email', 'phone', 'city', 'state', 'financialAmount', 'occupation', 'fee', 'gst', 'total'];
    for (const field of requiredFields) {
        if (!formData[field]) {
            console.error(`Missing required field in formData: ${field}`);
            alert('Invalid application data. Please submit the form again.');
            window.location.href = 'index.html#loan-form';
            return;
        }
    }

    const { name, email, phone, city, state, financialAmount, occupation, fee, gst, total } = formData;

    const elements = {
        'loan-amount': Number(financialAmount).toLocaleString('en-IN'),
        'fee-amount': Number(fee).toLocaleString('en-IN'),
        'base-fee': Number(fee).toLocaleString('en-IN'),
        'gst-amount': Number(gst).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        'total-amount': Number(total).toLocaleString('en-IN'),
        'app-loan-amount': Number(financialAmount).toLocaleString('en-IN'),
        'app-name': name || 'N/A',
        'app-phone': phone || 'N/A',
        'app-email': email || 'N/A',
        'app-city': city || 'N/A',
        'app-state': state || 'N/A',
        'app-occupation': occupation || 'N/A'
    };

    for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        } else {
            console.error(`Element with ID "${id}" not found.`);
        }
    }

    const principal = parseFloat(financialAmount);
    if (isNaN(principal) || principal < 1000) {
        console.error('Invalid financialAmount:', financialAmount);
        alert('Invalid loan amount. Please submit the form again.');
        window.location.href = 'index.html#loan-form';
        return;
    }

    const annualRate = 0.12;
    const tenures = [1, 2, 3];
    const emiOptions = tenures.map(year => ({
        year,
        emi: calculateEMI(principal, annualRate, year)
    }));

    const emiOptionsDiv = document.getElementById('emi-options');
    if (emiOptionsDiv) {
        emiOptionsDiv.innerHTML = '';
        emiOptions.forEach(option => {
            if (option.emi > 0) {
                emiOptionsDiv.innerHTML += `
                    <label>
                        <input type="radio" name="tenure" value="${option.year}"> 
                        ${option.year} Year${option.year > 1 ? 's' : ''} (${option.year * 12} Months) => Rs.${Number(option.emi).toLocaleString('en-IN')}
                    </label><br>
                `;
            }
        });
    } else {
        console.error('Element with ID "emi-options" not found.');
    }

    const ctx = document.getElementById('emiChart');
    if (ctx && typeof Chart !== 'undefined') {
        new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: emiOptions.map(option => `${option.year} Year${option.year > 1 ? 's' : ''}`),
                datasets: [{
                    label: 'Monthly EMI (₹)',
                    data: emiOptions.map(option => option.emi),
                    backgroundColor: ['#3AAFA9', '#2B7A78', '#DEF2F1'],
                    borderColor: ['#2B7A78', '#1B4F4D', '#B2E4E1'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'EMI Amount (₹)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '₹' + value.toLocaleString('en-IN');
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Tenure'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true
                    }
                }
            }
        });
    } else {
        console.error('Chart.js not loaded or canvas "emiChart" not found.');
    }
}

function initiatePayment() {
    const formData = JSON.parse(sessionStorage.getItem('formData'));
    if (!formData) {
        console.error('No formData found for payment initiation.');
        alert('No application data found. Please submit the form again.');
        window.location.href = 'index.html#loan-form';
        return;
    }

    const { name, email, phone, total } = formData;
    if (!name || !email || !phone || !total || isNaN(total)) {
        console.error('Invalid payment data:', { name, email, phone, total });
        alert('Invalid payment data. Please submit the form again.');
        window.location.href = 'index.html#loan-form';
        return;
    }

    const amountInPaise = Math.round(total * 100);
    const successUrl = encodeURIComponent(`https://creditmasterfinancialservices.web.app/success.html?email=${encodeURIComponent(email)}`);
    const paymentLink = `${RAZORPAY_PAYMENT_LINK}?amount=${amountInPaise}&prefill[name]=${encodeURIComponent(name)}&prefill[contact]=${encodeURIComponent(phone)}&prefill[email]=${encodeURIComponent(email)}&callback_url=${successUrl}`;
    
    console.log('Initiating payment with URL:', paymentLink);
    try {
        // Attempt redirect with multiple methods for compatibility
        window.location.href = paymentLink;
        window.location.assign(paymentLink); // Fallback for some browsers
        // Provide fallback instructions in case redirect fails
        setTimeout(() => {
            alert(`Unable to redirect to payment page. Please manually visit this link to complete your payment: ${paymentLink}\nIf the issue persists, contact support at creditmaster500@gmail.com.`);
        }, 2000); // Delay to allow redirect to attempt first
    } catch (error) {
        console.error('Payment redirect failed:', error);
        alert(`Failed to redirect to payment page. Please manually visit this link to complete your payment: ${paymentLink}\nIf the issue persists, contact support at creditmaster500@gmail.com.`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        populateOfferPage();
    } catch (error) {
        console.error('Error in populateOfferPage:', error);
        alert('Error loading offer page. Please try again or contact support at creditmaster500@gmail.com.');
        window.location.href = 'index.html#loan-form';
    }
});