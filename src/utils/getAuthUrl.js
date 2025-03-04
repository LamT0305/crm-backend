import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

console.log("Using Redirect URI:", process.env.GOOGLE_CALLBACK_URL); // Debug

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL // Đảm bảo biến này có giá trị hợp lệ
);

console.log(
  oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["profile", "email", "https://www.googleapis.com/auth/gmail.send"],
  })
);
