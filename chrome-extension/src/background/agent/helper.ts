import { type ProviderConfig, type ModelConfig, ProviderTypeEnum } from '@extension/storage';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

const maxTokens = 1024 * 4;

// create a chat model based on the agent name, the model name and provider
export function createChatModel(providerConfig: ProviderConfig, modelConfig: ModelConfig): BaseChatModel {
  const temperature = (modelConfig.parameters?.temperature ?? 0.1) as number;
  const topP = (modelConfig.parameters?.topP ?? 0.1) as number;

  switch (modelConfig.provider) {
    case ProviderTypeEnum.Gemini: {
      const args = {
        model: modelConfig.modelName,
        apiKey: providerConfig.apiKey,
        temperature,
        topP,
      };
      return new ChatGoogleGenerativeAI(args);
    }
    default: {
      // by default, we think it's a openai-compatible provider
      throw new Error(`Unsupported provider: ${modelConfig.provider}. Only Gemini is supported.`);
    }
  }
}
