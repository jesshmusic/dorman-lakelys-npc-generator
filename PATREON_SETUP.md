# Patreon Integration Setup Guide

This guide covers how to configure the Patreon OAuth integration and n8n backend for AI feature gating.

## Overview

The module uses a Patreon OAuth 2.0 flow with an n8n backend to validate memberships. This approach:
- Keeps your Patreon credentials secure
- Validates membership tiers server-side
- Prevents unauthorized access to AI features

## Prerequisites

1. **Patreon Creator Account**: You must have an active Patreon page with membership tiers
2. **n8n Instance**: A deployed n8n workflow automation server (self-hosted or cloud)
3. **Patreon OAuth Application**: Register an OAuth app at https://www.patreon.com/portal/registration/register-clients

## Step 1: Create Patreon OAuth Application

1. Go to https://www.patreon.com/portal/registration/register-clients
2. Click "Create Client"
3. Fill in the details:
   - **App Name**: "Dorman Lakely's NPC Generator" (or your preferred name)
   - **Description**: "FoundryVTT NPC Generator with AI features"
   - **App Category**: "Gaming"
   - **Redirect URIs**: Add your n8n webhook URL:
     ```
     https://your-n8n-instance.com/webhook/npc-generator-oauth
     ```
4. Save and note your **Client ID** and **Client Secret**

## Step 2: Deploy n8n Backend

### Option A: Self-Hosted n8n

1. Install n8n following the official docs: https://docs.n8n.io/hosting/
2. Ensure it's accessible via HTTPS (required for OAuth)
3. Create the following workflows (see below)

### Option B: n8n Cloud

1. Sign up at https://n8n.io/
2. Create a new workflow
3. Your webhook URLs will be: `https://[your-instance].app.n8n.cloud/webhook/...`

## Step 3: Create n8n Workflows

You need two n8n workflows:

### Workflow 1: OAuth Callback Handler

This workflow receives the OAuth callback from Patreon and validates the membership.

**Webhook URL**: `/webhook/npc-generator-oauth`

**Nodes**:

1. **Webhook Node** (Trigger)
   - Method: GET
   - Path: `npc-generator-oauth`
   - Response Mode: "Return response to webhook"

2. **Extract Query Parameters** (Function Node)
   ```javascript
   const code = $input.item.json.query.code;
   const state = $input.item.json.query.state;
   return {json: {code, state}};
   ```

3. **Exchange Code for Token** (HTTP Request Node)
   - Method: POST
   - URL: `https://www.patreon.com/api/oauth2/token`
   - Authentication: None
   - Body Parameters:
     - `code`: `{{$json.code}}`
     - `grant_type`: `authorization_code`
     - `client_id`: `YOUR_PATREON_CLIENT_ID`
     - `client_secret`: `YOUR_PATREON_CLIENT_SECRET`
     - `redirect_uri`: `YOUR_N8N_WEBHOOK_URL`

4. **Get User Identity** (HTTP Request Node)
   - Method: GET
   - URL: `https://www.patreon.com/api/oauth2/v2/identity?include=memberships&fields[member]=patron_status`
   - Authentication: Bearer Token
   - Token: `{{$json.access_token}}`

5. **Determine Tier** (Function Node)
   ```javascript
   const memberships = $json.included || [];
   let tier = 'free';

   for (const membership of memberships) {
     if (membership.attributes?.patron_status === 'active_patron') {
       // Check tier based on amount_cents or tier ID
       const amountCents = membership.attributes?.currently_entitled_amount_cents || 0;
       if (amountCents >= 500) {
         tier = 'wizard'; // $5/month
       } else if (amountCents >= 300) {
         tier = 'apprentice'; // $3/month
       }
     }
   }

   return {json: {tier, state: $('Extract Query Parameters').item.json.state}};
   ```

6. **Store Result** (Redis/Database Node or Memory Storage)
   - Store the result keyed by `state` UUID
   - Include: `{tier, authenticated: true, timestamp}`
   - TTL: 5 minutes (enough time for polling)

7. **Return Success** (Respond to Webhook Node)
   - Status Code: 200
   - Body: `{"success": true, "message": "Authentication successful! You can close this window."}`

### Workflow 2: Polling Endpoint

This workflow allows the module to poll for authentication results.

**Webhook URL**: `/webhook/npc-generator-poll`

**Nodes**:

1. **Webhook Node** (Trigger)
   - Method: GET
   - Path: `npc-generator-poll`
   - Query Parameters: `state`

2. **Retrieve from Storage** (Redis/Database Node)
   - Get data by state UUID

3. **Return Result** (Respond to Webhook Node)
   - If found: `{"authenticated": true, "tier": "apprentice"}`
   - If not found: `{"authenticated": false}`

## Step 4: Update Module Configuration

1. Open `src/services/PatreonService.ts`
2. Update the configuration:

```typescript
const PATREON_CONFIG = {
  clientId: 'YOUR_PATREON_CLIENT_ID', // From Step 1
  n8nWebhookBase: 'https://your-n8n-instance.com/webhook', // From Step 2
  scopes: 'identity identity.memberships',
  pollInterval: 3000,
  maxPollAttempts: 20
};
```

3. Save and rebuild the module: `npm run build`

## Step 5: Test the Integration

1. Load the module in FoundryVTT
2. Open the NPC Generator
3. Click "Connect Patreon for AI Features"
4. Verify you're redirected to Patreon
5. Authorize the application
6. Verify you're redirected back and the tier badge appears

### Troubleshooting

**"Failed to authenticate" error**:
- Check n8n workflow is active and accessible
- Verify webhook URLs match in Patreon OAuth app and code
- Check n8n logs for errors

**Tier not detected**:
- Verify Patreon membership is active
- Check the tier detection logic in n8n (amount_cents thresholds)
- Ensure Patreon API v2 is being used

**Polling timeout**:
- Check n8n storage node is working (Redis/DB)
- Verify state UUID is being passed correctly
- Increase polling attempts if network is slow

## Security Considerations

1. **HTTPS Required**: OAuth requires HTTPS for security
2. **State Token**: Prevents CSRF attacks (UUID generated per auth)
3. **IP Binding**: Consider storing user IP with auth data to prevent sharing
4. **Token Expiry**: Set reasonable TTL on stored auth data (5 minutes for polling)
5. **Client Secret**: Keep your Patreon Client Secret secure in n8n (don't expose to client)

## Cost Estimate

- **n8n Cloud**: Free tier supports up to 5,000 workflow executions/month
- **Self-hosted n8n**: Free and open source
- **Patreon API**: Free (no rate limits for standard OAuth flows)

For most creators, the free n8n tier should be sufficient.

## Support

If you encounter issues:
1. Check n8n workflow execution logs
2. Review Foundry console for errors (F12)
3. Verify Patreon membership is active
4. Ensure OAuth redirect URI matches exactly

For module-specific issues, open an issue at:
https://github.com/jesshmusic/dorman-lakelys-npc-generator/issues
