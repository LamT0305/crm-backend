export const getEmailBody = (payload) => {
  if (!payload || !payload.parts) return "No message body found";

  let body = "";

  // Loop through the parts to find the text/plain or text/html content
  for (const part of payload.parts) {
    if (part.mimeType === "text/plain" || part.mimeType === "text/html") {
      body = Buffer.from(part.body.data, "base64").toString("utf-8");
      break; // Stop once we find the first body content
    }

    // If body is in nested parts
    if (part.parts) {
      body = getEmailBody(part);
      if (body) break;
    }
  }

  return body || "No message content available";
};

