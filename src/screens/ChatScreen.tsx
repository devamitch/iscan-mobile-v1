'use client'

import { GlassCard } from '@/components/ui/GlassCard/GlassCard'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useAI } from '@/services/ai/AIProvider'
import { hapticFeedback } from '@/utils/haptics'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialIcons'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  typing?: boolean
}

interface ChatScreenProps {
  navigation: any
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ navigation }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your AI assistant. How can I help you with biometric scanning today?",
      isUser: false,
      timestamp: new Date(),
    },
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const flatListRef = useRef<FlatList>(null)
  const { aiService } = useAI()
  const { trackEvent } = useAnalytics()

  useEffect(() => {
    trackEvent('chat_screen_opened')
  }, [trackEvent])

  const sendMessage = async () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)
    hapticFeedback('light')

    try {
      const response = await aiService.sendMessage(inputText.trim())

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
      trackEvent('ai_message_sent', { messageLength: inputText.length })
    } catch (error) {
      console.error('AI response error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      hapticFeedback('error')
    } finally {
      setIsTyping(false)
    }
  }

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageContainer, item.isUser ? styles.userMessageContainer : styles.aiMessageContainer]}>
      <GlassCard style={[styles.messageCard, item.isUser ? styles.userMessageCard : styles.aiMessageCard]}>
        <Text style={[styles.messageText, item.isUser ? styles.userMessageText : styles.aiMessageText]}>
          {item.text}
        </Text>
        <Text style={styles.timestamp}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </GlassCard>
    </View>
  )

  const renderTypingIndicator = () => {
    if (!isTyping) return null

    return (
      <View style={styles.typingContainer}>
        <GlassCard style={styles.typingCard}>
          <View style={styles.typingDots}>
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
          </View>
        </GlassCard>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              hapticFeedback('selection')
              navigation.goBack()
            }}
          >
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Assistant</Text>
          <TouchableOpacity style={styles.menuButton}>
            <Icon name="more-vert" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderTypingIndicator}
        />

        {/* Input */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inputContainer}>
          <GlassCard style={styles.inputCard}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message..."
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isTyping}
            >
              <Icon name="send" size={24} color={inputText.trim() ? '#667eea' : 'rgba(255, 255, 255, 0.5)'} />
            </TouchableOpacity>
          </GlassCard>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  menuButton: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  messageCard: {
    maxWidth: '80%',
    padding: 12,
  },
  userMessageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  aiMessageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  aiMessageText: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'right',
  },
  typingContainer: {
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  typingCard: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 2,
  },
  dot1: {
    animationDelay: '0s',
  },
  dot2: {
    animationDelay: '0.2s',
  },
  dot3: {
    animationDelay: '0.4s',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    padding: 8,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
})
