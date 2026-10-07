'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { Send, Bot, User, Wrench, Sparkles } from 'lucide-react';

const SUGGESTIONS = [
  'Quel temps fait-il à Feytiat ?',
  'Convertis 150 EUR en USD',
  'Avez-vous des claviers en stock sous 100€ ?',
  'Où en est ma commande CMD-1234 ?',
];

export default function ChatBot() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat();

  const isStreaming = status === 'streaming';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage({ text: input });
    setInput('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (isStreaming) return;
    sendMessage({ text: suggestion });
  };

  return (
    <div className="flex flex-col h-[650px] w-full max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* En-tête */}
      <div className="px-6 py-4 bg-zinc-900 text-white font-semibold flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-400" />
          <span>Assistant IA avec Tools</span>
        </div>
        <span className="text-xs font-normal text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          4 outils actifs
        </span>
      </div>

      {/* Liste des messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 dark:text-zinc-400 space-y-3">
            <Sparkles className="w-8 h-8 text-blue-500 animate-pulse" />
            <p className="text-sm font-medium">Posez une question ou testez un outil ci-dessous !</p>
          </div>
        )}

        {messages.map((message) => {
          const isUser = message.role === 'user';
          const text = message.parts
            ?.filter((p) => p.type === 'text')
            .map((p) => ('text' in p ? p.text : ''))
            .join('');

          // Détection des appels d'outils dans les parts
          const toolCalls = message.parts?.filter(
            (p) => p.type.startsWith('tool-') || p.type === 'dynamic-tool'
          ) || [];

          return (
            <div
              key={message.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className="flex flex-col gap-2 max-w-[80%]">
                {/* Badges d'outils invoqués */}
                {!isUser && toolCalls.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {toolCalls.map((tc, idx) => {
                      const toolName =
                        'toolName' in tc && typeof tc.toolName === 'string'
                          ? tc.toolName
                          : tc.type.replace(/^tool-/, '');
                      return (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        >
                          <Wrench className="w-3 h-3" />
                          outil : {toolName}()
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Bulle de texte */}
                {text && (
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                      isUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                    }`}
                  >
                    {text}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-full bg-zinc-300 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isStreaming && (
          <div className="text-xs text-zinc-400 italic flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
            Gemini réfléchit et exécute...
          </div>
        )}
      </div>

      {/* Boutons de suggestions rapides */}
      <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex gap-1.5 overflow-x-auto text-xs no-scrollbar">
        {SUGGESTIONS.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSuggestionClick(item)}
            disabled={isStreaming}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-400 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            {item}
          </button>
        ))}
      </div>

      {/* Formulaire de saisie */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Posez une question ou demandez une météo, un prix, un RDV..."
          className="flex-1 px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>Envoyer</span>
        </button>
      </form>
    </div>
  );
}

