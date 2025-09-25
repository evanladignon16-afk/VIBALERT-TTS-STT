// VIBALERT - REAL Web Speech API Implementation
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

// REAL Web Speech Recognition Hook
const useWebSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        setIsSupported(true);
        
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
          console.log('Web Speech Recognition started');
          setIsListening(true);
          setError('');
        };
        
        recognition.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          if (finalTranscript) {
            setTranscript(prev => prev + finalTranscript);
            console.log('Final result:', finalTranscript);
          }
          
          setInterimTranscript(interimTranscript);
        };
        
        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          
          let errorMessage = '';
          switch (event.error) {
            case 'not-allowed':
              errorMessage = 'Microphone access denied. Please allow microphone permissions.';
              break;
            case 'no-speech':
              errorMessage = 'No speech detected. Please try again.';
              break;
            case 'audio-capture':
              errorMessage = 'No microphone found. Please check your microphone.';
              break;
            case 'network':
              errorMessage = 'Network error. Please check your connection.';
              break;
            default:
              errorMessage = `Speech recognition error: ${event.error}`;
          }
          
          setError(errorMessage);
          setIsListening(false);
        };
        
        recognition.onend = () => {
          console.log('Speech recognition ended');
          setIsListening(false);
          setInterimTranscript('');
        };
        
      } else {
        setIsSupported(false);
        setError('Web Speech API not supported in this browser. Please use Chrome or Edge.');
      }
    } else {
      setIsSupported(false);
      setError('Please open this app in a web browser for speech recognition.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (!isSupported) {
      Alert.alert('Not Supported', 'Please open this app in Chrome or Edge browser for speech recognition.');
      return;
    }

    try {
      setError('');
      setTranscript('');
      setInterimTranscript('');
      recognitionRef.current?.start();
    } catch (error) {
      setError('Failed to start speech recognition. Please try again.');
    }
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch (error) {
      console.error('Error stopping recognition:', error);
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
    setError('');
  };

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    clearTranscript
  };
};

export default function App() {
  const [textToSpeak, setTextToSpeak] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const {
    isListening,
    transcript,
    interimTranscript,
    error: speechError,
    isSupported,
    startListening,
    stopListening,
    clearTranscript
  } = useWebSpeechRecognition();

  const handleSpeak = async () => {
    if (!textToSpeak.trim()) return;
    
    try {
      setIsSpeaking(true);
      
      await Speech.speak(textToSpeak, {
        language: 'en-US',
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => {
          setIsSpeaking(false);
          Alert.alert('Error', 'Text-to-speech failed');
        }
      });
    } catch (error) {
      setIsSpeaking(false);
      Alert.alert('Error', 'Failed to speak text');
    }
  };

  const handleStopSpeaking = async () => {
    try {
      await Speech.stop();
      setIsSpeaking(false);
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  };

  const copyToInput = () => {
    if (transcript) {
      setTextToSpeak(transcript);
      clearTranscript();
      Alert.alert('Copied!', 'Speech result copied to text input.');
    }
  };

  const fullTranscript = transcript + interimTranscript;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
      <LinearGradient
        colors={['#2c3e50', '#34495e', '#5d6d7e']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>VIBALERT</Text>
            <Text style={styles.subtitle}>Real Speech Recognition</Text>
            <Text style={styles.version}>SOP 2: Live Speech-to-Text</Text>
          </View>

          <View style={styles.statusCard}>
            <Text style={styles.statusText}>📱 Platform: {Platform.OS === 'web' ? 'Web Browser' : 'Mobile'}</Text>
            <Text style={styles.statusText}>🔊 Text-to-Speech: Ready</Text>
            <Text style={styles.statusText}>🎤 Speech-to-Text: {isSupported ? 'REAL Web API Ready' : 'Not Available'}</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🗣️</Text>
              <Text style={styles.sectionTitle}>Text-to-Speech</Text>
            </View>
            
            <TextInput
              style={styles.textInput}
              value={textToSpeak}
              onChangeText={setTextToSpeak}
              placeholder="Type your message here..."
              placeholderTextColor="#7f8c8d"
              multiline
              numberOfLines={4}
            />
            
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]}
              onPress={handleSpeak}
              disabled={isSpeaking || !textToSpeak.trim()}
            >
              <Text style={styles.buttonText}>
                {isSpeaking ? 'Speaking...' : 'Speak Text'}
              </Text>
            </TouchableOpacity>
            
            {isSpeaking && (
              <TouchableOpacity 
                style={[styles.button, styles.dangerButton]}
                onPress={handleStopSpeaking}
              >
                <Text style={styles.buttonText}>Stop</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🎤</Text>
              <Text style={styles.sectionTitle}>REAL Speech Recognition</Text>
            </View>
            
            {!isSupported && (
              <View style={styles.warningCard}>
                <Text style={styles.warningText}>
                  ⚠️ To use REAL speech recognition:
                  {'\n'}1. Install web dependencies: npx expo install react-dom react-native-web @expo/metro-runtime
                  {'\n'}2. Run: npx expo start
                  {'\n'}3. Press 'w' to open in web browser
                  {'\n'}4. Allow microphone access
                </Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={[
                styles.button, 
                styles.listenButton, 
                isListening && styles.listeningButton,
                !isSupported && styles.disabledButton
              ]}
              onPress={isListening ? stopListening : startListening}
              disabled={!isSupported}
            >
              <Text style={styles.buttonText}>
                {isListening ? '🛑 Stop Recognition' : '🎤 Start REAL Recognition'}
              </Text>
            </TouchableOpacity>
            
            {speechError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{speechError}</Text>
              </View>
            )}
            
            {fullTranscript && (
              <View style={styles.transcriptContainer}>
                <Text style={styles.transcriptLabel}>Live Transcript:</Text>
                <Text style={styles.transcriptText}>
                  {transcript}
                  <Text style={styles.interimText}>{interimTranscript}</Text>
                </Text>
              </View>
            )}
            
            {transcript && (
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={[styles.button, styles.secondaryButton]}
                  onPress={copyToInput}
                >
                  <Text style={styles.buttonText}>Copy to Input</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, styles.warningButton]}
                  onPress={clearTranscript}
                >
                  <Text style={styles.buttonText}>Clear</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 5,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#bdc3c7',
    textAlign: 'center',
    marginBottom: 5,
  },
  version: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusText: {
    color: '#ecf0f1',
    fontSize: 14,
    marginBottom: 5,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  button: {
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#27ae60',
  },
  secondaryButton: {
    backgroundColor: '#f39c12',
  },
  dangerButton: {
    backgroundColor: '#e74c3c',
  },
  warningButton: {
    backgroundColor: '#e67e22',
  },
  listenButton: {
    backgroundColor: '#9b59b6',
  },
  listeningButton: {
    backgroundColor: '#e74c3c',
  },
  disabledButton: {
    backgroundColor: '#7f8c8d',
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  warningCard: {
    backgroundColor: 'rgba(230, 126, 34, 0.2)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(230, 126, 34, 0.3)',
  },
  warningText: {
    color: '#e67e22',
    fontSize: 14,
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
  },
  transcriptContainer: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.3)',
  },
  transcriptLabel: {
    color: '#2ecc71',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  transcriptText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
  },
  interimText: {
    color: '#bdc3c7',
    fontStyle: 'italic',
  },
});