import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Switch,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── PUZZLE DATA ────────────────────────────────────────────────────────────
const PUZZLE = {
  grid: [
    ['C', 'L', 'U', 'E', null],
    ['R', 'O', 'O', 'K', null],
    ['O', 'S', 'S', 'W', null],
    ['W', 'I', 'E', 'R', null],
    ['D', 'W', 'R', 'D', null],
  ],
  acrossClues: [
    { row: 0, number: 1, clue: 'Hint or puzzle (4)' },
    { row: 1, number: 4, clue: 'Chess piece (4)' },
    { row: 2, number: 6, clue: 'Chess piece (4)' },
    { row: 3, number: 8, clue: 'Welder works on this (4)' },
    { row: 4, number: 9, clue: 'Word or speech (4)' },
  ],
  downClues: [
    { col: 0, number: 1, clue: 'Card game (5)' },
    { col: 1, number: 2, clue: 'Pile of leaves (5)' },
    { col: 2, number: 3, clue: 'Moss-like growth (5)' },
    { col: 3, number: 5, clue: 'Bird that crows (5)' },
  ],
};

// ─── DEFAULT SETTINGS ───────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  darkMode: false,
  vibration: true,
  soundEffects: true,
  music: true,
  animations: true,
};

const SETTINGS_KEY = 'aword_settings';

