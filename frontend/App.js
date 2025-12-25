import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-native-markdown-display';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ChatGPT = () => {
  const [data, setData] = useState([]); 
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef();

  const apiUrl = 'https://unknelled-odin-wispier.ngrok-free.dev/api/chat';

  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedHistory = await AsyncStorage.getItem('@nutrisnap_history');
        if (savedHistory !== null) {
          setData(JSON.parse(savedHistory));
        }
      } catch (e) {
        console.error("Failed to load history", e);
      }
    };
    loadSavedData();
  }, []);

  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('@nutrisnap_history', JSON.stringify(data));
      } catch (e) {
        console.error("Failed to save history", e);
      }
    };
    saveData();
  }, [data]);

  const startNewChat = () => {
    Alert.alert(
      "New Chat",
      "Do you want to clear current conversation history?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          onPress: async () => {
            setData([]); 
            await AsyncStorage.removeItem('@nutrisnap_history');
          },
          style: "destructive" 
        },
      ]
    );
  };

  const handleSend = async () => {
    if (textInput.trim() === '') return;

    const userMessage = { role: 'user', text: textInput };
    const updatedHistory = [...data, userMessage];
    
    setData(updatedHistory);
    const messageToSend = textInput;
    setTextInput('');
    setLoading(true);

    try {
      const formattedHistory = updatedHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

      const response = await axios.post(apiUrl, { history: formattedHistory });
      
      const botText = response.data.reply;
      setData([...updatedHistory, { role: 'assistant', text: botText }]);
    } catch (error) {
      console.error(error);
      setData([...updatedHistory, { role: 'assistant', text: "I'm having trouble connecting. Is the backend live?" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Text style={{ fontSize: 20 }}>🍎</Text>
              </View>
              <View>
                <Text style={styles.headerTitle}>NutriSnap AI</Text>
                <Text style={styles.headerSubtitle}>Personal Nutritionist</Text>
              </View>
            </View>
            <TouchableOpacity onPress={startNewChat} style={styles.newChatButton}>
              <Ionicons name="add-circle-outline" size={28} color="#2E7D32" />
            </TouchableOpacity>
          </View>
        </View>

        {/* CHAT BODY */}
        <FlatList
          ref={flatListRef}
          data={data}
          keyExtractor={(item, index) => index.toString()}
          style={styles.chatBody}
          contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 15 }}
          onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View style={[styles.messageWrapper, item.role === 'user' ? styles.userWrapper : styles.botWrapper]}>
              <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.botBubble]}>
                
                {/* 🟢 LOGIC: Use normal text for User, Markdown for Bot */}
                {item.role === 'user' ? (
                   <Text style={styles.userText}>{item.text}</Text>
                ) : (
                   <Markdown style={markdownStyles}>
                     {item.text}
                   </Markdown>
                )}

              </View>
            </View>
          )}
        />

        {loading && (
          <View style={styles.loadingArea}>
            <Text style={styles.loadingText}>NutriSnap is thinking...</Text>
          </View>
        )}

        {/* INPUT AREA */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={textInput}
              onChangeText={setTextInput}
              placeholder="Type a health question..."
              placeholderTextColor="#99AA99"
            />
            <TouchableOpacity 
                style={[styles.sendButton, { backgroundColor: textInput.trim() ? '#2E7D32' : '#A5D6A7' }]} 
                onPress={handleSend}
                disabled={!textInput.trim() || loading}
            >
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatGPT;

// 🟢 PROFESSIONAL MARKDOWN STYLES
const markdownStyles = StyleSheet.create({
  body: {
    color: '#334433',
    fontSize: 15,
    lineHeight: 22,
  },
  strong: {
    fontWeight: 'bold',
    color: '#1B5E20', // Bold text in deep green
  },
  bullet_list: {
    marginVertical: 10,
  },
  list_item: {
    marginVertical: 5,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  heading3: {
    color: '#1B5E20',
    fontWeight: '800',
    marginVertical: 5,
  },
  paragraph: {
    marginBottom: 8,
  }
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F1F8E9' },
  container: { flex: 1 },
  header: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0EADF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1B5E20' },
  headerSubtitle: { fontSize: 11, color: '#689F38', fontWeight: '500' },
  newChatButton: { padding: 5 },
  chatBody: { flex: 1 },
  messageWrapper: { marginVertical: 6, flexDirection: 'row', width: '100%' },
  userWrapper: { justifyContent: 'flex-end' },
  botWrapper: { justifyContent: 'flex-start' },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22,
    maxWidth: '85%',
  },
  userBubble: { backgroundColor: '#2E7D32', borderBottomRightRadius: 4 },
  botBubble: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E8F5E9' },
  messageText: { fontSize: 16, lineHeight: 22 },
  userText: { color: '#FFFFFF' },
  botText: { color: '#334433' },
  loadingArea: { paddingHorizontal: 20, paddingVertical: 5 },
  loadingText: { fontSize: 12, color: '#2E7D32', fontStyle: 'italic' },
  inputWrapper: { paddingHorizontal: 15, paddingBottom: Platform.OS === 'ios' ? 10 : 20, paddingTop: 10 },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    elevation: 5,
  },
  input: { flex: 1, height: 40, color: '#1B5E20', fontSize: 15 },
  sendButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
});