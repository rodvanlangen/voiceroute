// router.js — bestemmingen en trefwoord-detectie (fallback)

const ROUTES = [
  {
    dest: 'todoist',
    label: 'Todoist',
    type: 'task',
    color: '#ef4444',
    keywords: ['todoist', 'to do ist', 'to doist', 'to-do-ist', 'persoonlijke taak', 'privé taak', 'prive taak', 'mijn taak']
  },
  {
    dest: 'outlook-todo',
    label: 'Werk Taken',
    type: 'task',
    color: '#2563eb',
    keywords: ['werk taak', 'werktaak', 'outlook taak', 'outlook todo', 'werk todo']
  },
  {
    dest: 'gmail',
    label: 'Gmail',
    type: 'email',
    color: '#ea4335',
    keywords: ['gmail', 'privémail', 'privé mail', 'prive mail', 'persoonlijk mail', 'privé e-mail']
  },
  {
    dest: 'outlook-mail',
    label: 'Werk Mail',
    type: 'email',
    color: '#0078d4',
    keywords: ['werk mail', 'werkmail', 'outlook mail', 'werk email', 'werkemail', 'outlook e-mail']
  },
  {
    dest: 'obsidian',
    label: 'Obsidian',
    type: 'note',
    color: '#7c3aed',
    keywords: ['obsidian', 'notitie', 'notitie obsidian', 'obsidian notitie']
  }
];

/**
 * Geeft de route voor een specifieke bestemming terug.
 */
function getRouteByDest(dest) {
  return ROUTES.find(r => r.dest === dest) ?? null;
}

/**
 * Analyseert de tekst en geeft terug naar welke bestemming het moet.
 * Wordt alleen gebruikt als fallback (geen bestemming geselecteerd via icoon).
 * Formaat: "[trefwoord] [inhoud]"  of  "[trefwoord]: [inhoud]"
 */
function detectRoute(transcript) {
  const lower = transcript.toLowerCase().trim();

  for (const route of ROUTES) {
    for (const keyword of route.keywords) {
      if (lower.startsWith(keyword)) {
        const raw = transcript.substring(keyword.length).replace(/^[\s:,;]+/, '').trim();
        if (!raw) continue;
        return { ...route, content: raw, matched: keyword };
      }
    }
  }

  return null;
}
