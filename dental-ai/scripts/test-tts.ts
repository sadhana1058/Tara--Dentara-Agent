import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
  const { generateSpeech } = await import('../lib/tts');
  console.log('Calling ElevenLabs...');
  const url = await generateSpeech('Hello, this is a test of the dental office voice.');
  console.log('✓ Audio URL:', url);
}

main().catch((e) => {
  console.error('✗ FAILED:', e.message);
  process.exit(1);
});
