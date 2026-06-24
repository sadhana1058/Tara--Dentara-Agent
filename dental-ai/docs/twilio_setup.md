# Twilio Webhook Setup

Configure your Twilio number to point at the deployed Vercel app.

## Steps

1. Go to **Twilio Console → Phone Numbers → Manage → Active numbers**
2. Click on your number (`TWILIO_PHONE_NUMBER`)
3. Scroll to **Voice Configuration**
4. Set **"A call comes in"**:
   - Type: `Webhook`
   - URL: `{PUBLIC_BASE_URL}/api/voice/incoming`
   - Method: `HTTP POST`
5. Set **"Call status changes"**:
   - URL: `{PUBLIC_BASE_URL}/api/voice/status`
   - Method: `HTTP POST`
6. Click **Save configuration**

Replace `{PUBLIC_BASE_URL}` with your actual Vercel URL (no trailing slash), e.g. `https://dental-ai.vercel.app`.

## Verify

Call your Twilio number from a verified caller ID. You should hear the ElevenLabs greeting within a few seconds of the call connecting.

## Verified caller IDs (trial accounts)

Twilio trial accounts can only call verified numbers. Add yours at:
**Twilio Console → Phone Numbers → Verified Caller IDs → Add a new Caller ID**
