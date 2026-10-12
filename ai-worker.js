/**
 * Kozak AI secure backend for Cloudflare Workers.
 * Required secret: OPENAI_API_KEY
 * Required variable: ALLOWED_ORIGIN (your exact GitHub Pages origin). Optional: OPENAI_MODEL (default: gpt-4.1-mini)
 *
 * Deploy this file as a Cloudflare Worker. Keep OPENAI_API_KEY in Worker Secrets,
 * never in website JavaScript. Then send /ai-endpoint https://YOUR-WORKER.workers.dev/chat
 * inside Kozak AI. Set ALLOWED_ORIGIN to the exact GitHub Pages origin and configure rate limiting before sharing publicly.
 */
const SYSTEM_PROMPT = `You are Kozak AI, the friendly assistant for the KH么Kozak 3.1 PUBG Mobile blogger website.
Speak Ukrainian by default and English when requested or when the user writes in English. Be warm, kind, lightly playful, and respectful; use occasional hearts/emojis naturally without overdoing it.
Help with translation, writing, the KH么Kozak website, browser mini-games, site settings, troubleshooting, PUBG Mobile strategy, training routines, loadouts, and general questions. Remember the conversation context provided in the current request and refer to earlier messages when relevant.
Be honest about uncertainty. Never claim you accessed the user's PUBG account, changed their website, published code, sent messages, or performed actions unless a tool actually did so. Explain that website coins and progress are browser-local unless a server sync has actually been configured. Do not claim to launch PUBG directly; the website can link to Google Play.
For site navigation, the pages are index.html (home/tools), videos.html (clips), avatars.html (avatars), minigames.html (browser mini-games), locker.html (shop), music.html (KH Radio). The user's public handles are TikTok @uakozak5 and Telegram @idvolf450. PUBG ID: 52179256850.
Do not request or expose API keys, passwords, or private account credentials. Be concise but useful. `;

export default {
 async fetch(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigin = env.ALLOWED_ORIGIN || '';
  const corsOrigin = allowedOrigin && origin === allowedOrigin ? origin : 'null';
  const headers = {
   'Access-Control-Allow-Origin': corsOrigin,
   'Access-Control-Allow-Methods': 'POST, OPTIONS',
   'Access-Control-Allow-Headers': 'Content-Type',
   'Access-Control-Max-Age': '86400',
   'Vary': 'Origin'
  };
  if (!allowedOrigin) return Response.json({error:'Set the ALLOWED_ORIGIN variable to your exact GitHub Pages origin before using this Worker'}, {status:503,headers});
  if (request.method === 'OPTIONS') return new Response(null, {status: 204, headers});
  if (request.method !== 'POST') return Response.json({error:'Use POST'}, {status:405,headers});
  if (corsOrigin === 'null') return Response.json({error:'Origin not allowed'}, {status:403,headers});
  if (!env.OPENAI_API_KEY) return Response.json({error:'Server AI key is not configured'}, {status:503,headers});
  let body;
  try { body = await request.json(); } catch { return Response.json({error:'Invalid JSON'}, {status:400,headers}); }
  const incoming = Array.isArray(body.messages) ? body.messages.slice(-14) : [];
  const messages = incoming.filter(m => m && ['user','assistant'].includes(m.role) && typeof m.content === 'string')
    .map(m => ({role:m.role, content:m.content.slice(0,3000)}));
  if (!messages.length || !messages.some(m => m.role === 'user')) return Response.json({error:'A user message is required'}, {status:400,headers});
  const page = typeof body.page === 'string' ? body.page.slice(0,120) : '';
  const language = body.language === 'en' ? 'English' : 'Ukrainian';
  const input = [
   {role:'system', content: SYSTEM_PROMPT + '\nCurrent response language preference: ' + language + '. Current site path: ' + page},
   ...messages
  ];
  let upstream;
  try {
   upstream = await fetch('https://api.openai.com/v1/responses', {
    method:'POST',
    headers:{'Authorization':'Bearer ' + env.OPENAI_API_KEY, 'Content-Type':'application/json'},
    body:JSON.stringify({model:env.OPENAI_MODEL || 'gpt-4.1-mini', input, max_output_tokens:800})
   });
  } catch {
   return Response.json({error:'Could not reach the AI provider'}, {status:502,headers});
  }
  const result = await upstream.json().catch(()=>({}));
  if (!upstream.ok) return Response.json({error:'AI provider request failed',details:result.error?.message || 'Unknown provider error'}, {status:502,headers});
  const reply = result.output_text || (result.output || []).flatMap(item => item.content || []).filter(c => c.type === 'output_text').map(c => c.text).join('\n');
  if (!reply) return Response.json({error:'The AI returned an empty response'}, {status:502,headers});
  return Response.json({reply}, {headers});
 }
};
