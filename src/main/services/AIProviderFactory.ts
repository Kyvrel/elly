import { Provider } from '../db/schema'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import type { LanguageModelV3 } from '@ai-sdk/provider'

export function createAIProvider(
  provider: Provider,
  modelName: string
): LanguageModelV3 {
  switch (provider.type) {
    case 'openai':
      return createOpenAI({
        apiKey: provider.apiKey,
        baseURL: provider.baseUrl || undefined
      })(modelName)
    case 'anthropic':
      return createAnthropic({
        apiKey: provider.apiKey,
        baseURL: provider.baseUrl || undefined
      })(modelName)
    case 'google':
      return createGoogleGenerativeAI({
        apiKey: provider.apiKey,
        baseURL: provider.baseUrl || undefined
      })(modelName)
    default:
      throw new Error(`unsupported provider type: ${provider.type}`)
  }
}
