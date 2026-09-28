// Placeholder for the future "What can we cook with what we have?" feature.
// Later: call an AI endpoint here with { pantry, filters, recipes } and return ranked recipe ids.
// Version 1 makes no network calls.
export const AI_ENABLED = false;
export async function suggestFromPantry(/* pantryText, filters */) {
  throw new Error('AI suggestions are not enabled in version 1.');
}
