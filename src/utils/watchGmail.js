// utils/watchGmail.js or in your controller
import { google } from "googleapis";

export const watchUserInbox = async (user) => {
  const oAuth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oAuth2.setCredentials({
    access_token: user.accessToken,
    refresh_token: user.refreshToken,
  });

  const gmail = google.gmail({ version: "v1", auth: oAuth2 });

  await gmail.users.watch({
    userId: "me",
    requestBody: {
      topicName: "projects/crmproject-452616/topics/gmail-notifications",
      labelIds: ["INBOX"],
      labelFilterAction: "include",
    },
  });

  console.log(`✅ Gmail watch set up for ${user.email}`, res.data);
};
