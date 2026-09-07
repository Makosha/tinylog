/**
 * Feedback goes to a Google Form ("TinyLog Feedback"). The app posts to the
 * form's response endpoint in the background; replies land in the linked
 * Google Sheet. Leave FORM_ID empty to hide the box.
 */
export const FEEDBACK = {
  FORM_ID: "1FAIpQLSciwi9dX9zHfrgXHa-69EuGZeEGGAqlus6GOG-8KtCNncaa9w",
  ENTRY_MESSAGE: "entry.1851542963",
  ENTRY_CONTACT: "entry.819592422",
};

export const feedbackConfigured = () => Boolean(FEEDBACK.FORM_ID && FEEDBACK.ENTRY_MESSAGE);

/** Posts to the form. The form has no context field, so context is appended to the message. */
export async function sendFeedback(message: string, contact: string, context: string) {
  const body = new URLSearchParams();
  body.set(FEEDBACK.ENTRY_MESSAGE, context ? `${message}\n\n— ${context}` : message);
  body.set(FEEDBACK.ENTRY_CONTACT, contact);
  try {
    await fetch(`https://docs.google.com/forms/d/e/${FEEDBACK.FORM_ID}/formResponse`, { method: "POST", mode: "no-cors", body });
    return true;
  } catch {
    return false;
  }
}
