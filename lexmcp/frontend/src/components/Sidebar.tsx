import React from 'react'
import { 
  Bot, 
  Database, 
  Settings, 
  User, 
  ChevronDown,
  CheckCircle,
  Circle
} from 'lucide-react'
import { useChatStore, useSelectedAgent, useSelectedBases } from '../stores/useChatStore'

export const Sidebar: React.FC = () => {
  const {
    availableAgents,
    availableBases,
    selectedAgent,
    selectedBases,
    setSelectedAgent,
    toggleBase
  } = useChatStore()

  const selectedAgentData = useSelectedAgent()
  const selectedBasesData = useSelectedBases()

  return (
    <div className="w-80 bg-white dark:bg-black border-r border-neutral-200 dark:border-neutral-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-black dark:text-white">
              Gabi
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Assistente Jurídico Inteligente
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Agentes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
              <Bot className="w-4 h-4 mr-2" />
              Agentes
            </h2>
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          </div>
          
          <div className="space-y-2">
            {availableAgents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedAgent === agent.id
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700'
                    : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        agent.isActive ? 'bg-success-500' : 'bg-neutral-400'
                      }`} />
                      <h3 className="text-sm font-medium text-black dark:text-white">
                        {agent.name}
                      </h3>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {agent.description}
                    </p>
                    {agent.metadata && (
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs bg-neutral-200 dark:bg-neutral-700 px-2 py-1 rounded">
                          {agent.metadata.model}
                        </span>
                        <span className="text-xs text-neutral-400">
                          {agent.metadata.temperature}
                        </span>
                      </div>
                    )}
                  </div>
                  {selectedAgent === agent.id && (
                    <CheckCircle className="w-4 h-4 text-primary-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bases de Conhecimento */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
              <Database className="w-4 h-4 mr-2" />
              Bases de Conhecimento
            </h2>
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          </div>
          
          <div className="space-y-2">
            {availableBases.map((base) => (
              <button
                key={base.id}
                onClick={() => toggleBase(base.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedBases.includes(base.id)
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700'
                    : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        base.isActive ? 'bg-success-500' : 'bg-neutral-400'
                      }`} />
                      <h3 className="text-sm font-medium text-black dark:text-white">
                        {base.name}
                      </h3>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {base.description}
                    </p>
                    {base.metadata && (
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs bg-neutral-200 dark:bg-neutral-700 px-2 py-1 rounded">
                          {base.metadata.documentCount} docs
                        </span>
                        <span className="text-xs text-neutral-400">
                          {base.metadata.source}
                        </span>
                      </div>
                    )}
                  </div>
                  {selectedBases.includes(base.id) ? (
                    <CheckCircle className="w-4 h-4 text-primary-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-neutral-400" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-neutral-400" />
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              Usuário
            </span>
          </div>
          <button className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
} 