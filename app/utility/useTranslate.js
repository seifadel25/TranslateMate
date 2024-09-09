import { useState, useCallback, useEffect } from 'react';
import { translateText } from './apiUtils';

export const useTranslate = (input, languageCodeFrom, languageCodeTo) => {
  const [output, setOutput] = useState('');

  const translate = useCallback(async () => {
    const translatedText = await translateText(input, languageCodeFrom, languageCodeTo);
    setOutput(translatedText);
  }, [input, languageCodeFrom, languageCodeTo]);

  useEffect(() => {
    if (input) {
      translate();
    }
  }, [input, translate]);

  return { output, translate };
};
