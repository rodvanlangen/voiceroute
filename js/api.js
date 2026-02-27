// api.js — stuurt data naar één centrale AI-webhook (Make.com)

/**
 * Stuurt de gesproken tekst naar de AI-webhook.
 * Make.com + AI bepaalt zelf de bestemming en actie.
 * Optioneel: Make.com stuurt JSON terug met { label, color } van de gekozen bestemming.
 */
async function sendToDestination(content) {
  const settings  = getSettings();
  const webhookUrl = settings.aiWebhook;

  if (!webhookUrl) {
    throw new Error('Geen AI webhook URL ingesteld. Ga naar Instellingen.');
  }

  const payload = {
    content:   content,
    appName:   settings.appName || 'VoiceRoute',
    timestamp: new Date().toISOString()
  };

  const response = await fetch(webhookUrl, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Webhook fout: HTTP ${response.status}`);
  }

  // Make.com kan optioneel terugsturen welke bestemming de AI heeft gekozen:
  // { "label": "Werk Taken", "color": "#2563eb", "destination": "outlook-todo" }
  try {
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}
