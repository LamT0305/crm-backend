export const listRecentInboxMessages = async (gmail, max = 10) => {
  try {
    const result = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["INBOX"],
      maxResults: max,
    });

    return result.data.messages || [];
  } catch (err) {
    console.error("❌ Error fetching recent inbox messages:", err);
    return [];
  }
};
