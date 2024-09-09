import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import axios from 'https://esm.sh/axios@0.21.1'; // Importing axios from esm.sh

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, from, to, service } = await req.json();

    const subscriptionKey = Deno.env.get('AZURE_SUBSCRIPTION_KEY');
    const endpoint = Deno.env.get('AZURE_ENDPOINT');

    let url, headers, body;

    if (service === 'translate') {
      url = `${endpoint}/translate?api-version=3.0&from=${from}&to=${to}`;
      headers = {
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Region': 'uaenorth',
      };
      body = [{ text }];
    } else if (service === 'tts') {
      url = `${endpoint}/cognitiveservices/v1`;
      headers = {
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3',
        'User-Agent': 'TranslateMate',
      };
      body = `<speak version='1.0' xml:lang='en-US'>
                <voice xml:lang='en-US' xml:gender='Female' name='en-US-JennyNeural'>
                  ${text}
                </voice>
              </speak>`;
    } else if (service === 'stt') {
      url = `${endpoint}/cognitiveservices/v1`;
      headers = {
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'Content-Type': 'audio/wav',
      };
      body = await req.blob();
    }

    const response = await axios.post(url, body, { headers });
    return new Response(JSON.stringify(response.data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Azure API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process request' }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
}
