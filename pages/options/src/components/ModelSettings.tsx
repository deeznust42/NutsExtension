/*
 * Changes:
 * - Added a searchable select component with filtering capability for model selection
 * - Implemented keyboard navigation and accessibility for the custom dropdown
 * - Added search functionality that filters models based on user input
 * - Added keyboard event handlers to close dropdowns with Escape key
 * - Styling for both light and dark mode themes
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import type { KeyboardEvent } from 'react';
import { Button } from '@extension/ui';
import {
  llmProviderStore,
  agentModelStore,
  speechToTextModelStore,
  AgentNameEnum,
  llmProviderModelNames,
  ProviderTypeEnum,
  getDefaultDisplayNameFromProviderId,
  getDefaultProviderConfig,
  getDefaultAgentModelParams,
  type ProviderConfig,
  type SpeechToTextModelConfig,
} from '@extension/storage';

// Helper function to check if a model is an O-series model
function isOpenAIOModel(modelName: string): boolean {
  if (modelName.startsWith('openai/')) {
    return modelName.startsWith('openai/o');
  }
  return modelName.startsWith('o');
}

interface ModelSettingsProps {
  isDarkMode?: boolean; // Controls dark/light theme styling
}

export const ModelSettings = ({ isDarkMode = false }: ModelSettingsProps) => {
  const [providers, setProviders] = useState<Record<string, ProviderConfig>>({});
  const [modifiedProviders, setModifiedProviders] = useState<Set<string>>(new Set());
  const [providersFromStorage, setProvidersFromStorage] = useState<Set<string>>(new Set());
  // Remove state for separate agent selections
  // Replace with a single selectedModel state
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [modelParameters, setModelParameters] = useState<{ temperature: number; topP: number }>({
    temperature: 0,
    topP: 0,
  });
  const [reasoningEffort, setReasoningEffort] = useState<'low' | 'medium' | 'high' | undefined>(undefined);
  const [newModelInputs, setNewModelInputs] = useState<Record<string, string>>({});
  const [isProviderSelectorOpen, setIsProviderSelectorOpen] = useState(false);
  const newlyAddedProviderRef = useRef<string | null>(null);
  const [nameErrors, setNameErrors] = useState<Record<string, string>>({});
  // Add state for tracking API key visibility
  const [visibleApiKeys, setVisibleApiKeys] = useState<Record<string, boolean>>({});
  // Create a non-async wrapper for use in render functions
  const [availableModels, setAvailableModels] = useState<
    Array<{ provider: string; providerName: string; model: string }>
  >([]);
  // State for model input handling

  const [selectedSpeechToTextModel, setSelectedSpeechToTextModel] = useState<string>('');

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const allProviders = await llmProviderStore.getAllProviders();
        console.log('allProviders', allProviders);

        // Track which providers are from storage
        const fromStorage = new Set(Object.keys(allProviders));
        setProvidersFromStorage(fromStorage);

        // Only use providers from storage, don't add default ones
        setProviders(allProviders);
      } catch (error) {
        console.error('Error loading providers:', error);
        // Set empty providers on error
        setProviders({});
        // No providers from storage on error
        setProvidersFromStorage(new Set());
      }
    };

    loadProviders();
  }, []);

  // Load existing agent models and parameters on mount
  // Remove useEffect for loading agent models separately
  // Instead, load the model for one agent (e.g., Planner) and use it for all
  useEffect(() => {
    const loadAgentModel = async () => {
      try {
        const config = await agentModelStore.getAgentModel(AgentNameEnum.Planner);
        if (config) {
          setSelectedModel(`${config.provider}>${config.modelName}`);
          setModelParameters({
            temperature: typeof config.parameters?.temperature === 'number' ? config.parameters.temperature : 0,
            topP: typeof config.parameters?.topP === 'number' ? config.parameters.topP : 0,
          });
          if (config.reasoningEffort) {
            setReasoningEffort(config.reasoningEffort as 'low' | 'medium' | 'high');
          }
        }
      } catch (error) {
        console.error('Error loading agent model:', error);
      }
    };
    loadAgentModel();
  }, []);

  useEffect(() => {
    const loadSpeechToTextModel = async () => {
      try {
        const config = await speechToTextModelStore.getSpeechToTextModel();
        if (config) {
          setSelectedSpeechToTextModel(`${config.provider}>${config.modelName}`);
        }
      } catch (error) {
        console.error('Error loading speech-to-text model:', error);
      }
    };

    loadSpeechToTextModel();
  }, []);

  // Auto-focus the input field when a new provider is added
  useEffect(() => {
    // Only focus if we have a newly added provider reference
    if (newlyAddedProviderRef.current && providers[newlyAddedProviderRef.current]) {
      const providerId = newlyAddedProviderRef.current;
      const config = providers[providerId];

      // For custom providers, focus on the name input
      if (config.type === ProviderTypeEnum.CustomOpenAI) {
        const nameInput = document.getElementById(`${providerId}-name`);
        if (nameInput) {
          nameInput.focus();
        }
      } else {
        // For default providers, focus on the API key input
        const apiKeyInput = document.getElementById(`${providerId}-api-key`);
        if (apiKeyInput) {
          apiKeyInput.focus();
        }
      }

      // Clear the ref after focusing
      newlyAddedProviderRef.current = null;
    }
  }, [providers]);

  // Add a click outside handler to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isProviderSelectorOpen && !target.closest('.provider-selector-container')) {
        setIsProviderSelectorOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProviderSelectorOpen]);

  // Create a memoized version of getAvailableModels
  const getAvailableModelsCallback = useCallback(async () => {
    const models: Array<{ provider: string; providerName: string; model: string }> = [];

    try {
      // Load providers directly from storage
      const storedProviders = await llmProviderStore.getAllProviders();

      // Only use providers that are actually in storage
      for (const [provider, config] of Object.entries(storedProviders)) {
        // Only handle supported providers
        const providerModels =
          config.modelNames || llmProviderModelNames[provider as keyof typeof llmProviderModelNames] || [];
        models.push(
          ...providerModels.map(model => ({
            provider,
            providerName: config.name || provider,
            model,
          })),
        );
      }
    } catch (error) {
      console.error('Error loading providers for model selection:', error);
    }

    return models;
  }, []);

  // Update available models whenever providers change
  useEffect(() => {
    const updateAvailableModels = async () => {
      const models = await getAvailableModelsCallback();
      setAvailableModels(models);
    };

    updateAvailableModels();
  }, [getAvailableModelsCallback]); // Only depends on the callback

  const handleApiKeyChange = (provider: string, apiKey: string, baseUrl?: string) => {
    setModifiedProviders(prev => new Set(prev).add(provider));
    setProviders(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        apiKey: apiKey.trim(),
        baseUrl: baseUrl !== undefined ? baseUrl.trim() : prev[provider]?.baseUrl,
      },
    }));
  };

  // Add a toggle handler for API key visibility
  const toggleApiKeyVisibility = (provider: string) => {
    setVisibleApiKeys(prev => ({
      ...prev,
      [provider]: !prev[provider],
    }));
  };

  const handleNameChange = (provider: string, name: string) => {
    setModifiedProviders(prev => new Set(prev).add(provider));
    setProviders(prev => {
      const updated = {
        ...prev,
        [provider]: {
          ...prev[provider],
          name: name.trim(),
        },
      };
      return updated;
    });
  };

  const handleModelsChange = (provider: string, modelsString: string) => {
    setNewModelInputs(prev => ({
      ...prev,
      [provider]: modelsString,
    }));
  };

  const addModel = (provider: string, model: string) => {
    if (!model.trim()) return;

    setModifiedProviders(prev => new Set(prev).add(provider));
    setProviders(prev => {
      const providerData = prev[provider] || {};

      // Get current models - either from provider config or default models
      let currentModels = providerData.modelNames;
      if (currentModels === undefined) {
        currentModels = [...(llmProviderModelNames[provider as keyof typeof llmProviderModelNames] || [])];
      }

      // Don't add duplicates
      if (currentModels.includes(model.trim())) return prev;

      return {
        ...prev,
        [provider]: {
          ...providerData,
          modelNames: [...currentModels, model.trim()],
        },
      };
    });

    // Clear the input
    setNewModelInputs(prev => ({
      ...prev,
      [provider]: '',
    }));
  };

  const removeModel = (provider: string, modelToRemove: string) => {
    setModifiedProviders(prev => new Set(prev).add(provider));

    setProviders(prev => {
      const providerData = prev[provider] || {};

      // If modelNames doesn't exist in the provider data yet, we need to initialize it
      // with the default models from llmProviderModelNames first
      if (!providerData.modelNames) {
        const defaultModels = llmProviderModelNames[provider as keyof typeof llmProviderModelNames] || [];
        const filteredModels = defaultModels.filter(model => model !== modelToRemove);

        return {
          ...prev,
          [provider]: {
            ...providerData,
            modelNames: filteredModels,
          },
        };
      }

      // If modelNames already exists, just filter out the model to remove
      return {
        ...prev,
        [provider]: {
          ...providerData,
          modelNames: providerData.modelNames.filter(model => model !== modelToRemove),
        },
      };
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, provider: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const value = newModelInputs[provider] || '';
      addModel(provider, value);
    }
  };

  const getButtonProps = (provider: string) => {
    const isInStorage = providersFromStorage.has(provider);
    const isModified = modifiedProviders.has(provider);

    // For deletion, we only care if it's in storage and not modified
    if (isInStorage && !isModified) {
      return {
        theme: isDarkMode ? 'dark' : 'light',
        variant: 'danger' as const,
        children: 'Delete',
        disabled: false,
      };
    }

    // For saving, we need to check if it has the required inputs
    let hasInput = false;
    const providerType = providers[provider]?.type;
    const config = providers[provider];

    if (providerType === ProviderTypeEnum.CustomOpenAI) {
      hasInput = Boolean(config?.baseUrl?.trim());
    } else {
      // Other built-in providers just need API Key
      hasInput = Boolean(config?.apiKey?.trim());
    }

    return {
      theme: isDarkMode ? 'dark' : 'light',
      variant: 'primary' as const,
      children: 'Save',
      disabled: !hasInput || !isModified,
    };
  };

  const handleSave = async (provider: string) => {
    try {
      // Check if name contains spaces for custom providers
      if (providers[provider].type === ProviderTypeEnum.CustomOpenAI && providers[provider].name?.includes(' ')) {
        setNameErrors(prev => ({
          ...prev,
          [provider]: 'Spaces are not allowed in provider names. Please use underscores or other characters instead.',
        }));
        return;
      }

      // Check if base URL is required but missing for custom_openai
      if (
        providers[provider].type === ProviderTypeEnum.CustomOpenAI &&
        (!providers[provider].baseUrl || !providers[provider].baseUrl.trim())
      ) {
        alert(`Base URL is required for ${getDefaultDisplayNameFromProviderId(provider)}. Please enter it.`);
        return;
      }

      // Ensure modelNames is provided
      let modelNames = providers[provider].modelNames;
      if (!modelNames) {
        // Use default model names if not explicitly set
        modelNames = [...(llmProviderModelNames[provider as keyof typeof llmProviderModelNames] || [])];
      }

      // Prepare data for saving using the correctly typed config from state
      // We can directly pass the relevant parts of the state config
      // Create a copy to avoid modifying state directly if needed, though setProvider likely handles it
      const configToSave: Partial<ProviderConfig> = { ...providers[provider] }; // Use Partial to allow deleting modelNames

      // Explicitly set required fields that might be missing in partial state updates (though unlikely now)
      configToSave.apiKey = providers[provider].apiKey || '';
      configToSave.name = providers[provider].name || getDefaultDisplayNameFromProviderId(provider);
      configToSave.type = providers[provider].type;
      configToSave.createdAt = providers[provider].createdAt || Date.now();
      // baseUrl, azureDeploymentName, azureApiVersion should be correctly set by handlers

      // Remove AzureOpenAI and OpenRouter from JSX and logic
      // Only set modelNames for supported providers
      configToSave.modelNames =
        providers[provider].modelNames || llmProviderModelNames[provider as keyof typeof llmProviderModelNames] || [];

      // Pass the cleaned config to setProvider
      // Cast to ProviderConfig as we've ensured necessary fields based on type
      await llmProviderStore.setProvider(provider, configToSave as ProviderConfig);

      // Clear any name errors on successful save
      setNameErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[provider];
        return newErrors;
      });

      // Add to providersFromStorage since it's now saved
      setProvidersFromStorage(prev => new Set(prev).add(provider));

      setModifiedProviders(prev => {
        const next = new Set(prev);
        next.delete(provider);
        return next;
      });

      // Refresh available models
      const models = await getAvailableModelsCallback();
      setAvailableModels(models);
    } catch (error) {
      console.error('Error saving API key:', error);
    }
  };

  const handleDelete = async (provider: string) => {
    try {
      // Delete the provider from storage regardless of its API key value
      await llmProviderStore.removeProvider(provider);

      // Remove from providersFromStorage
      setProvidersFromStorage(prev => {
        const next = new Set(prev);
        next.delete(provider);
        return next;
      });

      // Remove from providers state
      setProviders(prev => {
        const next = { ...prev };
        delete next[provider];
        return next;
      });

      // Also remove from modifiedProviders if it's there
      setModifiedProviders(prev => {
        const next = new Set(prev);
        next.delete(provider);
        return next;
      });

      // Refresh available models
      const models = await getAvailableModelsCallback();
      setAvailableModels(models);
    } catch (error) {
      console.error('Error deleting provider:', error);
    }
  };

  const handleCancelProvider = (providerId: string) => {
    // Remove the provider from the state
    setProviders(prev => {
      const next = { ...prev };
      delete next[providerId];
      return next;
    });

    // Remove from modified providers
    setModifiedProviders(prev => {
      const next = new Set(prev);
      next.delete(providerId);
      return next;
    });
  };

  // Replace handleModelChange to update all agent roles
  const handleModelChange = async (modelValue: string) => {
    const [provider, model] = modelValue.split('>');
    setSelectedModel(modelValue);
    // Use Planner as default for parameter shape
    const params = getDefaultAgentModelParams(provider, AgentNameEnum.Planner);
    setModelParameters({
      temperature: params.temperature ?? 0,
      topP: params.topP ?? 0,
    });
    // Save for all agent roles
    for (const agent of Object.values(AgentNameEnum)) {
      await agentModelStore.setAgentModel(agent, {
        provider,
        modelName: model,
        parameters: {
          temperature: params.temperature ?? 0,
          topP: params.topP ?? 0,
        },
        reasoningEffort: isOpenAIOModel(model) ? reasoningEffort || 'medium' : undefined,
      });
    }
  };

  const handleReasoningEffortChange = async (value: 'low' | 'medium' | 'high') => {
    setReasoningEffort(value);

    // Only update if we have a selected model
    if (selectedModel && isOpenAIOModel(selectedModel)) {
      try {
        // Find provider
        const provider = getProviderForModel(selectedModel);

        if (provider) {
          await agentModelStore.setAgentModel(AgentNameEnum.Planner, {
            provider,
            modelName: selectedModel,
            parameters: modelParameters,
            reasoningEffort: value,
          });
          // Also update for other agents
          for (const agent of Object.values(AgentNameEnum)) {
            if (agent !== AgentNameEnum.Planner) {
              await agentModelStore.setAgentModel(agent, {
                provider,
                modelName: selectedModel,
                parameters: modelParameters,
                reasoningEffort: value,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error saving reasoning effort:', error);
      }
    }
  };

  const handleParameterChange = async (paramName: 'temperature' | 'topP', value: number) => {
    const newParameters = {
      ...modelParameters,
      [paramName]: value,
    };

    setModelParameters(newParameters);

    // Only update if we have a selected model
    if (selectedModel) {
      try {
        // Find provider
        let provider: string | undefined;
        for (const [providerKey, providerConfig] of Object.entries(providers)) {
          // Check standard model names for providers
          const modelNames =
            providerConfig.modelNames || llmProviderModelNames[providerKey as keyof typeof llmProviderModelNames] || [];
          if (modelNames.includes(selectedModel)) {
            provider = providerKey;
            break;
          }
        }

        if (provider) {
          await agentModelStore.setAgentModel(AgentNameEnum.Planner, {
            provider,
            modelName: selectedModel,
            parameters: newParameters,
          });
          // Also update for other agents
          for (const agent of Object.values(AgentNameEnum)) {
            if (agent !== AgentNameEnum.Planner) {
              await agentModelStore.setAgentModel(agent, {
                provider,
                modelName: selectedModel,
                parameters: newParameters,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error saving agent parameters:', error);
      }
    }
  };

  const handleSpeechToTextModelChange = async (modelValue: string) => {
    setSelectedSpeechToTextModel(modelValue);

    try {
      if (modelValue) {
        // Parse the "provider>model" format
        const [provider, modelName] = modelValue.split('>');

        // Save to proper storage
        await speechToTextModelStore.setSpeechToTextModel({
          provider,
          modelName,
        });
      } else {
        // Reset if no model selected
        await speechToTextModelStore.resetSpeechToTextModel();
      }
    } catch (error) {
      console.error('Error saving speech-to-text model:', error);
    }
  };

  const renderModelSelect = () => (
    <div
      className={`rounded-2xl shadow-lg border ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'} p-8 mb-8`}>
      <h3 className={`mb-4 text-2xl font-extrabold ${isDarkMode ? 'text-gray-100' : 'text-[#1a2550]'}`}>
        Model Selection
      </h3>
      <p className={`mb-8 text-base font-normal ${isDarkMode ? 'text-gray-400' : 'text-[#22306a]'}`}>
        Choose and configure the model used for all agent roles.
      </p>

      <div className="space-y-8">
        {/* Model Selection */}
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <label
            htmlFor="unified-model"
            className={`w-32 text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-[#1a2550]'}`}>
            Model
          </label>
          <select
            id="unified-model"
            className={`flex-1 rounded-lg border text-lg ${isDarkMode ? 'border-slate-600 bg-slate-700 text-gray-200' : 'border-gray-300 bg-gray-50 text-gray-900'} px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400`}
            disabled={availableModels.length === 0}
            value={selectedModel || ''}
            onChange={e => handleModelChange(e.target.value)}>
            <option key="default" value="">
              Choose model
            </option>
            {availableModels.map(({ provider, providerName, model }) => (
              <option key={`${provider}>${model}`} value={`${provider}>${model}`}>
                {`${providerName} > ${model}`}
              </option>
            ))}
          </select>
        </div>

        {/* Temperature Slider */}
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <label
            htmlFor="unified-temperature"
            className={`w-32 text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-[#1a2550]'}`}>
            Temperature
          </label>
          <div className="flex flex-1 items-center gap-4">
            <input
              id="unified-temperature"
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={modelParameters.temperature}
              onChange={e => handleParameterChange('temperature', Number.parseFloat(e.target.value))}
              style={{
                background: `linear-gradient(to right, ${isDarkMode ? '#3b82f6' : '#60a5fa'} 0%, ${isDarkMode ? '#3b82f6' : '#60a5fa'} ${(modelParameters.temperature / 2) * 100}%, ${isDarkMode ? '#475569' : '#cbd5e1'} ${(modelParameters.temperature / 2) * 100}%, ${isDarkMode ? '#475569' : '#cbd5e1'} 100%)`,
              }}
              className={`flex-1 ${isDarkMode ? 'accent-blue-500' : 'accent-blue-400'} h-2 appearance-none rounded-full`}
            />
            <input
              type="number"
              min="0"
              max="2"
              step="0.01"
              value={modelParameters.temperature}
              onChange={e => {
                const value = Number.parseFloat(e.target.value);
                if (!Number.isNaN(value) && value >= 0 && value <= 2) {
                  handleParameterChange('temperature', value);
                }
              }}
              className={`w-20 rounded-md border ${isDarkMode ? 'border-slate-600 bg-slate-700 text-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-800' : 'border-gray-300 bg-white text-gray-900 focus:border-blue-400 focus:ring-2 focus:ring-blue-200'} px-2 py-2 text-lg`}
              aria-label="Temperature number input"
            />
            <span className={`w-16 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {modelParameters.temperature.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Top P Slider */}
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <label
            htmlFor="unified-topP"
            className={`w-32 text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-[#1a2550]'}`}>
            Top P
          </label>
          <div className="flex flex-1 items-center gap-4">
            <input
              id="unified-topP"
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={modelParameters.topP}
              onChange={e => handleParameterChange('topP', Number.parseFloat(e.target.value))}
              style={{
                background: `linear-gradient(to right, ${isDarkMode ? '#3b82f6' : '#60a5fa'} 0%, ${isDarkMode ? '#3b82f6' : '#60a5fa'} ${modelParameters.topP * 100}%, ${isDarkMode ? '#475569' : '#cbd5e1'} ${modelParameters.topP * 100}%, ${isDarkMode ? '#475569' : '#cbd5e1'} 100%)`,
              }}
              className={`flex-1 ${isDarkMode ? 'accent-blue-500' : 'accent-blue-400'} h-2 appearance-none rounded-full`}
            />
            <input
              type="number"
              min="0"
              max="1"
              step="0.001"
              value={modelParameters.topP}
              onChange={e => {
                const value = Number.parseFloat(e.target.value);
                if (!Number.isNaN(value) && value >= 0 && value <= 1) {
                  handleParameterChange('topP', value);
                }
              }}
              className={`w-20 rounded-md border ${isDarkMode ? 'border-slate-600 bg-slate-700 text-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-800' : 'border-gray-300 bg-white text-gray-900 focus:border-blue-400 focus:ring-2 focus:ring-blue-200'} px-2 py-2 text-lg`}
              aria-label="Top P number input"
            />
            <span className={`w-16 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {modelParameters.topP.toFixed(3)}
            </span>
          </div>
        </div>

        {/* Reasoning Effort Selector (only for O-series models) */}
        {selectedModel && isOpenAIOModel(selectedModel) && (
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <label
              htmlFor="unified-reasoning-effort"
              className={`w-32 text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-[#1a2550]'}`}>
              Reasoning
            </label>
            <select
              id="unified-reasoning-effort"
              value={reasoningEffort || 'medium'}
              onChange={e => handleReasoningEffortChange(e.target.value as 'low' | 'medium' | 'high')}
              className={`flex-1 rounded-lg border text-lg ${isDarkMode ? 'border-slate-600 bg-slate-700 text-gray-200' : 'border-gray-300 bg-gray-50 text-gray-900'} px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400`}>
              <option value="low">Low (Faster)</option>
              <option value="medium">Medium (Balanced)</option>
              <option value="high">High (More thorough)</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );

  const getAgentDescription = (agentName: AgentNameEnum) => {
    switch (agentName) {
      case AgentNameEnum.Navigator:
        return 'Navigates websites and performs actions';
      case AgentNameEnum.Planner:
        return 'Develops and refines strategies to complete tasks';
      case AgentNameEnum.Validator:
        return 'Checks if tasks are completed successfully';
      default:
        return '';
    }
  };

  const getMaxCustomProviderNumber = () => {
    let maxNumber = 0;
    for (const providerId of Object.keys(providers)) {
      if (providerId.startsWith('custom_openai_')) {
        const match = providerId.match(/custom_openai_(\d+)/);
        if (match) {
          const number = Number.parseInt(match[1], 10);
          maxNumber = Math.max(maxNumber, number);
        }
      }
    }
    return maxNumber;
  };

  const addCustomProvider = () => {
    const nextNumber = getMaxCustomProviderNumber() + 1;
    const providerId = `custom_openai_${nextNumber}`;

    setProviders(prev => ({
      ...prev,
      [providerId]: {
        apiKey: '',
        name: `CustomProvider${nextNumber}`,
        type: ProviderTypeEnum.CustomOpenAI,
        baseUrl: '',
        modelNames: [],
        createdAt: Date.now(),
      },
    }));

    setModifiedProviders(prev => new Set(prev).add(providerId));

    // Set the newly added provider ref
    newlyAddedProviderRef.current = providerId;

    // Scroll to the newly added provider after render
    setTimeout(() => {
      const providerElement = document.getElementById(`provider-${providerId}`);
      if (providerElement) {
        providerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const addBuiltInProvider = (provider: string) => {
    // Get the default provider configuration
    const config = getDefaultProviderConfig(provider);

    // Add the provider to the state
    setProviders(prev => ({
      ...prev,
      [provider]: config,
    }));

    // Mark as modified so it shows up in the UI
    setModifiedProviders(prev => new Set(prev).add(provider));

    // Set the newly added provider ref
    newlyAddedProviderRef.current = provider;

    // Scroll to the newly added provider after render
    setTimeout(() => {
      const providerElement = document.getElementById(`provider-${provider}`);
      if (providerElement) {
        providerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Sort providers to ensure newly added providers appear at the bottom
  const getSortedProviders = () => {
    // Filter providers to only include those from storage and newly added providers
    const filteredProviders = Object.entries(providers).filter(([providerId, config]) => {
      // ALSO filter out any provider missing a config or type, to satisfy TS
      if (!config || !config.type) {
        console.warn(`Filtering out provider ${providerId} with missing config or type.`);
        return false;
      }

      // Include if it's from storage
      if (providersFromStorage.has(providerId)) {
        return true;
      }

      // Include if it's a newly added provider (has been modified)
      if (modifiedProviders.has(providerId)) {
        return true;
      }

      // Exclude providers that aren't from storage and haven't been modified
      return false;
    });

    // Sort the filtered providers
    return filteredProviders.sort(([keyA, configA], [keyB, configB]) => {
      // Separate newly added providers from stored providers
      const isNewA = !providersFromStorage.has(keyA) && modifiedProviders.has(keyA);
      const isNewB = !providersFromStorage.has(keyB) && modifiedProviders.has(keyB);

      // If one is new and one is stored, new ones go to the end
      if (isNewA && !isNewB) return 1;
      if (!isNewA && isNewB) return -1;

      // If both are new or both are stored, sort by createdAt
      if (configA.createdAt && configB.createdAt) {
        return configA.createdAt - configB.createdAt; // Sort in ascending order (oldest first)
      }

      // If only one has createdAt, put the one without createdAt at the end
      if (configA.createdAt) return -1;
      if (configB.createdAt) return 1;

      // If neither has createdAt, sort by type and then name
      const isCustomA = configA.type === ProviderTypeEnum.CustomOpenAI;
      const isCustomB = configB.type === ProviderTypeEnum.CustomOpenAI;

      if (isCustomA && !isCustomB) {
        return 1; // Custom providers come after non-custom
      }

      if (!isCustomA && isCustomB) {
        return -1; // Non-custom providers come before custom
      }

      // Sort alphabetically by name within each group
      return (configA.name || keyA).localeCompare(configB.name || keyB);
    });
  };

  const handleProviderSelection = (providerType: string) => {
    // Close the dropdown immediately
    setIsProviderSelectorOpen(false);

    // Handle custom provider
    if (providerType === ProviderTypeEnum.CustomOpenAI) {
      addCustomProvider();
      return;
    }

    // Handle built-in supported providers
    addBuiltInProvider(providerType);
  };

  const getProviderForModel = (modelName: string): string => {
    for (const [provider, config] of Object.entries(providers)) {
      // Check regular model names for providers
      const modelNames =
        config.modelNames || llmProviderModelNames[provider as keyof typeof llmProviderModelNames] || [];
      if (modelNames.includes(modelName)) {
        return provider;
      }
    }
    return '';
  };

  return (
    <section className="space-y-8">
      {/* LLM Providers Section */}
      <div
        className={`rounded-2xl shadow-lg border ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'} p-8 mb-8`}>
        <h2 className={`mb-6 text-2xl font-extrabold ${isDarkMode ? 'text-gray-100' : 'text-[#1a2550]'}`}>
          LLM Providers
        </h2>
        <div className="space-y-8">
          {getSortedProviders().length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <p className="mb-4">No providers configured yet. Add a provider to get started.</p>
            </div>
          ) : (
            getSortedProviders().map(([providerId, providerConfig]) => {
              if (!providerConfig || !providerConfig.type) return null;
              const isNew = modifiedProviders.has(providerId) && !providersFromStorage.has(providerId);
              return (
                <div
                  key={providerId}
                  id={`provider-${providerId}`}
                  className={`rounded-xl border shadow-sm p-6 space-y-6 transition-all duration-200 ${isNew ? (isDarkMode ? 'border-blue-700 bg-slate-700' : 'border-blue-200 bg-blue-50/70') : isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-[#1a2550]'}`}>
                      {providerConfig.name || providerId}
                    </h3>
                    <div className="flex gap-2">
                      {isNew && (
                        <Button variant="secondary" onClick={() => handleCancelProvider(providerId)}>
                          Cancel
                        </Button>
                      )}
                      <Button
                        variant={getButtonProps(providerId).variant}
                        disabled={getButtonProps(providerId).disabled}
                        onClick={() =>
                          providersFromStorage.has(providerId) && !modifiedProviders.has(providerId)
                            ? handleDelete(providerId)
                            : handleSave(providerId)
                        }>
                        {getButtonProps(providerId).children}
                      </Button>
                    </div>
                  </div>
                  {isNew && (
                    <div className={`mb-2 text-sm ${isDarkMode ? 'text-teal-300' : 'text-teal-700'}`}>
                      This provider is newly added. Enter your API key and click Save to configure it.
                    </div>
                  )}
                  <div className="space-y-4">
                    {/* Name input (only for custom_openai) */}
                    {providerConfig.type === ProviderTypeEnum.CustomOpenAI && (
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <label
                          htmlFor={`${providerId}-name`}
                          className={`w-32 text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-[#1a2550]'}`}>
                          Name
                        </label>
                        <input
                          id={`${providerId}-name`}
                          type="text"
                          placeholder="Provider name"
                          value={providerConfig.name || ''}
                          onChange={e => handleNameChange(providerId, e.target.value)}
                          className={`flex-1 rounded-lg border px-4 py-3 text-lg ${nameErrors[providerId] ? (isDarkMode ? 'border-red-700 bg-slate-700 text-gray-200 focus:border-red-600 focus:ring-2 focus:ring-red-900' : 'border-red-300 bg-gray-50 focus:border-red-400 focus:ring-2 focus:ring-red-200') : isDarkMode ? 'border-blue-700 bg-slate-700 text-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-900' : 'border-blue-300 bg-gray-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-200'} outline-none`}
                        />
                        {nameErrors[providerId] ? (
                          <p className={`ml-2 mt-1 text-xs ${isDarkMode ? 'text-red-400' : 'text-red-500'}`}>
                            {nameErrors[providerId]}
                          </p>
                        ) : (
                          <p className={`ml-2 mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Provider name (spaces are not allowed when saving)
                          </p>
                        )}
                      </div>
                    )}
                    {/* API Key input */}
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <label
                        htmlFor={`${providerId}-api-key`}
                        className={`w-32 text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-[#1a2550]'}`}>
                        API Key{providerConfig.type !== ProviderTypeEnum.CustomOpenAI ? '*' : ''}
                      </label>
                      <div className="relative flex-1">
                        <input
                          id={`${providerId}-api-key`}
                          type="password"
                          placeholder={
                            providerConfig.type === ProviderTypeEnum.CustomOpenAI
                              ? `${providerConfig.name || providerId} API key (optional)`
                              : `${providerConfig.name || providerId} API key (required)`
                          }
                          value={providerConfig.apiKey || ''}
                          onChange={e => handleApiKeyChange(providerId, e.target.value, providerConfig.baseUrl)}
                          className={`w-full rounded-lg border px-4 py-3 text-lg ${isDarkMode ? 'border-slate-600 bg-slate-700 text-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-800' : 'border-gray-300 bg-gray-50 text-gray-900 focus:border-blue-400 focus:ring-2 focus:ring-blue-200'} outline-none`}
                        />
                        {isNew && (
                          <button
                            type="button"
                            className={`absolute right-2 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => toggleApiKeyVisibility(providerId)}
                            aria-label={visibleApiKeys[providerId] ? 'Hide API key' : 'Show API key'}>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="size-5"
                              aria-hidden="true">
                              <title>{visibleApiKeys[providerId] ? 'Hide API key' : 'Show API key'}</title>
                              {visibleApiKeys[providerId] ? (
                                <>
                                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                  <circle cx="12" cy="12" r="3" />
                                  <line x1="2" y1="22" x2="22" y2="2" />
                                </>
                              ) : (
                                <>
                                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                  <circle cx="12" cy="12" r="3" />
                                </>
                              )}
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Show API key if visible */}
                    {isNew && visibleApiKeys[providerId] && providerConfig.apiKey && (
                      <div className="ml-2 mt-1">
                        <p
                          className={`break-words font-mono text-base ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          {providerConfig.apiKey}
                        </p>
                      </div>
                    )}
                    {/* Base URL input */}
                    {providerConfig.type === ProviderTypeEnum.CustomOpenAI && (
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <label
                          htmlFor={`${providerId}-base-url`}
                          className={`w-32 text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-[#1a2550]'}`}>
                          Base URL*
                        </label>
                        <input
                          id={`${providerId}-base-url`}
                          type="text"
                          placeholder="Required OpenAI-compatible API endpoint"
                          value={providerConfig.baseUrl || ''}
                          onChange={e => handleApiKeyChange(providerId, providerConfig.apiKey || '', e.target.value)}
                          className={`flex-1 rounded-lg border px-4 py-3 text-lg ${isDarkMode ? 'border-slate-600 bg-slate-700 text-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-800' : 'border-gray-300 bg-gray-50 text-gray-900 focus:border-blue-400 focus:ring-2 focus:ring-blue-200'} outline-none`}
                        />
                      </div>
                    )}
                    {/* Models input section */}
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <label
                        htmlFor={`${providerId}-models-label`}
                        className={`w-32 pt-2 text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-[#1a2550]'}`}>
                        Models
                      </label>
                      <div className="flex-1 space-y-2">
                        <div
                          className={`flex min-h-[42px] flex-wrap items-center gap-2 rounded-lg border ${isDarkMode ? 'border-slate-600 bg-slate-700 text-gray-200' : 'border-gray-300 bg-white text-gray-900'} p-2`}>
                          {(() => {
                            const models =
                              providerConfig.modelNames !== undefined
                                ? providerConfig.modelNames
                                : llmProviderModelNames[providerId as keyof typeof llmProviderModelNames] || [];
                            return models.map(model => (
                              <div
                                key={model}
                                className={`flex items-center rounded-full ${isDarkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-800'} px-2 py-1 text-base`}>
                                <span>{model}</span>
                                <button
                                  type="button"
                                  onClick={() => removeModel(providerId, model)}
                                  className={`ml-1 font-bold ${isDarkMode ? 'text-blue-300 hover:text-blue-100' : 'text-blue-600 hover:text-blue-800'}`}
                                  aria-label={`Remove ${model}`}>
                                  ×
                                </button>
                              </div>
                            ));
                          })()}
                          <input
                            id={`${providerId}-models-input`}
                            type="text"
                            placeholder=""
                            value={newModelInputs[providerId] || ''}
                            onChange={e => handleModelsChange(providerId, e.target.value)}
                            onKeyDown={e => handleKeyDown(e, providerId)}
                            className={`min-w-[150px] flex-1 border-none text-base ${isDarkMode ? 'bg-transparent text-gray-200' : 'bg-transparent text-gray-900'} p-1 outline-none`}
                          />
                        </div>
                        <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Type and Press Enter or Space to add.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Unified Model Selection Section */}
      <div
        className={`rounded-lg border ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-blue-100 bg-gray-50'} p-6 text-left shadow-sm`}>
        <h2 className={`mb-4 text-left text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          Model Selection
        </h2>
        <div className="space-y-4">{renderModelSelect()}</div>
      </div>

      {/* Speech-to-Text Model Selection */}
      {false && (
        <div
          className={`rounded-lg border ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-blue-100 bg-gray-50'} p-6 text-left shadow-sm`}>
          <h2 className={`mb-4 text-left text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            Speech-to-Text Model
          </h2>
          <p className={`mb-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Configure the Gemini model used for converting speech to text when using the microphone feature.
          </p>

          <div
            className={`rounded-lg border ${isDarkMode ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-gray-50'} p-4`}>
            <div className="flex items-center">
              <label
                htmlFor="speech-to-text-model"
                className={`w-24 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Model
              </label>
              <select
                id="speech-to-text-model"
                className={`flex-1 rounded-md border text-sm ${isDarkMode ? 'border-slate-600 bg-slate-700 text-gray-200' : 'border-gray-300 bg-white text-gray-700'} px-3 py-2`}
                value={selectedSpeechToTextModel}
                onChange={e => handleSpeechToTextModelChange(e.target.value)}>
                <option value="">Choose Model</option>
                {/* Filter available models to show only Gemini models */}
                {availableModels
                  .filter(({ provider, model }) => {
                    const providerConfig = providers[provider];
                    return providerConfig?.type === ProviderTypeEnum.Gemini;
                  })
                  .map(({ provider, providerName, model }) => (
                    <option key={`${provider}>${model}`} value={`${provider}>${model}`}>
                      {`${providerName} > ${model}`}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