// ─── COMPONENT ──────────────────────────────────────────────────────────────
export default function CrosswordGame() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [answers, setAnswers] = useState(
    PUZZLE.grid.map((row) => row.map((cell) => (cell ? '' : null)))
  );
  const [isComplete, setIsComplete] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [audioReady, setAudioReady] = useState(false);

  // Audio refs
  const bgMusicRef = useRef(null);
  const soundEffects = useRef({
    success: null,
    error: null,
    applause: null,
    sadTone: null,
    cheer: null,
    boo: null,
  });

  // Keep a ref of the latest settings to avoid stale closures
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // ─── Load settings from AsyncStorage ────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(SETTINGS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        }
      } catch (error) {
        console.log('Error loading settings:', error);
      }
    })();
  }, []);

  // ─── Setup background music ─────────────────────────────────────────────
  useEffect(() => {
    if (settings.music && audioReady) {
      (async () => {
        try {
          await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
          if (bgMusicRef.current) {
            await bgMusicRef.current.unloadAsync();
          }
          const { sound } = await Audio.Sound.createAsync(
            require('../assets/background_music.mp3'),
            { shouldPlay: true, isLooping: true, volume: 0.3 }
          );
          bgMusicRef.current = sound;
        } catch (error) {
          console.log('Background music error:', error.message);
        }
      })();
    } else {
      // Stop music
      (async () => {
        if (bgMusicRef.current) {
          try {
            await bgMusicRef.current.stopAsync();
            await bgMusicRef.current.unloadAsync();
          } catch (error) {
            // Sound may already be unloaded
          }
          bgMusicRef.current = null;
        }
      })();
    }
    return () => {
      if (bgMusicRef.current) {
        try {
          bgMusicRef.current.unloadAsync();
        } catch (e) {
          // ignore
        }
        bgMusicRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.music, audioReady]);

  // ─── Load sound effects ─────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const fileMap = {
          success: require('../assets/success.mp3'),
          error: require('../assets/error.mp3'),
          applause: require('../assets/applause.mp3'),
          sadTone: require('../assets/sad_tone.mp3'),
          cheer: require('../assets/cheer.mp3'),
          boo: require('../assets/boo.mp3'),
        };

        for (const name of Object.keys(fileMap)) {
          const { sound } = await Audio.Sound.createAsync(fileMap[name]);
          soundEffects.current[name] = sound;
        }
        setAudioReady(true);
      } catch (error) {
        console.log('Sound effects load error:', error.message);
        setAudioReady(true); // Still mark ready so app works without audio
      }
    })();

    return () => {
      for (const key of Object.keys(soundEffects.current)) {
        if (soundEffects.current[key]) {
          try {
            soundEffects.current[key].unloadAsync();
          } catch (error) {
            // ignore
          }
          soundEffects.current[key] = null;
        }
      }
    };
  }, []);

  // ─── SETTINGS MANAGEMENT ────────────────────────────────────────────────
  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.log('Error saving settings:', error);
    }
  };

  const toggleSetting = async (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const playSound = useCallback(async (name) => {
    const currentSettings = settingsRef.current;
    if (!currentSettings.soundEffects || !audioReady) return;
    const sound = soundEffects.current[name];
    if (sound) {
      try {
        await sound.setPositionAsync(0);
        await sound.playAsync();
      } catch (error) {
        console.log(`Error playing ${name}:`, error.message);
      }
    }
  }, [audioReady]);

  // ─── GAME LOGIC ─────────────────────────────────────────────────────────
  const checkCellCorrectness = useCallback((newAnswers, row, col) => {
    const cellValue = newAnswers[row][col];
    const correctValue = PUZZLE.grid[row][col];

    if (cellValue && cellValue === correctValue) {
      return 'correct';
    } else if (cellValue && cellValue !== correctValue) {
      return 'wrong';
    }
    return null;
  }, []);

  const checkPuzzleCompletion = useCallback((currentAnswers) => {
    let complete = true;
    let allCorrect = true;

    for (let r = 0; r < PUZZLE.grid.length; r++) {
      for (let c = 0; c < PUZZLE.grid[r].length; c++) {
        if (PUZZLE.grid[r][c] !== null) {
          if (!currentAnswers[r][c]) {
            complete = false;
            break;
          }
          if (currentAnswers[r][c] !== PUZZLE.grid[r][c]) {
            allCorrect = false;
          }
        }
      }
      if (!complete) break;
    }

    return { complete, allCorrect };
  }, []);

  const handleCellChange = useCallback(
    (row, col, value) => {
      const newAnswers = answers.map((r, ri) =>
        r.map((c, ci) => {
          if (ri === row && ci === col) {
            return value.toUpperCase().slice(-1);
          }
          return c;
        })
      );
      setAnswers(newAnswers);

      // Check single cell correctness
      const result = checkCellCorrectness(newAnswers, row, col);
      const currentSettings = settingsRef.current;

      if (result === 'correct') {
        playSound('success');
        if (currentSettings.vibration) {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (e) {
            // ignore
          }
        }
        if (currentSettings.animations) {
          setAnimationKey((k) => k + 1);
        }
      } else if (result === 'wrong') {
        playSound('error');
        if (currentSettings.vibration) {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          } catch (e) {
            // ignore
          }
        }
      }

      // Check if puzzle is complete
      const { complete, allCorrect } = checkPuzzleCompletion(newAnswers);
      if (complete) {
        setIsComplete(true);
        if (allCorrect) {
          playSound('applause');
          setTimeout(() => playSound('cheer'), 1500);
          if (currentSettings.vibration) {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e) {
              // ignore
            }
          }
          setTimeout(() => {
            Alert.alert(
              'Congratulations!',
              'You completed the crossword puzzle!',
              [{ text: 'Play Again', onPress: resetPuzzle }]
            );
          }, 1000);
        } else {
          playSound('sadTone');
          setTimeout(() => playSound('boo'), 1500);
          if (currentSettings.vibration) {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            } catch (e) {
              // ignore
            }
          }
          setTimeout(() => {
            Alert.alert(
              'Not quite right...',
              'Some answers are incorrect. Keep trying!',
              [{ text: 'OK' }]
            );
          }, 1000);
        }
      }
    },
    [answers, checkCellCorrectness, checkPuzzleCompletion, playSound]
  );

  const resetPuzzle = useCallback(() => {
    setAnswers(
      PUZZLE.grid.map((row) => row.map((cell) => (cell ? '' : null)))
    );
    setIsComplete(false);
  }, []);

  // ─── RENDER ─────────────────────────────────────────────────────────────
  const isDark = settings.darkMode;

  return (
    <KeyboardAvoidingView
      style={[styles.container, isDark && styles.darkContainer]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'android' ? 0 : undefined}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#1a1a2e' : '#FF6600'}
      />

      {/* Header */}
      <View style={[styles.header, isDark && styles.darkHeader]}>
        <Text style={[styles.headerTitle, isDark && styles.darkText]}>
          A word
        </Text>
        <TouchableOpacity
          style={[styles.settingsBtn, isDark && styles.darkSettingsBtn]}
          onPress={() => setShowSettings(true)}
        >
          <Text style={[styles.settingsIcon, isDark && styles.darkText]}>
            ⚙️
          </Text>
        </TouchableOpacity>
      </View>

      {/* Crossword Grid */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animatable.View
          key={animationKey}
          animation={settings.animations ? 'fadeIn' : undefined}
          duration={300}
          style={styles.gridContainer}
        >
          {PUZZLE.grid.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((cell, colIndex) => {
                if (cell === null) {
                  return (
                    <View
                      key={colIndex}
                      style={[styles.blockedCell, isDark && styles.darkBlocked]}
                    />
                  );
                }

                const isCorrect =
                  answers[rowIndex][colIndex] &&
                  answers[rowIndex][colIndex] === cell;
                const cellColor = isCorrect
                  ? '#4CAF50'
                  : isDark
                  ? '#2a2a4a'
                  : '#FFFFFF';

                return (
                  <TextInput
                    key={colIndex}
                    style={[
                      styles.cell,
                      isDark && styles.darkCell,
                      { backgroundColor: cellColor },
                      isCorrect && styles.correctCell,
                    ]}
                    maxLength={1}
                    value={answers[rowIndex][colIndex] || ''}
                    onChangeText={(val) =>
                      handleCellChange(rowIndex, colIndex, val)
                    }
                    keyboardType="default"
                    autoCapitalize="characters"
                    returnKeyType="next"
                    placeholderTextColor={isDark ? '#888' : '#ccc'}
                  />
                );
              })}
            </View>
          ))}
        </Animatable.View>

        {/* Clues Section */}
        <View style={[styles.cluesContainer, isDark && styles.darkClues]}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
            Across
          </Text>
          {PUZZLE.acrossClues.map((clue, i) => (
            <Text
              key={`a-${i}`}
              style={[styles.clueText, isDark && styles.darkText]}
            >
              {clue.number}. {clue.clue}
            </Text>
          ))}

          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
            Down
          </Text>
          {PUZZLE.downClues.map((clue, i) => (
            <Text
              key={`d-${i}`}
              style={[styles.clueText, isDark && styles.darkText]}
            >
              {clue.number}. {clue.clue}
            </Text>
          ))}
        </View>

        {/* Reset Button */}
        <TouchableOpacity
          style={[styles.resetBtn, isDark && styles.darkResetBtn]}
          onPress={resetPuzzle}
        >
          <Text style={styles.resetText}>Reset Puzzle</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Settings Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showSettings}
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.darkModal]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.darkText]}>
                Settings
              </Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Text style={[styles.closeBtn, isDark && styles.darkText]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, isDark && styles.darkText]}>
                Dark Mode
              </Text>
              <Switch
                value={settings.darkMode}
                onValueChange={() => toggleSetting('darkMode')}
                trackColor={{ false: '#ccc', true: '#4CAF50' }}
                thumbColor={settings.darkMode ? '#FF6600' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, isDark && styles.darkText]}>
                Vibration
              </Text>
              <Switch
                value={settings.vibration}
                onValueChange={() => toggleSetting('vibration')}
                trackColor={{ false: '#ccc', true: '#4CAF50' }}
                thumbColor={settings.vibration ? '#FF6600' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, isDark && styles.darkText]}>
                Sound Effects
              </Text>
              <Switch
                value={settings.soundEffects}
                onValueChange={() => toggleSetting('soundEffects')}
                trackColor={{ false: '#ccc', true: '#4CAF50' }}
                thumbColor={settings.soundEffects ? '#FF6600' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, isDark && styles.darkText]}>
                Background Music
              </Text>
              <Switch
                value={settings.music}
                onValueChange={() => toggleSetting('music')}
                trackColor={{ false: '#ccc', true: '#4CAF50' }}
                thumbColor={settings.music ? '#FF6600' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, isDark && styles.darkText]}>
                Animations
              </Text>
              <Switch
                value={settings.animations}
                onValueChange={() => toggleSetting('animations')}
                trackColor={{ false: '#ccc', true: '#4CAF50' }}
                thumbColor={settings.animations ? '#FF6600' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Win Animation Overlay */}
      {isComplete && (
        <Animatable.View
          style={StyleSheet.absoluteFill}
          animation="bounceIn"
          duration={800}
          pointerEvents="none"
        >
          <View style={styles.winOverlay}>
            <Animatable.Text
              animation="tada"
              duration={1000}
              iterationCount="infinite"
              style={styles.winText}
            >
              WIN!
            </Animatable.Text>
          </View>
        </Animatable.View>
      )}
    </KeyboardAvoidingView>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E6',
  },
  darkContainer: {
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 15,
    backgroundColor: '#FF6600',
  },
  darkHeader: {
    backgroundColor: '#16213e',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  settingsBtn: {
    padding: 8,
  },
  darkSettingsBtn: {
    backgroundColor: 'transparent',
  },
  settingsIcon: {
    fontSize: 24,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  gridContainer: {
    marginTop: 20,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#FF6600',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  cell: {
    width: 55,
    height: 55,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    margin: 2,
    borderRadius: 4,
  },
  darkCell: {
    borderColor: '#444',
    color: '#FFFFFF',
    backgroundColor: '#2a2a4a',
  },
  correctCell: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  blockedCell: {
    width: 55,
    height: 55,
    backgroundColor: '#333333',
    margin: 2,
    borderRadius: 4,
  },
  darkBlocked: {
    backgroundColor: '#0a0a1a',
  },
  cluesContainer: {
    marginTop: 25,
    paddingHorizontal: 20,
    width: '100%',
  },
  darkClues: {
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6600',
    marginTop: 15,
    marginBottom: 8,
  },
  clueText: {
    fontSize: 15,
    color: '#333333',
    marginBottom: 5,
    lineHeight: 22,
  },
  darkText: {
    color: '#FFFFFF',
  },
  resetBtn: {
    marginTop: 20,
    backgroundColor: '#FF6600',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  darkResetBtn: {
    backgroundColor: '#FF8C00',
  },
  resetText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 25,
    minHeight: 400,
  },
  darkModal: {
    backgroundColor: '#16213e',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
  },
  closeBtn: {
    fontSize: 24,
    color: '#333333',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333333',
  },
  // Win overlay
  winOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  winText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
  },
});
