
const API = 'http://localhost:3000/api';

const loginCard      = document.getElementById('loginCard');
const loginForm      = document.getElementById('loginForm');
const emailInput     = document.getElementById('email');
const passwordInput  = document.getElementById('password');
const eyeBtn         = document.getElementById('eyeBtn');
const errorBox       = document.getElementById('errorBox');
const loginBtn       = document.getElementById('loginBtn');
const goToSignup     = document.getElementById('goToSignup');


const signupCard         = document.getElementById('signupCard');
const signupForm         = document.getElementById('signupForm');
const signupName         = document.getElementById('signupName');
const signupEmail        = document.getElementById('signupEmail');
const signupPassword     = document.getElementById('signupPassword');
const signupConfirm      = document.getElementById('signupConfirm');
const eyeBtnSignup       = document.getElementById('eyeBtnSignup');
const eyeBtnConfirm      = document.getElementById('eyeBtnConfirm');
const signupErrorBox     = document.getElementById('signupErrorBox');
const signupSuccessBox   = document.getElementById('signupSuccessBox');
const signupBtn          = document.getElementById('signupBtn');
const goToLogin          = document.getElementById('goToLogin');


const otpCard      = document.getElementById('otpCard');
const otpForm      = document.getElementById('otpForm');
const otpInputs    = document.querySelectorAll('.otp-input');
const otpErrorBox  = document.getElementById('otpErrorBox');
const verifyBtn    = document.getElementById('verifyBtn');
const resendBtn    = document.getElementById('resendBtn');
const backBtn      = document.getElementById('backBtn');
const sentTo       = document.getElementById('sentTo');


const successCard  = document.getElementById('successCard');
const signOutBtn   = document.getElementById('signOutBtn');

let currentEmail   = '';
let countdownTimer = null;



function showScreen(screen) {
  [loginCard, signupCard, otpCard, successCard].forEach(s => s.classList.add('hidden'));
  screen.classList.remove('hidden');
}



function showError(box, message) {
  box.textContent = '⚠️  ' + message;
  box.classList.add('show');
}

function showSuccess(box, message) {
  box.textContent = '✅  ' + message;
  box.classList.add('show');
}

