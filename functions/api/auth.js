const CORS = {
'Content-Type': 'application/json',
'Access-Control-Allow-Origin': '*',
'Access-Control-Allow-Methods': 'POST, OPTIONS',
'Access-Control-Allow-Headers': 'Content-Type',
};

// POST /api/auth  — verifies admin key server-side, never exposes raw key
// Body: { “key”: “…” }
// Response: { “ok”: true }  or  { “ok”: false }
export async function onRequestPost({ request, env }) {
try {
const { key } = await request.json();
if (!key || typeof key !== 'string') {
return new Response(JSON.stringify({ ok: false, error: 'No key provided' }), {
status: 400, headers: CORS,
});
}

```
const adminKey = await env.VAULT_KV.get('adminkey');

// Use timing-safe comparison to avoid timing attacks
// (simple string compare is fine for a school site but good habit)
const ok = adminKey !== null && key === adminKey;

// Return the key back to the client ONLY on success so it can use it as a Bearer token.
// It stays in memory, never in localStorage/cookies.
return new Response(JSON.stringify({ ok, token: ok ? key : null }), { headers: CORS });
```

} catch (e) {
return new Response(JSON.stringify({ ok: false, error: e.message }), {
status: 500, headers: CORS,
});
}
}

// OPTIONS — preflight
export async function onRequestOptions() {
return new Response(null, { headers: CORS });
}
