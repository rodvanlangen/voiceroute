# VoiceRoute

Spreek in — stuur direct naar Todoist, Werk Taken (Outlook To Do), Gmail of Werk Mail.

## Hoe werkt het?

1. Open de app in **Chrome op je Android-telefoon**
2. Tik op de microfoon
3. Begin met een trefwoord, gevolgd door je bericht:
   - **"todoist** bel de tandarts morgen om 9 uur"
   - **"werk taak** offerte schrijven voor klant X"
   - **"gmail** link naar presentatie niet vergeten"
   - **"werk mail** vraag aan Jan over de vergadering van vrijdag"

Dat is alles. De app stuurt het bericht automatisch door — geen bevestiging, direct verzonden.

---

## Eenmalige installatie (±30 minuten)

### Stap 1 — Host de app op GitHub Pages (gratis)

1. Maak een account op [github.com](https://github.com) als je die nog niet hebt
2. Maak een nieuw **public** repository aan, bijv. `voiceroute`
3. Upload alle bestanden uit deze map naar dat repository
4. Ga naar **Settings → Pages → Source → Deploy from branch → main / root**
5. Je app is bereikbaar op `https://[jouw-gebruikersnaam].github.io/voiceroute`

> **Waarom HTTPS?** Spraakherkenning werkt alleen op beveiligde verbindingen.

---

### Stap 2 — Maak een gratis Make.com account

Ga naar [make.com](https://make.com) en maak een gratis account.
Het gratis plan geeft je 1.000 operaties per maand — ruim voldoende voor dagelijks gebruik.

---

### Stap 3 — Maak 4 scenario's in Make.com

Voor **elke** bestemming maak je één scenario. Hieronder staat hoe.

#### 3a. Todoist

1. Klik op **Create a new scenario**
2. Voeg toe: **Webhooks → Custom webhook** (klik op "Add" → kopieer de URL → klik OK)
3. Voeg toe: **Todoist → Create a Task**
   - Content: klik op het veld → kies `content` uit de webhook-data
   - Project: kies je inbox of een specifiek project
4. Klik op **Save**, dan **Activate**
5. Kopieer de webhook-URL → plak in de app onder "Todoist"

#### 3b. Werk Taken (Microsoft To Do / Outlook)

1. Nieuw scenario → **Webhooks → Custom webhook**
2. Voeg toe: **Microsoft To Do (Business) → Create a Task**
   - Title: kies `content` uit de webhook-data
   - Koppel je Microsoft-account
3. Save + Activate → URL kopiëren → plak onder "Werk Taken"

#### 3c. Gmail

1. Nieuw scenario → **Webhooks → Custom webhook**
2. Voeg toe: **Gmail → Send an Email**
   - To: jouw eigen Gmail-adres
   - Subject: kies `subject` uit de webhook-data
   - Content: kies `content`
   - Koppel je Google-account
3. Save + Activate → URL kopiëren → plak onder "Gmail"

#### 3d. Werk Mail (Outlook)

1. Nieuw scenario → **Webhooks → Custom webhook**
2. Voeg toe: **Microsoft 365 Email → Send an Email**
   - To: jouw eigen werkmail-adres
   - Subject: kies `subject`
   - Body: kies `content`
   - Koppel je Microsoft-account
3. Save + Activate → URL kopiëren → plak onder "Werk Mail"

---

### Stap 4 — Stel de app in

1. Open de app in Chrome op je telefoon
2. Tik op het tandwiel-icoon rechtsbovenin
3. Plak de 4 webhook-URLs in de juiste velden
4. Klik **Opslaan**

---

### Stap 5 — Installeer als app op je telefoon

In Chrome op Android:
1. Tik op de drie puntjes (menu) rechtsboven
2. Kies **"Toevoegen aan startscherm"**
3. Bevestig → de app staat nu als icoon op je thuisscherm

---

## Payload die naar Make.com wordt gestuurd

```json
{
  "destination": "todoist",
  "type": "task",
  "content": "Bel de tandarts morgen om 9 uur",
  "appName": "VoiceRoute",
  "timestamp": "2026-02-26T10:30:00.000Z"
}
```

Voor e-mail wordt ook het veld `subject` meegestuurd:
```json
{
  "destination": "gmail",
  "type": "email",
  "content": "Link naar presentatie niet vergeten",
  "subject": "[VoiceRoute] Link naar presentatie niet vergeten",
  "appName": "VoiceRoute",
  "timestamp": "2026-02-26T10:30:00.000Z"
}
```

---

## Trefwoorden overzicht

| Bestemming       | Trefwoorden                                          |
|------------------|------------------------------------------------------|
| Todoist          | todoist, persoonlijke taak, privé taak, mijn taak   |
| Werk Taken       | werk taak, werktaak, outlook taak, werk todo         |
| Gmail            | gmail, privémail, privé mail, prive mail             |
| Werk Mail        | werk mail, werkmail, outlook mail, werk email        |

---

## Problemen?

| Probleem | Oplossing |
|----------|-----------|
| Microfoon werkt niet | Sta microfoontoestemming toe in Chrome (Instellingen → Site-instellingen → Microfoon) |
| Spraak wordt niet herkend | Controleer of je een actieve internetverbinding hebt |
| Webhook geeft fout | Controleer of het scenario in Make.com geactiveerd is |
| App opent niet als PWA | Verwijder van startscherm en voeg opnieuw toe |
