// Supabase Edge Function — mints a short-lived signed URL for a
// payment-proof image. payment-proofs is a private bucket (see
// 20260840_lock_down_payment_proofs.sql), so this is the only way to
// actually view a file — gated by the admin session token issued right
// after verify_admin_password succeeds in Login.tsx's enterAdminConsole
// (20260839_admin_session_token.sql).
//
// Deploy: supabase functions deploy admin-payment-proofs

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { token, path } = body ?? {};
  if (!token || !path) return json({ error: 'Missing token or path' }, 400);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: validToken } = await supabase.rpc('verify_admin_session_token', { p_token: token });
  if (!validToken) return json({ error: 'Session expired or invalid — please sign in to the admin console again.' }, 401);

  const { data, error } = await supabase.storage.from('payment-proofs').createSignedUrl(path, 300);
  if (error) return json({ error: error.message }, 500);
  return json({ signedUrl: data.signedUrl });
});
