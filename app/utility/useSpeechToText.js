import { useState } from 'react';
import { startSpeechToText } from './apiUtils';

export const useSpeechToText = () => {
  const [input, setInput] = useState('');

  const listen = (subscriptionKey, location) => {
    startSpeechToText(subscriptionKey, location, setInput);
  };

  return { input, listen };
};
