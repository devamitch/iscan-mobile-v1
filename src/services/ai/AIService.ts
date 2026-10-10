import { z } from "zod"
import OpenAI from "openai"
import Anthropic from "@anthropic-ai/sdk"

import { AI_CONFIG } from "@/config/constants"
import { AnalyticsService } from "@/services/analytics/AnalyticsService"

// Zod schemas for AI requests and responses
const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  timestamp: z.number().optional(),
})

const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  stream: z.boolean().optional(),
})

const ImageAnalysisRequestSchema = z.object({
  imageUrl: z.string().url(),
  prompt: z.string(),
  model: z.string().optional(),
})

type ChatMessage = z.infer<typeof ChatMessageSchema>
type ChatRequest = z.infer<typeof ChatRequestSchema>
type ImageAnalysisRequest = z.infer<typeof ImageAnalysisRequestSchema>

interface AIResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
  finishReason?: string
}

interface StreamCallback {
  onChunk: (chunk: string) => void
  onComplete: (response: AIResponse) => void
  onError: (error: Error) => void
}

class AIServiceClass {
  private openai: OpenAI | null = null
  private anthropic: Anthropic | null = null

  constructor() {
    this.initializeClients()
  }

  private initializeClients() {
    if (AI_CONFIG.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: AI_CONFIG.OPENAI_API_KEY,
      })
    }

    if (AI_CONFIG.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: AI_CONFIG.ANTHROPIC_API_KEY,
      })
    }
  }

  async chatCompletion(request: ChatRequest): Promise<AIResponse> {
    try {
      const validatedRequest = ChatRequestSchema.parse(request)

      if (!this.openai) {
        throw new Error("OpenAI client not initialized")
      }

      const startTime = Date.now()

      const response = await this.openai.chat.completions.create({
        model: validatedRequest.model || "gpt-4",
        messages: validatedRequest.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: validatedRequest.temperature || AI_CONFIG.TEMPERATURE,
        max_tokens: validatedRequest.maxTokens || AI_CONFIG.MAX_TOKENS,
        stream: false,
      })

      const duration = Date.now() - startTime

      const aiResponse: AIResponse = {
        content: response.choices[0]?.message?.content || "",
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
        model: response.model,
        finishReason: response.choices[0]?.finish_reason || undefined,
      }

      AnalyticsService.track("ai_chat_completion", {
        model: response.model,
        tokens: response.usage?.total_tokens,
        duration,
        finishReason: response.choices[0]?.finish_reason,
      })

      return aiResponse
    } catch (error) {
      AnalyticsService.track("ai_chat_error", {
        error: error instanceof Error ? error.message : "Unknown error",
      })
      throw error
    }
  }

  async streamChatCompletion(request: ChatRequest, callbacks: StreamCallback): Promise<void> {
    try {
      const validatedRequest = ChatRequestSchema.parse(request)

      if (!this.openai) {
        throw new Error("OpenAI client not initialized")
      }

      const startTime = Date.now()
      let fullContent = ""
      const totalTokens = 0

      const stream = await this.openai.chat.completions.create({
        model: validatedRequest.model || "gpt-4",
        messages: validatedRequest.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: validatedRequest.temperature || AI_CONFIG.TEMPERATURE,
        max_tokens: validatedRequest.maxTokens || AI_CONFIG.MAX_TOKENS,
        stream: true,
      })

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || ""
        if (content) {
          fullContent += content
          callbacks.onChunk(content)
        }
      }

      const duration = Date.now() - startTime

      const response: AIResponse = {
        content: fullContent,
        model: validatedRequest.model || "gpt-4",
        usage: {
          promptTokens: 0, // Not available in streaming
          completionTokens: 0,
          totalTokens: totalTokens,
        },
      }

      callbacks.onComplete(response)

      AnalyticsService.track("ai_stream_completion", {
        model: validatedRequest.model || "gpt-4",
        duration,
        contentLength: fullContent.length,
      })
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error("Unknown error")
      callbacks.onError(errorObj)

      AnalyticsService.track("ai_stream_error", {
        error: errorObj.message,
      })
    }
  }

  async analyzeImage(request: ImageAnalysisRequest): Promise<AIResponse> {
    try {
      const validatedRequest = ImageAnalysisRequestSchema.parse(request)

      if (!this.openai) {
        throw new Error("OpenAI client not initialized")
      }

      const startTime = Date.now()

      const response = await this.openai.chat.completions.create({
        model: validatedRequest.model || "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: validatedRequest.prompt },
              {
                type: "image_url",
                image_url: {
                  url: validatedRequest.imageUrl,
                },
              },
            ],
          },
        ],
        max_tokens: AI_CONFIG.MAX_TOKENS,
      })

      const duration = Date.now() - startTime

      const aiResponse: AIResponse = {
        content: response.choices[0]?.message?.content || "",
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
        model: response.model,
        finishReason: response.choices[0]?.finish_reason || undefined,
      }

      AnalyticsService.track("ai_image_analysis", {
        model: response.model,
        tokens: response.usage?.total_tokens,
        duration,
      })

      return aiResponse
    } catch (error) {
      AnalyticsService.track("ai_image_analysis_error", {
        error: error instanceof Error ? error.message : "Unknown error",
      })
      throw error
    }
  }

  async chatWithClaude(request: ChatRequest): Promise<AIResponse> {
    try {
      const validatedRequest = ChatRequestSchema.parse(request)

      if (!this.anthropic) {
        throw new Error("Anthropic client not initialized")
      }

      const startTime = Date.now()

      const response = await this.anthropic.messages.create({
        model: validatedRequest.model || "claude-3-sonnet-20240229",
        max_tokens: validatedRequest.maxTokens || AI_CONFIG.MAX_TOKENS,
        temperature: validatedRequest.temperature || AI_CONFIG.TEMPERATURE,
        messages: validatedRequest.messages
          .filter((msg) => msg.role !== "system")
          .map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          })),
        system: validatedRequest.messages.find((msg) => msg.role === "system")?.content,
      })

      const duration = Date.now() - startTime

      const aiResponse: AIResponse = {
        content: response.content[0]?.type === "text" ? response.content[0].text : "",
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        model: response.model,
        finishReason: response.stop_reason || undefined,
      }

      AnalyticsService.track("ai_claude_completion", {
        model: response.model,
        tokens: response.usage.input_tokens + response.usage.output_tokens,
        duration,
        stopReason: response.stop_reason,
      })

      return aiResponse
    } catch (error) {
      AnalyticsService.track("ai_claude_error", {
        error: error instanceof Error ? error.message : "Unknown error",
      })
      throw error
    }
  }

  async generateSummary(text: string, maxLength = 100): Promise<string> {
    const request: ChatRequest = {
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that creates concise summaries. Summarize the following text in no more than ${maxLength} words.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.3,
      maxTokens: Math.ceil(maxLength * 1.5),
    }

    const response = await this.chatCompletion(request)
    return response.content
  }

  async translateText(text: string, targetLanguage: string): Promise<string> {
    const request: ChatRequest = {
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following text to ${targetLanguage}. Only return the translation, no additional text.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.1,
      maxTokens: Math.ceil(text.length * 2),
    }

    const response = await this.chatCompletion(request)
    return response.content
  }

  isAvailable(): boolean {
    return !!(this.openai || this.anthropic)
  }

  getAvailableModels(): string[] {
    const models: string[] = []

    if (this.openai) {
      models.push("gpt-4", "gpt-4-turbo", "gpt-3.5-turbo", "gpt-4-vision-preview")
    }

    if (this.anthropic) {
      models.push("claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307")
    }

    return models
  }
}

export const AIService = new AIServiceClass()
