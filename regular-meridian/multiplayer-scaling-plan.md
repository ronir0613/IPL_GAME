# Multiplayer Scaling & WebSocket Rate Limit Plan

As **16-0 Play** scales, Pusher's free tier limit of **200,000 messages/day** and **100 concurrent connections** may become a bottleneck, especially during active draft phases where the room state updates frequently.

This document outlines the two primary scaling routes (Ably and self-hosted Soketi) and provides a concrete recommendation for the current phase.

---

## 📊 Comparison of Scaling Options

| Feature | Option 1: Ably (Managed Cloud) | Option 2: Soketi (Self-Hosted on Fly.io) |
| :--- | :--- | :--- |
| **Daily Message Limit** | **Flexible** (6 Million messages / month, ~200k/day average) | **Unlimited** |
| **Max Concurrent Users**| **200** concurrent connections | **Unlimited** (constrained only by VPS memory) |
| **Monthly Cost** | **$0** (Free Tier) | **$0** (Using Fly.io Free Tier) |
| **Code Changes Required**| **High** (requires replacing `pusher-js` with Ably SDK) | **None** (100% Pusher-compatible) |
| **Server Maintenance** | None (fully managed) | Minimal (setup once on container hosting) |

---

## 🏆 Recommendation for Now: **Soketi on Fly.io**

We recommend deploying **Soketi on Fly.io's Free Tier** as the immediate next step.

### Rationale:
1. **Zero Client Code Churn**: Soketi is a drop-in replacement for Pusher. You do not need to rewrite the broadcasting, subscription, or presence logic in [pusher.ts](file:///d:/IPL_GAME/regular-meridian/src/lib/pusher.ts). You only need to update the configuration to point to your new Soketi host URL.
2. **True Unlimited Scalability**: Under Fly.io's free tier, you get up to 3 micro VMs and 100 GB of outbound bandwidth. A single 256MB VM running Soketi can handle thousands of concurrent WebSocket connections and tens of millions of messages, completely bypassing Pusher's daily limits.
3. **No Message Size Bottlenecks**: Pusher has a hard limit of 10KB per message, which is why the code currently implements client-side chunking. With a self-hosted Soketi instance, you can increase the max message size limit (e.g. to 100KB) in the environment variables, which simplifies state sync and removes chunking overhead entirely.

---

## 🛠️ Step-by-Step Soketi Setup Guide (Fly.io)

### 1. Deploy Soketi Server
Soketi is packaged as a Docker container. You can deploy it using the Fly.io CLI in minutes:

1. Install Fly CLI and authenticate:
   ```bash
   fly auth login
   ```
2. Initialize a new app:
   ```bash
   fly launch --image quay.io/soketi/soketi:1.6-16-alpine --no-deploy
   ```
3. Update the environment variables in your generated `fly.toml` file:
   ```toml
   [env]
   SOKETI_DEBUG = "true"
   SOKETI_PORT = "8080"
   # Customize app credentials (replace with secure random keys)
   SOKETI_DEFAULT_APP_ID = "ipl-auction-app"
   SOKETI_DEFAULT_APP_KEY = "ipl-auction-key"
   SOKETI_DEFAULT_APP_SECRET = "ipl-auction-secret"
   # Increase message payload limits if needed (default is 10MB in Soketi, vs Pusher's 10KB)
   SOKETI_MAX_MESSAGE_SIZE = "10485760" 
   ```
4. Deploy the app:
   ```bash
   fly deploy
   ```

### 2. Client Integration Updates
Once your Soketi app is deployed (e.g., at `your-soketi-app.fly.dev`), modify [pusher.ts](file:///d:/IPL_GAME/regular-meridian/src/lib/pusher.ts#L29-L39) to point to the new host:

```typescript
// Replace Pusher config with Soketi URL config
this.pusher = new Pusher('ipl-auction-key', {
  wsHost: 'your-soketi-app.fly.dev',
  wsPort: 443,
  wssPort: 443,
  forceTLS: true,
  disableStats: true,
  enabledTransports: ['ws', 'wss'],
  channelAuthorization: {
    endpoint: '/api/pusher-auth',
    transport: 'ajax',
    params: {
      name: this.userName,
      peerId: this.peerId,
    },
  },
});
```

### 3. Serverless Auth Endpoint Updates
Since you are using presence channels, you will need to update your auth endpoint (e.g. Astro server routes or Cloudflare Workers) to use the new Soketi credentials to sign client tokens. Since Soketi implements the Pusher protocol, your server-side Pusher SDK simply needs to point to the Soketi host:

```javascript
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: 'ipl-auction-app',
  key: 'ipl-auction-key',
  secret: 'ipl-auction-secret',
  host: 'your-soketi-app.fly.dev',
  useTLS: true,
});
```
