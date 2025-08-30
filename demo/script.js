let isEmailVerified = false;

function toggleMenu() {
    const menu = document.getElementById('nav-menu');
    menu.classList.toggle('active');
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
            document.getElementById('nav-menu').classList.remove('active');
        }
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

    const scriptUrl = 'https://script.google.com/macros/s/AKfycbywsq0q210Jffw0rifS_jTHy3Z0KuIF5emRJvJzmGWsWsdBXvgNoNAFXVvdvFYz8bqbfg/exec';
    const params = new URLSearchParams({ type: 'sendOTP', email });

    fetch(`${scriptUrl}?${params.toString()}`, {
        method: 'GET',
        redirect: 'follow'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                alert('OTP sent to ' + email + '. Please check your email.');
                document.getElementById('otp-section').style.display = 'block';
            } else {
                alert('Error: ' + (data.message || 'Failed to send OTP. Please try again.'));
            }
            document.getElementById('send-otp').textContent = 'Send OTP';
            document.getElementById('send-otp').disabled = false;
        })
        .catch(error => {
            console.error('Error sending OTP:', error);
            alert('Error sending OTP: ' + error.message + '. Please try again or contact support at creditmaster500@gmail.com.');
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

    const scriptUrl = 'https://script.google.com/macros/s/AKfycbywsq0q210Jffw0rifS_jTHy3Z0KuIF5emRJvJzmGWsWsdBXvgNoNAFXVvdvFYz8bqbfg/exec';
    const params = new URLSearchParams({ type: 'verifyOTP', email, otp });

    fetch(`${scriptUrl}?${params.toString()}`, {
        method: 'GET',
        redirect: 'follow'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                alert('Email verified successfully!');
                isEmailVerified = true;
                document.getElementById('submit-form').disabled = false;
                document.getElementById('otp-section').style.display = 'none';
            } else {
                alert('Error: ' + (data.message || 'Failed to verify OTP. Please try again.'));
            }
        })
        .catch(error => {
            console.error('Error verifying OTP:', error);
            alert('Invalid OTP or error verifying: ' + error.message + '. Please try again.');
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
    if (isNaN(principal) || principal < 1000) {
        alert('Please enter a valid financial amount (minimum ₹1000).');
        return;
    }

    const possibleFees = [199, 299];
    const fee = possibleFees[Math.floor(Math.random() * possibleFees.length)];
    const total = fee; // GST removed, total is now equal to fee
    const paymentLink = fee === 199 ? 'https://rzp.io/rzp/lYv5npxS' : 'https://rzp.io/rzp/6j5lhygd';

    const formData = {
        type: 'formSubmission',
        timestamp: new Date().toISOString(),
        name,
        email,
        phone,
        city,
        state,
        financialAmount,
        occupation,
        processingFee: total,
        paymentLink
    };

    const scriptUrl = 'https://script.google.com/macros/s/AKfycbywsq0q210Jffw0rifS_jTHy3Z0KuIF5emRJvJzmGWsWsdBXvgNoNAFXVvdvFYz8bqbfg/exec';
    const params = new URLSearchParams(formData);

    fetch(`${scriptUrl}?${params.toString()}`, {
        method: 'GET',
        redirect: 'follow'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Response from server:', data);
            if (data.status === 'success') {
                sessionStorage.setItem('formData', JSON.stringify({
                    name,
                    email,
                    phone,
                    city,
                    state,
                    financialAmount,
                    occupation,
                    fee,
                    total,
                    paymentLink
                }));
                window.location.href = 'offer.html';
            } else {
                alert('Error: ' + (data.message || 'Failed to save form data. Please try again.'));
            }
        })
        .catch(error => {
            console.error('Error saving to Google Sheets:', error);
            alert('Error saving form data: ' + error.message + '. Please try again or contact support at creditmaster500@gmail.com.');
        });
}