function hideMsg(box) {
  box.classList.remove('show');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

eyeBtn.addEventListener('click', () => {
  const isHidden = passwordInput.type === 'password';
  passwordInput.type = isHidden ? 'text' : 'password';
  eyeBtn.textContent = isHidden ? '🙈' : '👁️';
});

eyeBtnSignup.addEventListener('click', () => {
  const isHidden = signupPassword.type === 'password';
  signupPassword.type = isHidden ? 'text' : 'password';
  eyeBtnSignup.textContent = isHidden ? '🙈' : '👁️';
});

eyeBtnConfirm.addEventListener('click', () => {
  const isHidden = signupConfirm.type === 'password';
  signupConfirm.type = isHidden ? 'text' : 'password';
  eyeBtnConfirm.textContent = isHidden ? '🙈' : '👁️';
});


goToSignup.addEventListener('click', (e) => {
  e.preventDefault();
  hideMsg(errorBox);
  showScreen(signupCard);
});

goToLogin.addEventListener('click', (e) => {
  e.preventDefault();
  hideMsg(signupErrorBox);
  hideMsg(signupSuccessBox);
  showScreen(loginCard);
});


[signupName, signupEmail, signupPassword, signupConfirm].forEach(input => {
  input.addEventListener('input', () => {
    input.classList.remove('error');
    hideMsg(signupErrorBox);
    hideMsg(signupSuccessBox);
  });
});



signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name     = signupName.value.trim();
  const email    = signupEmail.value.trim();
  const password = signupPassword.value.trim();
  const confirm  = signupConfirm.value.trim();

  if (!name) {
    signupName.classList.add('error');
    return showError(signupErrorBox, 'Full name is required.');
  }
  if (!email) {
    signupEmail.classList.add('error');
    return showError(signupErrorBox, 'Email address is required.');
  }
  if (!isValidEmail(email)) {
    signupEmail.classList.add('error');
    return showError(signupErrorBox, 'Please enter a valid email address.');
  }
  if (!password) {
    signupPassword.classList.add('error');
    return showError(signupErrorBox, 'Password is required.');
  }
  if (password.length < 6) {
    signupPassword.classList.add('error');
    return showError(signupErrorBox, 'Password must be at least 6 characters.');
  }
  if (password !== confirm) {
    signupConfirm.classList.add('error');
    return showError(signupErrorBox, 'Passwords do not match.');
  }

 
  signupBtn.textContent = 'Creating account…';
  signupBtn.disabled = true;

  try {
    const res  = await fetch(`${API}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();

    if (data.success) {
     
      showSuccess(signupSuccessBox, 'Account created! Redirecting to login…');
      signupForm.reset();
      setTimeout(() => {
        hideMsg(signupSuccessBox);
        showScreen(loginCard);
      }, 2000);
    } else {
      showError(signupErrorBox, data.message);
    }
  } catch (err) {
    showError(signupErrorBox, 'Cannot reach server. Is it running?');
  }

  signupBtn.textContent = 'Create Account →';
  signupBtn.disabled = false;
});



emailInput.addEventListener('input', () => {
  emailInput.classList.remove('error');
  hideMsg(errorBox);
});
passwordInput.addEventListener('input', () => {
  passwordInput.classList.remove('error');
  hideMsg(errorBox);
});



loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email    = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email) {
    emailInput.classList.add('error');
    return showError(errorBox, 'Email address is required.');
  }
  if (!isValidEmail(email)) {
    emailInput.classList.add('error');
    return showError(errorBox, 'Please enter a valid email address.');
  }
  if (!password) {
    passwordInput.classList.add('error');
    return showError(errorBox, 'Password is required.');
  }
  if (password.length < 6) {
    passwordInput.classList.add('error');
    return showError(errorBox, 'Password must be at least 6 characters.');
  }

  loginBtn.textContent = 'Sending code…';
  loginBtn.disabled = true;

  try {
    const res  = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (data.success) {
      currentEmail = email;
      sentTo.textContent = email;
      showScreen(otpCard);
      otpInputs[0].focus();
      startCountdown();
    } else {
      showError(errorBox, data.message);
    }
  } catch (err) {
    showError(errorBox, 'Cannot reach server. Is it running?');
  }

  loginBtn.textContent = 'Continue →';
  loginBtn.disabled = false;
});


otpInputs.forEach((input, index) => {
  input.addEventListener('keydown', (e) => {
    if (!/^\d$/.test(e.key) && !['Backspace','Tab','ArrowLeft','ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }
    if (e.key === 'Backspace') {
      if (input.value) {
        input.value = '';
        input.classList.remove('filled');
      } else if (index > 0) {
        otpInputs[index - 1].focus();
      }
      hideMsg(otpErrorBox);
      e.preventDefault();
    }
  });

  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '').slice(-1);
    if (input.value) {
      input.classList.add('filled');
      if (index < 5) otpInputs[index + 1].focus();
    } else {
      input.classList.remove('filled');
    }
    hideMsg(otpErrorBox);
  });
});

otpInputs[0].addEventListener('paste', (e) => {
  e.preventDefault();
  const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
  pasted.split('').forEach((digit, i) => {
    if (otpInputs[i]) {
      otpInputs[i].value = digit;
      otpInputs[i].classList.add('filled');
    }
  });
  if (pasted.length === 6) otpInputs[5].focus();
});



otpForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const code = Array.from(otpInputs).map(i => i.value).join('');

  if (code.length < 6) {
    return showError(otpErrorBox, 'Please enter the full 6-digit code.');
  }

  verifyBtn.textContent = 'Verifying…';
  verifyBtn.disabled = true;

  try {
    const res  = await fetch(`${API}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: currentEmail, otp: code }),
    });
    const data = await res.json();

    if (data.success) {
      clearInterval(countdownTimer);
      showScreen(successCard);
    } else {
      showError(otpErrorBox, data.message);
      otpInputs.forEach(i => { i.value = ''; i.classList.remove('filled'); });
      otpInputs[0].focus();
    }
  } catch (err) {
    showError(otpErrorBox, 'Cannot reach server. Is it running?');
  }

  verifyBtn.textContent = 'Verify Code →';
  verifyBtn.disabled = false;
});


function startCountdown() {
  let countdown = 30;
  resendBtn.disabled = true;
  resendBtn.textContent = `Resend in ${countdown}s`;

  countdownTimer = setInterval(() => {
    countdown--;
    resendBtn.textContent = `Resend in ${countdown}s`;
    if (countdown <= 0) {
      clearInterval(countdownTimer);
      resendBtn.disabled = false;
      resendBtn.textContent = 'Resend code';
    }
  }, 1000);
}

resendBtn.addEventListener('click', async () => {
  otpInputs.forEach(i => { i.value = ''; i.classList.remove('filled'); });
  hideMsg(otpErrorBox);
  resendBtn.disabled = true;

  try {
    const res  = await fetch(`${API}/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: currentEmail }),
    });
    const data = await res.json();
    if (!data.success) showError(otpErrorBox, data.message);
  } catch (err) {
    showError(otpErrorBox, 'Cannot reach server. Is it running?');
  }

  otpInputs[0].focus();
  startCountdown();
});



backBtn.addEventListener('click', () => {
  clearInterval(countdownTimer);
  otpInputs.forEach(i => { i.value = ''; i.classList.remove('filled'); });
  hideMsg(otpErrorBox);
  showScreen(loginCard);
});


signOutBtn.addEventListener('click', () => {
  emailInput.value = '';
  passwordInput.value = '';
  otpInputs.forEach(i => { i.value = ''; i.classList.remove('filled'); });
  hideMsg(errorBox);
  hideMsg(otpErrorBox);
  currentEmail = '';
  showScreen(loginCard);
});