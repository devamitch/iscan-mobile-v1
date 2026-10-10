import { io, type Socket } from "socket.io-client"
import { z } from "zod"
import NetInfo from "@react-native-community/netinfo"
import { MMKV } from "react-native-mmkv"

import { API_CONFIG } from "@/config/constants"
import { AnalyticsService } from "@/services/analytics/AnalyticsService"

const storage = new MMKV()

// Zod schemas for socket events
const MessageSchema = z.object({
  id: z.string(),
  content: z.string(),
  senderId: z.string(),
  receiverId: z.string(),
  timestamp: z.number(),
  type: z.enum(["text", "image", "file", "voice"]),
  metadata: z.record(z.any()).optional(),
})

const TypingEventSchema = z.object({
  userId: z.string(),
  isTyping: z.boolean(),
  chatId: z.string(),
})

const PresenceEventSchema = z.object({
  userId: z.string(),
  status: z.enum(["online", "offline", "away"]),
  lastSeen: z.number(),
})

type Message = z.infer<typeof MessageSchema>
type TypingEvent = z.infer<typeof TypingEventSchema>
type PresenceEvent = z.infer<typeof PresenceEventSchema>

interface SocketEventHandlers {
  onMessage: (message: Message) => void
  onTyping: (event: TypingEvent) => void
  onPresence: (event: PresenceEvent) => void
  onConnect: () => void
  onDisconnect: () => void
  onError: (error: Error) => void
}

class SocketServiceClass {
  private socket: Socket | null = null
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private eventHandlers: Partial<SocketEventHandlers> = {}
  private messageQueue: Message[] = []

  constructor() {
    this.setupNetworkListener()
  }

  private setupNetworkListener() {
    NetInfo.addEventListener((state) => {
      if (state.isConnected && !this.isConnected) {
        this.connect()
      } else if (!state.isConnected && this.isConnected) {
        this.disconnect()
      }
    })
  }

  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.socket?.connected) {
          resolve()
          return
        }

        this.socket = io(API_CONFIG.SOCKET_URL, {
          auth: {
            token: token || storage.getString("auth_token"),
          },
          transports: ["websocket"],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
        })

        this.setupEventListeners()

        this.socket.on("connect", () => {
          this.isConnected = true
          this.reconnectAttempts = 0
          this.processMessageQueue()
          this.eventHandlers.onConnect?.()
          AnalyticsService.track("socket_connected")
          resolve()
        })

        this.socket.on("connect_error", (error) => {
          this.isConnected = false
          this.eventHandlers.onError?.(error)
          AnalyticsService.track("socket_connection_error", { error: error.message })
          reject(error)
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  private setupEventListeners() {
    if (!this.socket) return

    this.socket.on("disconnect", (reason) => {
      this.isConnected = false
      this.eventHandlers.onDisconnect?.()
      AnalyticsService.track("socket_disconnected", { reason })
    })

    this.socket.on("message", (data) => {
      try {
        const message = MessageSchema.parse(data)
        this.eventHandlers.onMessage?.(message)
        AnalyticsService.track("message_received", {
          messageId: message.id,
          type: message.type,
        })
      } catch (error) {
        console.error("Invalid message format:", error)
      }
    })

    this.socket.on("typing", (data) => {
      try {
        const typingEvent = TypingEventSchema.parse(data)
        this.eventHandlers.onTyping?.(typingEvent)
      } catch (error) {
        console.error("Invalid typing event format:", error)
      }
    })

    this.socket.on("presence", (data) => {
      try {
        const presenceEvent = PresenceEventSchema.parse(data)
        this.eventHandlers.onPresence?.(presenceEvent)
      } catch (error) {
        console.error("Invalid presence event format:", error)
      }
    })

    this.socket.on("error", (error) => {
      this.eventHandlers.onError?.(new Error(error))
      AnalyticsService.track("socket_error", { error })
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  sendMessage(message: Omit<Message, "id" | "timestamp">): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const fullMessage: Message = {
          ...message,
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        }

        const validatedMessage = MessageSchema.parse(fullMessage)

        if (this.isConnected && this.socket) {
          this.socket.emit("message", validatedMessage, (ack: any) => {
            if (ack?.success) {
              AnalyticsService.track("message_sent", {
                messageId: validatedMessage.id,
                type: validatedMessage.type,
              })
              resolve()
            } else {
              reject(new Error(ack?.error || "Failed to send message"))
            }
          })
        } else {
          // Queue message for later sending
          this.messageQueue.push(validatedMessage)
          resolve()
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  sendTyping(chatId: string, isTyping: boolean) {
    if (this.isConnected && this.socket) {
      this.socket.emit("typing", { chatId, isTyping })
    }
  }

  updatePresence(status: "online" | "offline" | "away") {
    if (this.isConnected && this.socket) {
      this.socket.emit("presence", { status, lastSeen: Date.now() })
    }
  }

  joinRoom(roomId: string) {
    if (this.isConnected && this.socket) {
      this.socket.emit("join_room", roomId)
    }
  }

  leaveRoom(roomId: string) {
    if (this.isConnected && this.socket) {
      this.socket.emit("leave_room", roomId)
    }
  }

  private processMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift()
      if (message) {
        this.socket?.emit("message", message)
      }
    }
  }

  on<K extends keyof SocketEventHandlers>(event: K, handler: SocketEventHandlers[K]) {
    this.eventHandlers[event] = handler
  }

  off<K extends keyof SocketEventHandlers>(event: K) {
    delete this.eventHandlers[event]
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
    }
  }
}

export const SocketService = new SocketServiceClass()
