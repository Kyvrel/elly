import { Provider } from '../db/schema'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import type { LanguageModelV3 } from '@ai-sdk/provider'
import { wrapLanguageModel } from 'ai'
import { devToolsMiddleware } from '@ai-sdk/devtools'

export function createAIProvider(provider: Provider, modelName: string): LanguageModelV3 {
  let baseModel: LanguageModelV3
  switch (provider.type) {
    case 'openai':
      baseModel = createOpenAI({
        apiKey: provider.apiKey,
        baseURL: provider.baseUrl || undefined
      })(modelName)
      break
    case 'anthropic':
      baseModel = createAnthropic({
        apiKey: provider.apiKey,
        baseURL: provider.baseUrl || undefined
      })(modelName)
      break
    case 'google':
      baseModel = createGoogleGenerativeAI({
        apiKey: provider.apiKey,
        baseURL: provider.baseUrl || undefined
      })(modelName)
      break
    default:
      throw new Error(`unsupported provider type: ${provider.type}`)
  }
  const isDevtoolsEnabled = process.env.NODE_ENV === 'development'
  console.log('isDevtoolsEnabled: ', isDevtoolsEnabled)
  return isDevtoolsEnabled
    ? wrapLanguageModel({ model: baseModel, middleware: devToolsMiddleware() })
    : baseModel
}
