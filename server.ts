import express from 'express';
declare const Deno: any;
import cors from 'cors';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const port = 3000;

// Initialize Supabase Admin Client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
// User explicitly requested Deno.env.get usage
const supabaseServiceKey = (typeof Deno !== 'undefined') ? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") : process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin: any = null;

if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
} else {
  console.warn("WARNING: SUPABASE_SERVICE_ROLE_KEY is missing. Login will generate a token but actual session creation might fail if strict security is on.");
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// In-memory OTP storage
// Map<email, { code, expiresAt }>
const otpStore = new Map<string, { code: string; expiresAt: string }>();

app.post('/api/send-login-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const code = generateOTP();
    const expiresFor = 15; // 15 minutes
    const expiresAt = new Date(Date.now() + expiresFor * 60 * 1000).toISOString();

    // Store in Memory
    otpStore.set(email, { code, expiresAt });
    console.log(`Stored OTP for ${email}: ${code}`); // Debug log

    // Send Email
    const mailOptions = {
      from: process.env.SMTP_FROM || '"TaskAI" <no-reply@taskai.app>',
      to: email,
      subject: "TaskAI Login Verification Code",
      text: `Your login verification code is: ${code}. It expires in 15 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Login Verification</h2>
          <p>You requested to log in to TaskAI.</p>
          <p>Your One-Time Password (OTP) is:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 8px;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px;">${code}</span>
          </div>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "OTP sent successfully" });

  } catch (error: any) {
    console.error("Send OTP Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/verify-login-otp', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: "Email and code are required" });

    // Verify OTP from Memory
    const record = otpStore.get(email);

    if (!record) {
      return res.status(400).json({ error: "No OTP found for this email" });
    }

    const { code: storedCode, expiresAt } = record;

    if (storedCode !== code) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (new Date(expiresAt) < new Date()) {
      otpStore.delete(email);
      return res.status(400).json({ error: "OTP expired" });
    }

    // OTP is valid!
    // Cleanup
    otpStore.delete(email);

    // If we have Admin access, generate a token
    if (supabaseAdmin) {
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
      });

      if (linkError) throw linkError;

      const actionLink = linkData.properties.action_link;
      const url = new URL(actionLink);
      const token = url.searchParams.get("token");

      if (!token) throw new Error("Failed to generate token");

      return res.json({ token });
    } else {
      // Fallback for demo/testing without Service Key:
      // We cannot log them in for real without the key.
      return res.status(500).json({ error: "Server missing Service Role Key. Cannot generate session." });
    }

  } catch (error: any) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
