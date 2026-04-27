const H = {
'Content-Type': 'application/json',
'Access-Control-Allow-Origin': '*',
'Access-Control-Allow-Methods': 'POST, OPTIONS',
'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
return new Response(JSON.stringify(data), { status, headers: H });
}

export async function onRequestPost(context) {
const { request, env } = context;

// 1. Check KV binding exists
if (!env || !env.VAULT_KV) {
return json({
ok: false,
error: 'KV binding missing. In Cloudflare Pages → Settings → Functions → KV namespace bindings, add variable name VAULT_KV pointing to your namespace.',
}, 500);
}

// 2. Parse request body
let key;
try {
const body = await request.json();
key = body && body.key;
} catch (_) {
return json({ ok: false, error: 'Could not parse request body as JSON.' }, 400);
}

if (!key || typeof key !== 'string' || key.trim() === '') {
return json({ ok: false, error: 'No key in request body.' }, 400);
}

// 3. Read adminkey from KV
let adminKey;
try {
adminKey = await env.VAULT_KV.get('adminkey');
} catch (e) {
return json({ ok: false, error: 'KV read error: ' + e.message }, 500);
}

if (adminKey === null || adminKey === undefined) {
return json({
ok: false,
error: 'No adminkey entry found in KV. Add a key called “adminkey” with your password as the value in the Cloudflare KV dashboard.',
}, 500);
}

// 4. Compare (trim both sides to avoid hidden whitespace)
const ok = key.trim() === adminKey.trim();
return json({ ok, token: ok ? key.trim() : null });
}

export async function onRequestOptions() {
return new Response(null, { headers: H });
}
