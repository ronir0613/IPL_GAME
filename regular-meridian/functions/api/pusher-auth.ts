async function hmacSha256(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    messageData
  );

  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function onRequestPost(context: { request: Request; env: any }) {
  const { request, env } = context;

  // Read environment variables
  const appKey = env.PUSHER_APP_KEY;
  const appSecret = env.PUSHER_APP_SECRET;

  if (!appKey || !appSecret) {
    return new Response(
      JSON.stringify({ error: 'Pusher environment variables are not configured on the server.' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }

  try {
    const formData = await request.formData();
    const socketId = formData.get('socket_id') as string;
    const channelName = formData.get('channel_name') as string;
    const name = formData.get('name') as string || 'Anonymous';

    if (!socketId || !channelName) {
      return new Response(
        JSON.stringify({ error: 'Missing socket_id or channel_name parameters.' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    // Prepare channel data for Pusher Presence Channel
    const channelData = JSON.stringify({
      user_id: socketId,
      user_info: { name }
    });

    // Generate Pusher auth signature
    const stringToSign = `${socketId}:${channelName}:${channelData}`;
    const signature = await hmacSha256(appSecret, stringToSign);

    return new Response(
      JSON.stringify({
        auth: `${appKey}:${signature}`,
        channel_data: channelData
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Pusher auth error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error during Pusher auth.', details: err.message }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
