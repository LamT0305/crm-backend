import { google } from "googleapis";
import dotenv from "dotenv";
import UserModel from "../model/UserModel.js";

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Hàm này sẽ được dùng trong controller sau khi user đăng nhập
export const setUserCredentials = (refreshToken) => {
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });
};

// Fetch stored refresh token, update access token
export const refreshAccessToken = async (userId) => {
  try {
    const user = await UserModel.findById(userId);

    if (!user || !user.refreshToken) {
      throw new Error("No refresh token found for user.");
    }

    // Set the stored refresh token
    oauth2Client.setCredentials({ refresh_token: user.refreshToken });

    // Refresh the access token
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);

    console.log("✅ Access token refreshed:", credentials.access_token);

    return credentials.access_token;
  } catch (error) {
    console.error("❌ Error refreshing access token:", error);
    throw error;
  }
};

export { oauth2Client };
