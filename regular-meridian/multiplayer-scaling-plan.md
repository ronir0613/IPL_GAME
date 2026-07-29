# Multiplayer Scaling & WebSocket Rate Limit Plan

As **16-0 Play** scales, Pusher's free tier limit of **200,000 messages/day** and **100 concurrent connections** may become a bottleneck, especially during active draft phases where the room state updates frequently.

This document outlines the scaling route using **Ably** via its built-in **Pusher Protocol Adapter**—allowing us to scale up to **6 Million messages/month** completely for **free without requiring a credit card**.

---

## 📊 Comparison of Scaling Options

| Feature | Option 1: Ably (Managed Cloud) | Option 2: Pusher (Current Stack) |
| :--- | :--- | :--- |
| **Monthly Message Limit** | **6 Million** messages / month (~200k/day average with peak flexibility) | **6 Million** messages / month (strictly capped at 200k/day) |
| **Max Concurrent Users**| **200** concurrent connections | **100** concurrent connections |
| **Signup Requirements**  | Email / Github / Google (**No credit card required**) | Email (**No credit card required**) |
| **Code Changes Required**| **None** (Uses built-in Pusher Protocol compatibility) | N/A |
| **Infrastructure Setup** | None (Fully managed cloud service) | None |

---

## 🏆 Recommendation for Now: **Ably Pusher Protocol Adapter**

We recommend switching to **Ably** using its Pusher compatibility adapter.

### Rationale:
1. **No Credit Card Block**: Unlike Fly.io or Railway, Ably's free tier is 100% card-free to sign up.
2. **Zero Code Changes**: Ably supports the Pusher protocol natively. This means we can continue using the existing `pusher-js` library in the frontend and the standard `pusher` library in the backend with **zero modifications to the core logic**. We only change connection endpoints and credentials.
3. **Double the Connections**: The concurrent connection limit increases from 100 to 200.

---

## 🛠️ Step-by-Step Ably Integration Guide

### 1. Set Up Ably Account
1. Go to [Ably.com](https://ably.com/) and sign up for a free account (using GitHub, Google, or Email). No payment information is required.
2. Create a new app (e.g., `IPL-Game`).
3. Under your new App dashboard:
   - Go to the **Settings** tab.
   - Scroll down to **Protocol Adapter Settings**.
   - Check/enable **Pusher protocol support**.
4. Go to the **API Keys** tab and copy your API key (it looks like `appId.keyId:secret`).
   - *Note*: Ably API keys contain a colon `:`. 
   - The part **before** the colon (e.g., `appId.keyId`) is your **Pusher App Key**.
   - The part **after** the colon (e.g., `secret`) is your **Pusher App Secret**.
   - The portion before the first dot `.` is your **Pusher App ID**.

### 2. Client Integration Updates
Modify [pusher.ts](file:///d:/IPL_GAME/regular-meridian/src/lib/pusher.ts#L29-L39) to redirect connections to Ably's Pusher endpoint:

```typescript
// Initialize Pusher client pointing to Ably's Pusher compatibility adapter
this.pusher = new Pusher('YOUR_ABLY_KEY_PREFIX', { // Everything before the colon in your Ably key
  wsHost: 'main.pusher.ably.net',
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

### 3. Backend Auth Endpoint Updates
Update your Pusher server-side credentials (in your environment variables or server config) to use the Ably credentials and point to the Ably host:

```javascript
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: 'YOUR_ABLY_APP_ID',      // Everything before the first dot '.'
  key: 'YOUR_ABLY_KEY_PREFIX',    // Everything before the colon ':'
  secret: 'YOUR_ABLY_SECRET',     // Everything after the colon ':'
  host: 'main.pusher.ably.net',   // Point to Ably Pusher endpoint
  useTLS: true,
});
```
