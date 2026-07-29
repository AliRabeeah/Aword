import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';

export default function SplashScreen() {
  const navigation = useNavigation();
  const soundRef = useRef(null);

  useEffect(() => {
    playIntroMusic();

    const timer = setTimeout(() => {
      navigation.replace('CrosswordGame');
    }, 3500);

    return () => {
      clearTimeout(timer);
      if (soundRef.current) {
        try {
          soundRef.current.unloadAsync();
        } catch (e) {
          // Sound may already be unloaded
        }
      }
    };
  }, [navigation]);

  const playIntroMusic = async () => {
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/intro_music.mp3')
      );
      soundRef.current = sound;
      await sound.playAsync();
    } catch (error) {
      console.log('Intro music error:', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Animatable.View
        animation="fadeInDown"
        duration={1000}
        style={styles.logoContainer}
      >
        <Image
          source={require('../assets/icon_orange.png')}
          style={styles.logo}
        />
      </Animatable.View>

      <Animatable.View
        animation="fadeInUp"
        duration={1500}
        delay={500}
        style={styles.textContainer}
      >
        <Animatable.Text
          animation="pulse"
          duration={2000}
          iterationCount="infinite"
          style={styles.title}
        >
          A word
        </Animatable.Text>
        <Animatable.Text
          animation="fadeIn"
          duration={2000}
          delay={1000}
          style={styles.subtitle}
        >
          by Ali Halim
        </Animatable.Text>
      </Animatable.View>

      <Animatable.View
        animation="fadeIn"
        duration={2000}
        delay={1500}
        style={styles.bottomText}
      >
        <Animatable.Text
          animation="tada"
          duration={3000}
          iterationCount={2}
          style={styles.credit}
        >
          Crossword Puzzle Game
        </Animatable.Text>
      </Animatable.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6600',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 30,
  },
  logo: {
    width: 200,
    height: 200,
    borderRadius: 40,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFE0B2',
    marginTop: 10,
    fontStyle: 'italic',
  },
  bottomText: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  credit: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});
