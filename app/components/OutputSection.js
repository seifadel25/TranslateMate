import React from 'react';
import { View, Text, FontAwesome5 } from 'react-native';

const OutputSection = ({ output, textToSpeech, copyToClipboard }) => {
  return output ? (
    <View className="mx-auto w-full rounded-lg bg-gray-300/80 md:w-8/12">
      <View className="flex flex-row items-baseline justify-between p-6">
        <Text className="w-full rounded-lg text-lg font-medium focus:outline-none">{output}</Text>
      </View>
      <View className="flex flex-row justify-between p-6">
        <FontAwesome5
          name="volume-up"
          onPress={textToSpeech}
          size={20}
          className="cursor-pointer text-gray-500"
        />
        <FontAwesome5
          name="copy"
          size={20}
          className="cursor-pointer text-gray-500"
          onPress={copyToClipboard}
        />
      </View>
    </View>
  ) : null;
};

export default OutputSection;
