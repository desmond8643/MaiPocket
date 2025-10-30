import React from 'react';
import { Linking, StyleSheet, TextStyle } from 'react-native';
import ParsedText from 'react-native-parsed-text';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';


interface FormattedTextProps {
  text: string;
  style?: TextStyle;
}

export const FormattedText: React.FC<FormattedTextProps> = ({ 
  text, 
  style
}) => {
  const colorScheme = useColorScheme();
  
  const handleUrlPress = (url: string) => {
    // Open the URL when clicked
    Linking.openURL(url);
  };

  return (
    <ParsedText
      style={style}
      selectable={true}
      parse={[
        {
          type: 'url',
          style: styles.urlText,
          onPress: handleUrlPress
        }
      ]}
    >
      {text}
    </ParsedText>
  );
};

const styles = StyleSheet.create({
  urlText: {
    color: '#2196F3',
    textDecorationLine: 'underline',
  }
});