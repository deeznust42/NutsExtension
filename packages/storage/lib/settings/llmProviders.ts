import { StorageEnum } from '../base/enums';
import { createStorage } from '../base/base';
import type { BaseStorage } from '../base/types';
import { type AgentNameEnum, llmProviderModelNames, llmProviderParameters, ProviderTypeEnum } from './types';

// Interface for a single provider configuration
export interface ProviderConfig {
  name?: string; // Display name in the options
  type?: ProviderTypeEnum; // Help to decide which LangChain ChatModel package to use
  apiKey: string; // Must be provided, but may be empty for local models
  baseUrl?: string; // Optional base URL if provided
  modelNames?: string[]; // Chosen model names
  createdAt?: number; // Timestamp in milliseconds when the provider was created
}

// Interface for storing multiple LLM provider configurations
// The key is the provider id, which is the same as the provider type for built-in providers, but is custom for custom providers
export interface LLMKeyRecord {
  providers: Record<string, ProviderConfig>;
}

export type LLMProviderStorage = BaseStorage<LLMKeyRecord> & {
  setProvider: (providerId: string, config: ProviderConfig) => Promise<void>;
  getProvider: (providerId: string) => Promise<ProviderConfig | undefined>;
  removeProvider: (providerId: string) => Promise<void>;
  hasProvider: (providerId: string) => Promise<boolean>;
  getAllProviders: () => Promise<Record<string, ProviderConfig>>;
};

// Storage for LLM provider configurations
// use "llm-api-keys" as the key for the storage, for backward compatibility
const storage = createStorage<LLMKeyRecord>(
  'llm-api-keys',
  { providers: {} },
  {
    storageEnum: StorageEnum.Local,
    liveUpdate: true,
  },
);

// Helper function to determine provider type from provider name
// Make sure to update this function if you add a new provider type
export function getProviderTypeByProviderId(providerId: string): ProviderTypeEnum {
  // Handle standard provider types
  switch (providerId) {
    case ProviderTypeEnum.Gemini:
    case ProviderTypeEnum.Groq:
      return providerId;
    default:
      return ProviderTypeEnum.CustomOpenAI;
  }
}

// Helper function to get display name from provider id
// Make sure to update this function if you add a new provider type
export function getDefaultDisplayNameFromProviderId(providerId: string): string {
  switch (providerId) {
    case ProviderTypeEnum.Gemini:
      return 'Gemini';
    case ProviderTypeEnum.Groq:
      return 'Groq';
    default:
      return providerId; // Use the provider id as display name for custom providers by default
  }
}

// Get default configuration for built-in providers
export function getDefaultProviderConfig(providerId: string): ProviderConfig {
  switch (providerId) {
    case ProviderTypeEnum.Gemini:
    case ProviderTypeEnum.Groq: // Groq uses modelNames
      return {
        apiKey: '',
        name: getDefaultDisplayNameFromProviderId(providerId),
        type: providerId,
        modelNames: [...(llmProviderModelNames[providerId] || [])],
        createdAt: Date.now(),
      };
    default: // Handles CustomOpenAI
      return {
        apiKey: '',
        name: getDefaultDisplayNameFromProviderId(providerId),
        type: ProviderTypeEnum.CustomOpenAI,
        baseUrl: '',
        modelNames: [], // Custom providers use modelNames
        createdAt: Date.now(),
      };
  }
}

export function getDefaultAgentModelParams(providerId: string, agentName: AgentNameEnum): Record<string, number> {
  const newParameters = llmProviderParameters[providerId as keyof typeof llmProviderParameters]?.[agentName] || {
    temperature: 0.1,
    topP: 0.1,
  };
  return newParameters;
}

// Helper function to ensure backward compatibility for provider configs
function ensureBackwardCompatibility(providerId: string, config: ProviderConfig): ProviderConfig {
  // Log input config
  // console.log(`[ensureBackwardCompatibility] Input for ${providerId}:`, JSON.stringify(config));

  const updatedConfig = { ...config };

  // Ensure name exists
  if (!updatedConfig.name) {
    updatedConfig.name = getDefaultDisplayNameFromProviderId(providerId);
  }
  // Ensure type exists
  if (!updatedConfig.type) {
    updatedConfig.type = getProviderTypeByProviderId(providerId);
  }

  // Ensure modelNames exists for all types
  if (!updatedConfig.modelNames) {
    // console.log(`[ensureBackwardCompatibility] Adding default modelNames for ${providerId}`);
    updatedConfig.modelNames = llmProviderModelNames[providerId as keyof typeof llmProviderModelNames] || [];
  }

  // Ensure createdAt exists
  if (!updatedConfig.createdAt) {
    updatedConfig.createdAt = new Date('03/04/2025').getTime();
  }

  // Log output config
  // console.log(`[ensureBackwardCompatibility] Output for ${providerId}:`, JSON.stringify(updatedConfig));
  return updatedConfig;
}

export const llmProviderStore: LLMProviderStorage = {
  ...storage,
  async setProvider(providerId: string, config: ProviderConfig) {
    if (!providerId) {
      throw new Error('Provider id cannot be empty');
    }

    if (config.apiKey === undefined) {
      throw new Error('API key must be provided (can be empty for local models)');
    }

    const providerType = config.type || getProviderTypeByProviderId(providerId);

    if (providerType !== ProviderTypeEnum.CustomOpenAI) {
      if (!config.apiKey?.trim()) {
        throw new Error(`API Key is required for ${getDefaultDisplayNameFromProviderId(providerId)}`);
      }
    }

    if (!config.modelNames || config.modelNames.length === 0) {
      console.warn(`Provider ${providerId} of type ${providerType} is being saved without model names.`);
    }

    const completeConfig: ProviderConfig = {
      apiKey: config.apiKey || '',
      baseUrl: config.baseUrl,
      name: config.name || getDefaultDisplayNameFromProviderId(providerId),
      type: providerType,
      createdAt: config.createdAt || Date.now(),
      modelNames: config.modelNames || [],
    };

    console.log(`[llmProviderStore.setProvider] Saving config for ${providerId}:`, JSON.stringify(completeConfig));

    const current = (await storage.get()) || { providers: {} };
    await storage.set({
      providers: {
        ...current.providers,
        [providerId]: completeConfig,
      },
    });
  },
  async getProvider(providerId: string) {
    const data = (await storage.get()) || { providers: {} };
    const config = data.providers[providerId];
    return config ? ensureBackwardCompatibility(providerId, config) : undefined;
  },
  async removeProvider(providerId: string) {
    const current = (await storage.get()) || { providers: {} };
    const newProviders = { ...current.providers };
    delete newProviders[providerId];
    await storage.set({ providers: newProviders });
  },
  async hasProvider(providerId: string) {
    const data = (await storage.get()) || { providers: {} };
    return providerId in data.providers;
  },

  async getAllProviders() {
    const data = await storage.get();
    const providers = { ...data.providers };

    // Add backward compatibility for all providers
    for (const [providerId, config] of Object.entries(providers)) {
      providers[providerId] = ensureBackwardCompatibility(providerId, config);
    }

    return providers;
  },
};
