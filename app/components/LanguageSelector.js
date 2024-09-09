import React from 'react';
import { FlatList, Text } from 'react-native';
import { languages } from '~/assets/languages';

const LanguageSelector = ({
  selectLanguageMode,
  setSelectLanguageMode,
  setLanguageFrom,
  setLanguageCodeFrom,
  setLanguageTo,
  setLanguageCodeTo,
}) => {
  return selectLanguageMode ? (
    <FlatList
      data={languages}
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
          }}
          className="p-2 px-5">
          {item.name}
        </Text>
      )}
    />
  ) : null;
};

export default LanguageSelector;
