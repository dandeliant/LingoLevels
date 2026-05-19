// =============================================================
// LingoLevels AI Worker — proxy from frontend → Gemini 1.5 Flash
//
// Free tier: 1500 requests/day on Gemini, 100k/day on CF Workers.
// Holds GEMINI_API_KEY as a Worker secret (never exposed to browser).
// =============================================================

const ALLOWED_ORIGIN_PREFIXES = [
  'https://dandeliant.github.io',
  'http://localhost',
  'http://127.0.0.1',
  'null'                    // file:// pages send Origin: null
];

const LANG_NAME = { en: 'English', ru: 'Russian', de: 'German', fr: 'French' };

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const corsOrigin = ALLOWED_ORIGIN_PREFIXES.some(p => origin === p || origin.startsWith(p))
      ? origin
      : ALLOWED_ORIGIN_PREFIXES[0];
    const cors = {
      'Access-Control-Allow-Origin':  corsOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age':       '86400',
      'Vary':                         'Origin'
    };

    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST')    return jsonResp({ error: 'Method Not Allowed' }, 405, cors);
    if (!env.GEMINI_API_KEY)      return jsonResp({ error: 'Server is not configured: missing GEMINI_API_KEY' }, 500, cors);

    let body;
    try { body = await req.json(); }
    catch { return jsonResp({ error: 'Bad JSON' }, 400, cors); }

    const { source, sourceType, targetLang } = body || {};
    if (!source || !targetLang || !LANG_NAME[targetLang]) {
      return jsonResp({ error: 'Missing or invalid source / targetLang' }, 400, cors);
    }

    // Resolve source text — paste or fetched URL.
    let sourceText = String(source).trim();
    if (sourceType === 'url') {
      try {
        const r = await fetch(sourceText, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LingoLevelsBot/1.0; +https://dandeliant.github.io/LingoLevels/)' },
          cf: { cacheTtl: 0 }
        });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const html = await r.text();
        sourceText = extractText(html);
        if (sourceText.length < 80) throw new Error('Page returned too little readable content');
      } catch (e) {
        return jsonResp({ error: 'Failed to fetch URL: ' + e.message }, 502, cors);
      }
    }

    // Cap input so we don't blow Gemini's token budget.
    const MAX_INPUT = 8000;
    if (sourceText.length > MAX_INPUT) sourceText = sourceText.slice(0, MAX_INPUT) + '…';

    // Call Gemini.
    const prompt = buildPrompt(sourceText, targetLang);
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
      const g = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.4,
            maxOutputTokens: 8192
          }
        })
      });
      const gData = await g.json();
      if (!g.ok) {
        const msg = gData?.error?.message || ('Gemini HTTP ' + g.status);
        return jsonResp({ error: 'Gemini error: ' + msg }, 502, cors);
      }
      const raw = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) return jsonResp({ error: 'Gemini returned no content', detail: gData }, 502, cors);

      let parsed;
      try { parsed = JSON.parse(raw); }
      catch (e) { return jsonResp({ error: 'Gemini returned invalid JSON', raw }, 502, cors); }

      return jsonResp(parsed, 200, cors);
    } catch (e) {
      return jsonResp({ error: 'Gemini call failed: ' + e.message }, 502, cors);
    }
  }
};

function jsonResp(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' }
  });
}

function buildPrompt(text, targetLang) {
  const lang = LANG_NAME[targetLang];
  return `You are a CEFR-level language teacher producing a structured lesson for a learning app called LingoLevels. The learner's native language is Polish; the target language is ${lang}.

Given the source text below, output a complete lesson with SIX graded versions in ${lang} plus a matching Polish translation per level, plus a key-vocabulary list. Each version must read as NATURAL ${lang} for that CEFR level — do not just shorten/lengthen, rewrite with appropriate grammar, vocabulary range, sentence complexity and tone for each level.

Word-count targets per ${lang} version (approximate):
- A1: 60–100 words, present tense, basic vocabulary.
- A2: 100–150 words, simple past/future, slightly broader vocabulary.
- B1: 180–250 words, varied tenses, modals, light idioms.
- B2: 280–400 words, complex sentences, sophisticated vocabulary, abstract ideas.
- C1: 400–550 words, formal/nuanced register, advanced connectors.
- C2: 500–700 words, literary/sophisticated register, rich syntax.

Polish translations must match the complexity of the corresponding ${lang} level — A1 PL is very simple Polish, C2 PL is sophisticated Polish.

Provide 8–12 key vocabulary entries drawn from the ${lang} text. Each entry: the word/phrase in ${lang}, IPA in slashes (use plausible IPA for the target language), part of speech (noun/verb/adjective/adverb/phrase/idiom), 1–3 Polish translations as an array, one example sentence in ${lang} taken or adapted from the lesson, the Polish translation of that example, and the CEFR level the word fits.

Also: a short title (max 6 words) in ${lang}.

SOURCE TEXT:
"""
${text}
"""

Return ONLY valid JSON in this exact shape, with no markdown fences and no commentary:
{
  "title": "...",
  "levels": {
    "A1": "...", "A2": "...", "B1": "...", "B2": "...", "C1": "...", "C2": "..."
  },
  "translations_pl": {
    "A1": "...", "A2": "...", "B1": "...", "B2": "...", "C1": "...", "C2": "..."
  },
  "vocabulary": [
    {
      "word": "...",
      "ipa": "/.../",
      "pos": "noun",
      "translations_pl": ["..."],
      "example": "...",
      "example_pl": "...",
      "cefr": "B1"
    }
  ]
}`;
}

// Crude HTML → plain text. Good enough for news articles & blog posts.
// (For paywalled or JS-rendered pages it falls back to whatever it can scrape.)
function extractText(html) {
  // Strip scripts, styles, navs, headers, footers, asides — anything obviously chrome.
  let t = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<(nav|header|footer|aside|form)[\s\S]*?<\/\1>/gi, ' ');

  // Try to grab the <article> or .article body if it exists.
  const article = t.match(/<article[\s\S]*?<\/article>/i);
  if (article) t = article[0];

  // Strip remaining tags, normalize whitespace, decode the most common HTML entities.
  t = t.replace(/<[^>]+>/g, ' ')
       .replace(/&nbsp;/g, ' ')
       .replace(/&amp;/g, '&')
       .replace(/&lt;/g, '<')
       .replace(/&gt;/g, '>')
       .replace(/&quot;/g, '"')
       .replace(/&#39;/g, "'")
       .replace(/\s+/g, ' ')
       .trim();
  return t;
}
