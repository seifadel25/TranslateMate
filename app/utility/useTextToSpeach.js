import { useState } from 'react';
import { textToSpeech } from './apiUtils';
import { Audio } from 'expo-av';

export const useTextToSpeech = () => {
  const [audioUrl, setAudioUrl] = useState('');

  const speak = async (output, languageCodeTo) => {
    try {
      const audioData = await textToSpeech(output, languageCodeTo);
      const { uri } = await Audio.Sound.createAsync({ uri: audioData });
      setAudioUrl(uri);
    } catch (error) {
      console.error('Text-to-Speech error:', error);
    }
  };

  return { audioUrl, speak };
};
