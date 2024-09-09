import React from 'react';
import { TextInput, View, Text, FontAwesome5 } from 'react-native';

const InputSection = ({ input, setInput, translateText, startSpeechToText }) => {
  return (
    <View className="mx-auto w-full rounded-lg md:w-8/12">
      <View className="flex flex-row items-baseline justify-between p-6">
        <TextInput
          className="w-full rounded-lg text-lg font-medium focus:outline-none"
          multiline
          value={input}
          onChangeText={setInput}
          maxLength={5000}
          placeholderTextColor={'rgba(22,22,22,0.6)'}
          placeholder="Hello"
        />
        <FontAwesome5
          name="arrow-circle-right"
          onPress={translateText}
          size={24}
          className="cursor-pointer text-purple-900"
        />
      </View>
      <View className="flex flex-row justify-between p-6">
        <FontAwesome5
          name="microphone"
          size={20}
          className="cursor-pointer text-gray-500"
          onPress={startSpeechToText}
        />
        <Text className="text-gray-500">{input.length}/5000</Text>
      </View>
    </View>
  );
};

export default InputSection;
