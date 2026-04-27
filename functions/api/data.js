const H = {
'Content-Type': 'application/json',
'Access-Control-Allow-Origin': '*',
'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data, status = 200) {
return new Response(JSON.stringify(data), { status, headers: H });
}

// GET /api/data  — public
export async function onRequestGet(context) {
const { env } = context;

if (!env || !env.VAULT_KV) {
return json({ error: 'KV binding VAULT_KV not configured in Pages → Settings → Functions.' }, 500);
}

try {
const raw = await env.VAULT_KV.get('data');
// Return raw string directly so we don't double-encode
return new Response(raw || '[]', { headers: H });
} catch (e) {
return json({ error: 'KV read failed: ' + e.message }, 500);
}
}

// PUT /api/data  — admin only
export async function onRequestPut(context) {
const { request, env } = context;

if (!env || !env.VAULT_KV) {
return json({ error: 'KV binding VAULT_KV not configured.' }, 500);
}

// Auth
const auth  = request.headers.get('Authorization') || '';
const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
if (!token) return json({ error: 'No Bearer token.' }, 401);

let adminKey;
try {
adminKey = await env.VAULT_KV.get('adminkey');
} catch (e) {
return json({ error: 'KV read error: ' + e.message }, 500);
}

if (!adminKey || token !== adminKey.trim()) {
return json({ error: 'Unauthorized.' }, 401);
}

// Validate + save body
let body;
try {
body = await request.text();
JSON.parse(body); // validate JSON
} catch (e) {
return json({ error: 'Invalid JSON body: ' + e.message }, 400);
}

try {
await env.VAULT_KV.put('data', body);
return json({ ok: true });
} catch (e) {
return json({ error: 'KV write failed: ' + e.message }, 500);
}
}

export async function onRequestOptions() {
return new Response(null, { headers: H });
}
