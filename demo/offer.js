const RAZORPAY_KEY_ID = "rzp_test_R764bsWmz2bMol"; // Your Razorpay Key ID (public)

function toggleMenu() {
    const menu = document.getElementById('nav-menu');
    menu.classList.toggle('active');
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        window.location.href = this.getAttribute('href');
    });
});

function calculateEMI(principal, annualRate, years) {
    const monthlyRate = annualRate / 12;
    const months = years * 12;
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
    return emi.toFixed(2);
}

function populateOfferPage() {
    // Retrieve data from sessionStorage
    const formData = JSON.parse(sessionStorage.getItem('formData'));
    if (!formData) {
        alert('No application data found. Please submit the form again.');
        window.location.href = 'index.html#loan-form';
        return;
    }

    const { name, email, phone, city, state, financialAmount, occupation, fee, gst, total } = formData;

    // Populate applicant details
    document.getElementById('loan-amount').textContent = Number(financialAmount).toLocaleString('en-IN');
    document.getElementById('fee-amount').textContent = fee;
    document.getElementById('base-fee').textContent = fee;
    document.getElementById('gst-amount').textContent = gst.toFixed(2);
    document.getElementById('total-amount').textContent = total;
    document.getElementById('app-loan-amount').textContent = Number(financialAmount).toLocaleString('en-IN');
    document.getElementById('app-name').textContent = name;
    document.getElementById('app-phone').textContent = phone;
    document.getElementById('app-email').textContent = email;
    document.getElementById('app-city').textContent = city;
    document.getElementById('app-state').textContent = state;
    document.getElementById('app-occupation').textContent = occupation;

    // Calculate EMI options for 1, 2, and 3 years
    const principal = parseFloat(financialAmount);
    const annualRate = 0.12;
    const tenures = [1, 2, 3];
    const emiOptions = tenures.map(year => ({
        year,
        emi: calculateEMI(principal, annualRate, year)
    }));

    // Populate EMI options
    const emiOptionsDiv = document.getElementById('emi-options');
    emiOptionsDiv.innerHTML = '';
    emiOptions.forEach(option => {
        emiOptionsDiv.innerHTML += `
            <label>
                <input type="radio" name="tenure" value="${option.year}"> 
                ${option.year} Year${option.year > 1 ? 's' : ''} (${option.year * 12} Months) => Rs.${option.emi}
            </label><br>
        `;
    });

    // Create EMI chart
    const ctx = document.getElementById('emiChart').getContext('2d');
    new Chart(ctx, {
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
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'EMI Amount (₹)'
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
}

function initiatePayment() {
    const formData = JSON.parse(sessionStorage.getItem('formData'));
    const total = formData.total;

    const scriptUrl = 'https://script.google.com/macros/s/AKfycbx1LsIHJYmrGy1xAVE0HNZpfyt296CUoRltgZLD-ndBDpInxOcEW47wKCXsV1S0rge1aA/exec';

    fetch(`${scriptUrl}?type=createOrder&amount=${total}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                var options = {
                    "key": RAZORPAY_KEY_ID,
                    "amount": total * 100,
                    "currency": "INR",
                    "name": "Credit Master",
                    "description": "Loan Application Processing Fee",
                    "order_id": data.order_id,
                    "handler": function (response) {
                        alert('Payment Successful! Payment ID: ' + response.razorpay_payment_id);
                        sessionStorage.removeItem('formData'); // Clear data after payment
                        window.location.href = 'index.html#home';
                    },
                    "theme": { "color": "#3AAFA9" }
                };
                var rzp1 = new Razorpay(options);
                rzp1.open();
            } else {
                alert('Error creating order: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error creating order:', error);
            alert('Error initiating payment. Please try again.');
        });
}

// Initialize the page
populateOfferPage();