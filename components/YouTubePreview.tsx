import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './ThemedText';

interface YouTubePreviewProps {
  videoId: string;
}

export function YouTubePreview({ videoId }: YouTubePreviewProps) {
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/0.jpg`;
  
  useEffect(() => {
    fetchVideoTitle();
  }, [videoId]);
  
  const fetchVideoTitle = async () => {
    try {
      const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (response.ok) {
        const data = await response.json();
        setVideoTitle(data.title);
      }
    } catch (error) {
      console.error('Error fetching YouTube title:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = () => {
    Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`);
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        { backgroundColor: Colors[colorScheme ?? 'light'].background }
      ]} 
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.thumbnailContainer}>
        <Image 
          source={{ uri: thumbnailUrl }}
          style={styles.thumbnail}
          contentFit="cover"
        />
        <View style={styles.playButton}>
          <MaterialIcons name="play-arrow" size={30} color="#FFFFFF" />
        </View>
      </View>
      {videoTitle && (
        <View style={[
          styles.titleContainer,
          { borderTopColor: Colors[colorScheme ?? 'light'].border }
        ]}>
          <ThemedText numberOfLines={2} style={styles.title}>
            {videoTitle}
          </ThemedText>
          <ThemedText style={styles.sourceText}>YouTube</ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  thumbnailContainer: {
    position: 'relative',
    aspectRatio: 16/9,
  },
  thumbnail: {
    flex: 1,
    backgroundColor: '#222',
  },
  playButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  titleContainer: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  sourceText: {
    fontSize: 12,
    color: '#777',
    marginLeft: 8,
  }
}); 