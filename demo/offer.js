const RAZORPAY_PAYMENT_LINK = 'https://razorpay.me/@creditmaster';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx1LsIHJYmrGy1xAVE0HNZpfyt296CUoRltgZLD-ndBDpInxOcEW47wKCXsV1S0rge1aA/exec';

// Toggle mobile menu
function toggleMenu() {
    const menu = document.getElementById('nav-menu');
    menu.classList.toggle('active');
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        } else {
            window.location.href = this.getAttribute('href');
        }
    });
});

// Calculate EMI
function calculateEMI(principal, annualRate, years) {
    const monthlyRate = annualRate / 12 / 100;
    const months = years * 12;
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
    return isFinite(emi) ? emi.toFixed(2) : 0;
}

// Populate offer page
function populateOfferPage() {
    const formData = JSON.parse(sessionStorage.getItem('formData'));
    if (!formData) {
        alert('No application data found. Please submit the form again.');
        window.location.href = 'index.html#loan-form';
        return;
    }

    const { name, email, phone, city, state, financialAmount, occupation, fee, gst, total } = formData;

    document.getElementById('loan-amount').textContent = Number(financialAmount).toLocaleString('en-IN');
    document.getElementById('fee-amount').textContent = Number(fee).toLocaleString('en-IN');
    document.getElementById('base-fee').textContent = Number(fee).toLocaleString('en-IN');
    document.getElementById('gst-amount').textContent = Number(gst).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    document.getElementById('total-amount').textContent = Number(total).toLocaleString('en-IN');
    document.getElementById('app-loan-amount').textContent = Number(financialAmount).toLocaleString('en-IN');
    document.getElementById('app-name').textContent = name || 'N/A';
    document.getElementById('app-phone').textContent = phone || 'N/A';
    document.getElementById('app-email').textContent = email || 'N/A';
    document.getElementById('app-city').textContent = city || 'N/A';
    document.getElementById('app-state').textContent = state || 'N/A';
    document.getElementById('app-occupation').textContent = occupation || 'N/A';

    const principal = parseFloat(financialAmount);
    const annualRate = 0.12;
    const tenures = [1, 2, 3];
    const emiOptions = tenures.map(year => ({
        year,
        emi: calculateEMI(principal, annualRate, year)
    }));

    const emiOptionsDiv = document.getElementById('emi-options');
    emiOptionsDiv.innerHTML = '';
    emiOptions.forEach(option => {
        emiOptionsDiv.innerHTML += `
            <label>
                <input type="radio" name="tenure" value="${option.year}"> 
                ${option.year} Year${option.year > 1 ? 's' : ''} (${option.year * 12} Months) => Rs.${Number(option.emi).toLocaleString('en-IN')}
            </label><br>
        `;
    });

    // EMI chart (unchanged)
    const ctx = document.getElementById('emiChart');
    if (ctx) {
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
        console.error('Canvas element with ID "emiChart" not found.');
    }
}

// Initiate payment with Razorpay link
function initiatePayment() {
    const formData = JSON.parse(sessionStorage.getItem('formData'));
    if (!formData) {
        alert('No application data found. Please submit the form again.');
        window.location.href = 'index.html#loan-form';
        return;
    }

    const { name, email, phone, total } = formData;
    const successUrl = encodeURIComponent('https://yourdomain.com/success.html'); // Replace with your live URL
    const paymentLink = `${RAZORPAY_PAYMENT_LINK}?amount=${total * 100}&prefill[name]=${encodeURIComponent(name)}&prefill[email]=${encodeURIComponent(email)}&prefill[contact]=${encodeURIComponent(phone)}&callback_url=${successUrl}`;
    try {
        window.location.href = paymentLink;
    } catch (error) {
        console.error('Payment initiation failed:', error);
        alert('Failed to initiate payment. Please try again or contact support.');
    }
}
// Ensure DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    populateOfferPage();
});