import { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, 
  KeyboardAvoidingView, Platform 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL } from '../../constants/api';

export default function ChatScreen() {
  const { id: matchId, userName } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [myUserId, setMyUserId] = useState<number | null>(null);
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    setupChat();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const setupChat = async () => {
    const storedUserId = await AsyncStorage.getItem('userId');
    const token = await AsyncStorage.getItem('userToken');
    if (storedUserId) setMyUserId(parseInt(storedUserId));

    try {
      const response = await fetch(`${API_URL}/messages/${matchId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const history = await response.json();
        setMessages(history);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
    }

    const socketUrl = API_URL.replace('/api', ''); 
    socketRef.current = io(socketUrl);

    socketRef.current.emit('join_chat', matchId);

    socketRef.current.on('receive_message', (newMessage: any) => {
      setMessages(prev => [newMessage, ...prev]);
    });
  };

  const sendMessage = () => {
    if (!inputText.trim() || !myUserId || !socketRef.current) return;

    const messageData = {
      matchId: parseInt(matchId as string),
      senderId: myUserId,
      text: inputText.trim()
    };

    socketRef.current.emit('send_message', messageData);
    setInputText('');
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.senderId === myUserId;
    return (
      <View style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperThem]}>
        <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
          <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 15) + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#527DA3" />
        </TouchableOpacity>
        <Text style={styles.headerName}>{userName || 'Chat'}</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
      >
        <FlatList
          data={messages}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderMessage}
          inverted 
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10) + 5 }]}>
          <TextInput
            style={styles.input}
            placeholder="Escribe un mensaje..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]} 
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backBtn: { padding: 5 },
  headerName: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  keyboardView: { flex: 1 },
  messageList: { paddingHorizontal: 15, paddingBottom: 20, paddingTop: 10 },
  messageWrapper: { marginVertical: 4, flexDirection: 'row' },
  messageWrapperMe: { justifyContent: 'flex-end' },
  messageWrapperThem: { justifyContent: 'flex-start' },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  myMessage: {
    backgroundColor: '#527DA3',
    borderBottomRightRadius: 5,
  },
  theirMessage: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  messageText: { fontSize: 16, lineHeight: 22 },
  myMessageText: { color: '#fff' },
  theirMessageText: { color: '#333' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd'
  },
  input: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee'
  },
  sendBtn: {
    backgroundColor: '#527DA3',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendBtnDisabled: { backgroundColor: '#a0b9ce' }
});