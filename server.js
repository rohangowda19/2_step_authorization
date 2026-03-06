require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const mongoose   = require('mongoose');
const nodemailer = require('nodemailer');
const User       = require('./models/User');

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' }));
app.use(express.static('frontend'));


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err.message));


const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false }
});

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Gmail not connected:', error.message);
    console.log('⚠️  OTP will only show in terminal');
  } else {
    console.log('✅ Gmail connected! OTP will be sent to email');
  }
});

async function sendOTPEmail(email, otp) {
  await transporter.sendMail({
    from: `"MyApp Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 Your verification code',
    html: `
      <div style="font-family:sans-serif; max-width:400px; margin:auto; padding:32px; background:#f9f9f9; border-radius:12px;">
        <h2 style="color:#ff3cac;">Your verification code</h2>
        <p style="color:#555;">Use this code to complete sign-in. Expires in <strong>5 minutes</strong>.</p>
        <div style="font-size:36px; font-weight:bold; letter-spacing:12px; color:#ff7e5f; margin:24px 0;">
          ${otp}
        </div>
        <p style="color:#999; font-size:12px;">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
}



const otpStore = {};

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function printOTP(email, otp) {
  console.log('\n' + '='.repeat(40));
  console.log(`  OTP for ${email}`);
  console.log(`  Code: ${otp}`);
  console.log(`  Expires in 5 minutes`);
  console.log('='.repeat(40) + '\n');
}



app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered. Please login.' });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    console.log(`\n✅ New user signed up: ${name} (${email})\n`);
    return res.json({ success: true, message: 'Account created! Please login.' });

  } catch (err) {
    console.error('Signup error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Try again.' });
  }
});


app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'No account found. Please sign up.' });
    }

    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    const otp = generateOTP();
    otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

    
    printOTP(email, otp);

  
    try {
      await sendOTPEmail(email, otp);
      console.log(`📧 OTP email sent to ${email}`);
      return res.json({ success: true, message: 'OTP sent to your email!' });
    } catch (emailErr) {
      console.log(`⚠️  Email failed: ${emailErr.message}`);
      console.log(`👆 Use the OTP printed above`);
      return res.json({ success: true, message: 'OTP generated! Check your email or terminal.' });
    }

  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Try again.' });
  }
});

app.post('/api/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
  }

  const record = otpStore[email];

  if (!record) {
    return res.status(400).json({ success: false, message: 'No OTP found. Please login again.' });
  }
  if (Date.now() > record.expiresAt) {
    delete otpStore[email];
    return res.status(400).json({ success: false, message: 'OTP expired. Please login again.' });
  }
  if (otp !== record.otp) {
    return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
  }

  delete otpStore[email];
  console.log(`\n✅ ${email} successfully logged in!\n`);
  return res.json({ success: true, message: 'Login successful!' });
});


// ════════════════════════════════
//  ROUTE 4 — POST /api/resend-otp
// ════════════════════════════════
app.post('/api/resend-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  const otp = generateOTP();
  otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

  printOTP(email, otp);

  try {
    await sendOTPEmail(email, otp);
    console.log(`📧 OTP email resent to ${email}`);
    return res.json({ success: true, message: 'New OTP sent to your email!' });
  } catch (emailErr) {
    console.log(`⚠️  Email failed: ${emailErr.message}`);
    return res.json({ success: true, message: 'New OTP generated! Check terminal.' });
  }
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});