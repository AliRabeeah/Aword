// This must be the first import so gesture-handler installs itself
// before any other module (including React Navigation) is loaded.
// Omitting this is a documented cause of crashes in production builds.
import 'react-native-gesture-handler';

import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App)
// and also handles setting up the environment (Expo Go vs. standalone build).
// Without this call, there is no root component registered with the native
// side, so the app has nothing to render and immediately closes on launch.
registerRootComponent(App);
