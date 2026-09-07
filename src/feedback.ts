/**
 * Feedback goes to a Google Form you own. Create a form with three
 * short-answer questions (Message, Contact, Context), open its prefilled
 * link, and copy the entry IDs here. Leave FORM_ID empty to hide the form.
 */
export const FEEDBACK = {
  FORM_ID: "",
  ENTRY_MESSAGE: "",
  ENTRY_CONTACT: "",
  ENTRY_CONTEXT: "",
};

export const feedbackConfigured = () => Boolean(FEEDBACK.FORM_ID && FEEDBACK.ENTRY_MESSAGE);

/** Posts to the form's response endpoint. Resolves true unless the network call itself fails. */
export async function sendFeedback(message: string, contact: string, context: string) {
  const body = new URLSearchParams();
  body.set(FEEDBACK.ENTRY_MESSAGE, message);
  if (FEEDBACK.ENTRY_CONTACT) body.set(FEEDBACK.ENTRY_CONTACT, contact);
  if (FEEDBACK.ENTRY_CONTEXT) body.set(FEEDBACK.ENTRY_CONTEXT, context);
  try {
    await fetch(`https://docs.google.com/forms/d/e/${FEEDBACK.FORM_ID}/formResponse`, { method: "POST", mode: "no-cors", body });
    return true;
  } catch {
    return false;
  }
}
