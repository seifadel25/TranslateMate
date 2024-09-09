import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export const translateText = async (input, languageCodeFrom, languageCodeTo) => {
  const subscriptionKey = process.env.EXPO_PUBLIC_Azure_Translate_Key;
  const endpoint = process.env.EXPO_PUBLIC_Azure_Translate_Endpoint;
  const location = 'uaenorth';

  try {
    const response = await axios({
      baseURL: endpoint,
      url: '/translate',
      method: 'post',
      headers: {
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'Ocp-Apim-Subscription-Region': location,
        'Content-type': 'application/json',
        'X-ClientTraceId': uuidv4().toString(),
      },
      params: {
        'api-version': '3.0',
        from: languageCodeFrom,
        to: languageCodeTo,
      },
      data: [{ text: input }],
    });
    return response.data[0].translations[0].text;
  } catch (error) {
    console.error('Translation error:', error);
  }
};

export const textToSpeech = async (output, languageCodeTo) => {
  const subscriptionKey = process.env.EXPO_PUBLIC_AZURE_SUB_KEY;
  const location = 'uaenorth';
  const endpoint = `https://${location}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const voiceName =
    voiceNameMap.find((voice) => voice.code === languageCodeTo)?.name || 'en-US-AriaNeural';
  const voiceCode =
    voiceNameMap.find((voice) => voice.code === languageCodeTo)?.LangCode || 'en-US';

  try {
    const response = await axios({
      url: endpoint,
      method: 'post',
      headers: {
        'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm',
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'Content-Type': 'application/ssml+xml',
        'X-ClientTraceId': uuidv4().toString(),
      },
      data: `
        <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.microsoft.com/2008/05/tts/mstts' xml:lang='${voiceCode}'>
          <voice name='${voiceName}'>
            <prosody rate='-10.00%'>
              ${output}
            </prosody>
          </voice>
        </speak>`,
    });

    return response.data;
  } catch (error) {
    console.error('Text-to-Speech error:', error);
  }
};

export const startSpeechToText = (subscriptionKey, location, setInput) => {
  const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(subscriptionKey, location);
  const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
  const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

  recognizer.recognizeOnceAsync(
    (result) => {
      if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
        setInput(result.text);
      } else {
        console.error('Speech recognition failed:', result.errorDetails);
      }
    },
    (error) => {
      console.error('Speech recognition error:', error);
    }
  );
};
