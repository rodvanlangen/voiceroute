// api.js — stuurt data naar Make.com webhooks

/**
 * Stuurt een POST-request naar de opgegeven webhook URL.
 * Make.com verwerkt de payload en zet hem door naar Todoist, Gmail etc.
 */
async function sendToDestination(route) {
  const settings = getSettings();
  const webhookUrl = settings.webhooks[route.dest];

  if (!webhookUrl) {
    throw new Error(`Geen webhook URL ingesteld voor "${route.label}". Ga naar Instellingen.`);
  }

  const appName = settings.appName || 'VoiceRoute';

  const payload = {
    destination: route.dest,
    type: route.type,        // 'task' of 'email'
    content: route.content,
    appName: appName,
    timestamp: new Date().toISOString()
  };

  // Voor e-mail: voeg subject toe  (formaat: "[AppNaam] eerste 60 tekens")
  if (route.type === 'email') {
    const shortContent = route.content.length > 60
      ? route.content.substring(0, 60).trimEnd() + '…'
      : route.content;
    payload.subject = `[${appName}] ${shortContent}`;
    payload.body = route.content;
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Webhook fout: HTTP ${response.status}`);
  }

  return payload;
}
