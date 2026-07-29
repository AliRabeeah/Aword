import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from './screens/SplashScreen';
import CrosswordGame from './screens/CrosswordGame';
import * as SplashScreenRN from 'expo-splash-screen';
import { Asset } from 'expo-asset';

const Stack = createStackNavigator();

// Preload all assets before showing the app
async function loadAssets() {
  try {
    await SplashScreenRN.preventAutoHideAsync();
  } catch (e) {
    // Already hidden, ignore
  }

  await Asset.loadAsync([
    require('./assets/icon_orange.png'),
    require('./assets/intro_music.mp3'),
    require('./assets/background_music.mp3'),
    require('./assets/success.mp3'),
    require('./assets/error.mp3'),
    require('./assets/applause.mp3'),
    require('./assets/sad_tone.mp3'),
    require('./assets/cheer.mp3'),
    require('./assets/boo.mp3'),
  ]);
}

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#FF6600" />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await loadAssets();
      } catch (e) {
        console.warn('Error loading assets:', e);
      } finally {
        await SplashScreenRN.hideAsync();
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  if (!appIsReady) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="CrosswordGame" component={CrosswordGame} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF6600',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
