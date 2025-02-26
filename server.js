import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { google } from "googleapis";
dotenv.config(); // Load environment variables

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT||5000;

// Middleware
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  cors({
    origin: "https://accredian-frontend-task-d09svinyy.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// Utility function to hash emails
async function hashEmails(referrer_email, referee_email) {
  try {
    const salt = await bcrypt.genSalt(10);
    const [hashedReferrerEmail, hashedRefereeEmail] = await Promise.all([
      bcrypt.hash(referrer_email, salt),
      bcrypt.hash(referee_email, salt),
    ]);
    return { hashedReferrerEmail, hashedRefereeEmail };
  } catch (error) {
    throw new Error("Error hashing emails");
  }
}

// Mail Setup

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

async function sendMail(from, to, referee_name, referrer_name, course_name) {
  try {
    const accessToken = await oAuth2Client.getAccessToken();
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.USER,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });
    const mailOptions = {
      from: `"accredian." ${from}`,
      to: to,
      subject: "Highly Recommended Course for You!",
      text: `Dear ${referee_name},
    
      I hope you're doing well! I recently came across an amazing course, and I thought you might find it valuable. 
    
      Best Regards,  
      ${referrer_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto;">
          <div style="background-color: #2563eb; color: white; padding: 15px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="margin: 0; font-size: 22px;">📚 Recommended Course for You!</h2>
          </div>
          <div style="padding: 20px;">
            <p style="font-size: 16px; color: #333;">Dear ${referee_name},</p>
            <p style="font-size: 16px; color: #4b5563;">
              I recently came across an amazing course and thought you might find it valuable.
            </p>
            <div style="background-color: #e5e7eb; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p><strong>📌 Course Name: </strong>${course_name}</p>
              <p><strong>🎓 Platform: </strong>accredian</p>
            </div>
            <p style="font-size: 16px; color: #4b5563;">
              Why You Should Check It Out: <br>
              Ever wanted to build killer web apps and make them smarter than your ex? 🚀 This course teaches you full-stack magic with AI, so your projects can finally have some intelligence (unlike that one group project member 😆). Give it a shot!
            </p>
            <p style="font-size: 16px; color: #4b5563;">
              Let me know if you decide to take it or if you have any questions!
            </p>
            <p style="font-size: 16px; color: #333;"><strong>Best Regards,</strong><br>${referrer_name}</p>
          </div>
        </div>
      `,
    };

    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (error) {
    return error;
  }
}

// POST: Handle referral form submission
app.post("/submit-form", async (req, res) => {
  try {
    const {
      referrer_name,
      referrer_email,
      referee_name,
      referee_email,
      course_name,
    } = req.body;

    // Validation: Ensure all required fields are provided
    if (
      !referrer_name ||
      !referrer_email ||
      !referee_email ||
      !referee_name ||
      !course_name
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Hash emails before storing in the database
    const { hashedReferrerEmail, hashedRefereeEmail } = await hashEmails(
      referrer_email,
      referee_email
    );

    // Save referral data to database using Prisma
    const newReferral = await prisma.referral.create({
      data: {
        referrer_name,
        referrer_email: hashedReferrerEmail,
        referee_name,
        referee_email: hashedRefereeEmail,
        course_name,
      },
    });

    //  Mail Sending code
    sendMail(
      referrer_email,
      referee_email,
      referee_name,
      referrer_name,
      course_name
    );
    return res.status(201).json({
      message: "Form submitted successfully, emails sent",
      referral: newReferral,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Close Prisma connection on server shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
app.listen(PORT);
