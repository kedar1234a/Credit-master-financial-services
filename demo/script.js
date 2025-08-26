let isEmailVerified = false;
const RAZORPAY_KEY_ID = "rzp_test_R764bsWmz2bMol"; // Your Razorpay Key ID (public)

function toggleMenu() {
    const menu = document.getElementById('nav-menu');
    menu.classList.toggle('active');
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
        document.getElementById('nav-menu').classList.remove('active');
    });
});

function validateName(name) {
    const nameParts = name.trim().split(/\s+/);
    return nameParts.length >= 2 && nameParts.every(part => /^[a-zA-Z]+$/.test(part));
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
    return /^\d{10}$/.test(phone);
}

function sendOTP() {
    const email = document.getElementById('email').value;
    if (!validateEmail(email)) {
        alert('Please enter a valid email address.');
        return;
    }

    document.getElementById('send-otp').disabled = true;
    document.getElementById('send-otp').textContent = 'Sending OTP...';

    const scriptUrl = 'https://script.google.com/macros/s/AKfycbx1LsIHJYmrGy1xAVE0HNZpfyt296CUoRltgZLD-ndBDpInxOcEW47wKCXsV1S0rge1aA/exec'; // Ensure this is the correct deployed URL

    fetch(`${scriptUrl}?type=sendOTP&email=${encodeURIComponent(email)}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert('OTP sent to ' + email + '. Please check your email.');
                document.getElementById('otp-section').classList.add('active');
            } else {
                alert('Error: ' + data.message);
            }
            document.getElementById('send-otp').textContent = 'Send OTP';
            document.getElementById('send-otp').disabled = false;
        })
        .catch(error => {
            console.error('Error sending OTP:', error);
            alert('Error sending OTP. Please try again. Ensure the Google Apps Script URL is correct and deployed.');
            document.getElementById('send-otp').disabled = false;
            document.getElementById('send-otp').textContent = 'Send OTP';
        });
}

function verifyOTP() {
    const email = document.getElementById('email').value;
    const otp = document.getElementById('otp').value;

    if (!otp) {
        alert('Please enter the OTP.');
        return;
    }

    const scriptUrl = 'https://script.google.com/macros/s/AKfycbx1LsIHJYmrGy1xAVE0HNZpfyt296CUoRltgZLD-ndBDpInxOcEW47wKCXsV1S0rge1aA/exec';

    fetch(`${scriptUrl}?type=verifyOTP&email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert('Email verified successfully!');
                isEmailVerified = true;
                document.getElementById('submit-form').disabled = false;
                document.getElementById('otp-section').classList.remove('active');
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error verifying OTP:', error);
            alert('Invalid OTP or error verifying. Please try again.');
        });
}

function submitForm() {
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;
    const financialAmount = document.getElementById('financial-amount').value;
    const occupation = document.getElementById('occupation').value;

    if (!name || !email || !phone || !city || !state || !financialAmount || !occupation) {
        alert('Please fill all fields.');
        return;
    }

    if (!validateName(name)) {
        alert('Please enter a valid full name (first and last name, letters only).');
        return;
    }

    if (!validateEmail(email)) {
        alert('Please enter a valid email address.');
        return;
    }

    if (!validatePhone(phone)) {
        alert('Please enter a valid 10-digit phone number.');
        return;
    }

    if (!isEmailVerified) {
        alert('Please verify your email with OTP.');
        return;
    }

    const principal = parseFloat(financialAmount);
    const possibleFees = [199, 299];
    const fee = possibleFees[Math.floor(Math.random() * possibleFees.length)];
    const gst = fee * 0.18;
    const total = Math.round(fee + gst);

    // Store form data in sessionStorage
    const formData = {
        name,
        email,
        phone,
        city,
        state,
        financialAmount,
        occupation,
        fee,
        gst,
        total
    };
    sessionStorage.setItem('formData', JSON.stringify(formData));

    // Redirect to offer page
    window.location.href = 'offer.html';
}
function initiatePayment(processingFee) {
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbx1LsIHJYmrGy1xAVE0HNZpfyt296CUoRltgZLD-ndBDpInxOcEW47wKCXsV1S0rge1aA/exec';

    fetch(`${scriptUrl}?type=createOrder&amount=${processingFee}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                var options = {
                    "key": RAZORPAY_KEY_ID,
                    "amount": processingFee * 100,
                    "currency": "INR",
                    "name": "Credit Master",
                    "description": "Loan Application Processing Fee",
                    "order_id": data.order_id,
                    "handler": function (response) {
                        alert('Payment Successful! Payment ID: ' + response.razorpay_payment_id);
                        // Additional submission logic can be added here
                    },
                    "theme": { "color": "#003087" }
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
