import { Stack } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import {
  FlatList,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  View,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import React, { useState, useEffect, useCallback } from 'react';
import { languages } from '~/assets/languages';
import { voiceNameMap } from '~/assets/voiceNameMap';
import axios from 'axios';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { Audio } from 'expo-av';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { encode } from 'base64-arraybuffer';
import { Analytics } from '@vercel/analytics/react';

export default function Home() {
  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access microphone is required!');
      }
    })();
  }, []);
  const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      paddingTop: 20,
      paddingBottom: 20,
      flex: 1,
      justifyContent: 'center',
      flexDirection: 'row',
    },
    overlayBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.1)', // Transparent overlay with 30% opacity
    },
    languageList: {
      width: '80%',
      maxHeight: '70%', // Limits the list height to avoid covering the whole screen
      backgroundColor: 'rgba(255, 255, 255, 0.9)', // Semi-transparent white background for the list
      borderRadius: 10,
    },
    languageItem: {
      padding: 16,
      fontSize: 18,
      textAlign: 'center',
      color: 'black',
    },
  });

  uuidv4();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [languageFrom, setLanguageFrom] = useState('Detect Language');
  const [languageCodeFrom, setLanguageCodeFrom] = useState('');
  const [languageCodeTo, setLanguageCodeTo] = useState('es');
  const [languageTo, setLanguageTo] = useState('Spanish');
  const [selectLanguageMode, setSelectLanguageMode] = useState<'from' | 'to' | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState(''); // Store recognized text
  const [hasPermission, setHasPermission] = useState(false);

  const translateText = useCallback(async () => {
    const subscriptionKey = process.env.EXPO_PUBLIC_Azure_Translate_Key;
    const endpoint = process.env.EXPO_PUBLIC_Azure_Translate_Endpoint;
    let location = 'uaenorth';

    axios({
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
        to: languageCodeTo,
      },
      data: [
        {
          text: input,
        },
      ],
      responseType: 'json',
    }).then(function (response) {
      if (!response.data[0].translations[0].text) {
        console.error('No translation found');
        return;
      }
      console.log(response.data[0].detectedLanguage.language);
      setLanguageCodeFrom(response.data[0].detectedLanguage.language);
      setLanguageFrom(
        languages.find((language) => language.code === response.data[0].detectedLanguage.language)
          ?.name || 'Checking...'
      );
      setOutput(response.data[0].translations[0].text);
    });
  }, [input, languageCodeTo]);

  useEffect(() => {
    if (input) {
      translateText(); // Trigger translation when input is updated
    }
  });

  // Initialize Voice listeners

  const copyToClipboard = () => {
    if (output) {
      Clipboard.setStringAsync(output);
      Alert.alert('Text copied to clipboard!');
    } else {
      Alert.alert('No text to copy.');
    }
  };
  if (selectLanguageMode) {
    return (
      <Modal
        transparent={true} // Makes the modal background transparent
        animationType="fade"
        visible={selectLanguageMode !== null} // Modal is visible when selectLanguageMode is not null
        onRequestClose={() => setSelectLanguageMode(null)} // Close modal on back button press (Android)
      >
        <View style={styles.modalContainer}>
          {/* Touchable area outside the list to close the modal */}
          <TouchableOpacity
            style={styles.overlayBackground}
            onPress={() => setSelectLanguageMode(null)} // Close the modal if user taps outside
          />

          {/* Language selection list */}
          <FlatList
            style={styles.languageList}
            data={languages.filter(
              (language) => selectLanguageMode === 'from' || language.name !== 'Detect Language'
            )}
            renderItem={({ item }) => (
              <Text
                onPress={() => {
                  if (selectLanguageMode === 'from') {
                    setLanguageFrom(item.name);
                    setLanguageCodeFrom(item.code);
                  } else {
                    setLanguageTo(item.name);
                    setLanguageCodeTo(item.code);
                  }
                  setSelectLanguageMode(null);
                  // Close the modal after selection
                }}
                style={styles.languageItem}>
                {item.name}
              </Text>
            )}
          />
        </View>
      </Modal>
    );
  }

  const textToSpeech = async () => {
    if (!output) {
      console.error('No text to speak');
      return;
    }
    const subscriptionKey = process.env.EXPO_PUBLIC_AZURE_SUB_KEY;
    const location = 'uaenorth'; // e.g., 'westus'
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
        <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${voiceCode}' xmlns:mstts='http://www.microsoft.com/speech/synthesis/mstts'>
          <voice  name='${voiceName}' xml:lang='${voiceCode}'>
          <prosody rate='-10.00%' pitch='-10.00%'>${output}</prosody>
          </voice>
        </speak>
        `,
        responseType: 'arraybuffer',
      });
      const base64Audio = encode(response.data);
      const audioUrl = `data:audio/mp3;base64,${base64Audio}`;
      setAudioUrl(audioUrl);

      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl }, { shouldPlay: true });
      await sound.playAsync();
    } catch (error) {
      console.error('Text-to-Speech error:', error);
    }
  };

  const startSpeechToText = () => {
    if (languageFrom === 'Detect Language') {
      console.error('Please select a language');
      return;
    }
    const subscriptionKey = process.env.EXPO_PUBLIC_AZURE_SUB_KEY;
    const location = 'uaenorth'; // Your Azure region

    if (!subscriptionKey) {
      console.error('Azure Cognitive Services subscription key is required');
      return;
    }

    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(subscriptionKey, location);
    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();

    // Use the SpeechRecognizer without language auto-detection
    const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

    recognizer.recognizeOnceAsync(
      (result) => {
        if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
          console.log('Recognized: ', result);
          setInput(result.text); // Set the recognized text as the input

          // Automatically translate the recognized text
          translateText(); // No need to pass the language, Azure Translate will auto-detect
        } else {
          console.error('Speech recognition failed:', result.errorDetails);
        }
        recognizer.close();
      },
      (error) => {
        console.error('Speech recognition error:', error);
      }
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View style={styles.container}>
              <Text className="text-3xl font-semibold text-black">Translate</Text>
              <Text className="text-2xl font-bold text-purple-800">Mate</Text>
            </View>
          ),
        }}
      />
      {/* Language selector */}
      <View className="">
        <View className="mx-auto flex w-full flex-row items-center border-b-2 border-gray-400 p-6 text-center md:w-8/12">
          <Text
            className="w-1/3 text-center text-lg font-semibold text-purple-800"
            onPress={() => setSelectLanguageMode('from')}>
            {languageFrom}
          </Text>
          <View className="flex w-1/3 flex-col items-center">
            <FontAwesome5
              onPress={() => {
                setLanguageFrom(languageTo);
                setLanguageTo(languageFrom);
              }}
              name="exchange-alt"
              size={20}
              color="gray"
            />
          </View>
          <Text
            className="w-1/3 text-center text-lg font-semibold text-purple-800"
            onPress={() => setSelectLanguageMode('to')}>
            {languageTo}
          </Text>
        </View>
        <View className="flex flex-col gap-y-4 bg-gray-100">
          {/* Input */}
          <View className="mx-auto w-full rounded-lg md:w-8/12">
            <View className="flex flex-row items-baseline justify-between p-6">
              {/* Input */}
              <TextInput
                className="w-full rounded-lg text-lg font-medium focus:outline-none"
                multiline
                value={input}
                onChangeText={setInput}
                maxLength={5000}
                placeholderTextColor={'rgba(22,22,22,0.6)'}
                placeholder="Hello"
              />
              {/* Send button */}
              <FontAwesome5
                name="arrow-circle-right"
                onPress={translateText}
                size={24}
                className="cursor-pointer text-purple-900"
              />
            </View>
            <View className="flex flex-row justify-between p-6">
              {/* Mic button */}
              <FontAwesome5
                name={isListening ? 'microphone' : 'microphone-slash'}
                size={20}
                className="cursor-pointer text-gray-500"
                onPress={startSpeechToText}
              />
              {/* Word Count */}
              <Text className=" text-gray-500">{input.length}/5000</Text>
            </View>
          </View>
          {/* Output */}

          <View className="mx-auto w-full rounded-lg bg-gray-300/80 md:w-8/12">
            <View className="flex flex-row items-baseline justify-between p-6">
              {/* Output */}
              <Text className="w-full rounded-lg text-lg font-medium focus:outline-none">
                {output}
              </Text>
              {/* Play button */}
            </View>
            <View className="flex flex-row justify-between p-6">
              {/* Speaker button */}
              <FontAwesome5
                name="volume-up"
                onPress={textToSpeech}
                size={20}
                className="cursor-pointer text-gray-500"
              />
              {/* Copy button */}
              <FontAwesome5
                name="copy"
                size={20}
                className="cursor-pointer text-gray-500"
                onPress={copyToClipboard}
              />
            </View>
          </View>
        </View>
      </View>
      <Analytics />
    </>
  );
}
