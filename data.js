const CORS = {
‘Content-Type’: ‘application/json’,
‘Access-Control-Allow-Origin’: ‘*’,
‘Access-Control-Allow-Methods’: ‘GET, PUT, OPTIONS’,
‘Access-Control-Allow-Headers’: ‘Content-Type, Authorization’,
};

// GET /api/data  — public, returns the full papers blob
export async function onRequestGet({ env }) {
try {
const raw = await env.VAULT_KV.get(‘data’);
return new Response(raw || ‘[]’, { headers: CORS });
} catch (e) {
return new Response(JSON.stringify({ error: ‘KV read failed’, detail: e.message }), {
status: 500, headers: CORS,
});
}
}

// PUT /api/data  — admin only, replaces the full papers blob
export async function onRequestPut({ request, env }) {
try {
// Verify the session token against the stored adminkey
const auth  = request.headers.get(‘Authorization’) || ‘’;
const token = auth.startsWith(’Bearer ’) ? auth.slice(7) : ‘’;
if (!token) return new Response(JSON.stringify({ error: ‘No token’ }), { status: 401, headers: CORS });


const adminKey = await env.VAULT_KV.get('adminkey');
if (!adminKey || token !== adminKey) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS });
}

// Validate it's real JSON before storing
const body = await request.text();
JSON.parse(body); // throws if malformed
await env.VAULT_KV.put('data', body);

return new Response(JSON.stringify({ ok: true }), { headers: CORS });


} catch (e) {
return new Response(JSON.stringify({ error: ‘Save failed’, detail: e.message }), {
status: 500, headers: CORS,
});
}
}

// OPTIONS — preflight
export async function onRequestOptions() {
return new Response(null, { headers: CORS });
}
