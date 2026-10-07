# 🎓 Guide Complet : Créer un Chatbot IA avec Next.js et le Vercel AI SDK (Google Gemini)

Ce guide est conçu pour vous expliquer pas à pas, de manière simple et concrète, comment fonctionne l'intégration d'un Chatbot IA moderne en streaming avec le **Vercel AI SDK** et **Google Gemini**.

---

## 📌 Sommaire

1. [Comprendre l'Architecture](#1-comprendre-larchitecture)
2. [Pourquoi utiliser le Vercel AI SDK ?](#2-pourquoi-utiliser-le-vercel-ai-sdk)
3. [Installation des dépendances](#3-installation-des-dépendances)
4. [La Route Serveur : `app/api/chat/route.ts`](#4-la-route-serveur-appapichatroutets)
5. [Le Composant Frontend : `useChat()`](#5-le-composant-frontend-usechat)
6. [Comment fonctionne le streaming mot à mot ?](#6-comment-fonctionne-le-streaming-mot-à-mot)
7. [Sécurité : Les 3 règles d'or](#7-sécurité-les-3-règles-dor)
8. [Comment brancher un Backend existant (Symfony / Laravel / etc.)](#8-comment-brancher-un-backend-existant-symfony--laravel--etc)

---

## 1. Comprendre l'Architecture

Dans une application moderne, **l'IA n'est jamais appelée directement depuis le navigateur de l'utilisateur**.

Voici le schéma :

```
[Navigateur de l'utilisateur]
        │
        │ 1. Envoie le message via HTTP POST
        │ 4. Reçoit la réponse mot par mot (Flux SSE / Streaming)
        ▼
[Serveur Next.js : /api/chat]  <─── Vos clés secrètes (.env) restent ici !
        │
        │ 2. Appelle l'API Google avec la clé secrète
        │ 3. Récupère le flux de réponse
        ▼
[Google Gemini API]
```

### Pourquoi séparer ainsi ?
- **Sécurité** : Votre clé d'API Google n'est jamais visible dans le navigateur ou inspectable via le réseau client.
- **Contrôle** : Vous pouvez filtrer les messages, imposer une longueur maximale ou vérifier si l'utilisateur a le droit d'utiliser le chatbot avant d'appeler l'IA.

---

## 2. Pourquoi utiliser le Vercel AI SDK ?

Sans ce SDK, gérer un chatbot en streaming demande d'écrire manuellement des dizaines de lignes de code complexes :
- Gérer les connexions Server-Sent Events (SSE).
- Reconstruire les morceaux de texte au fur et à mesure.
- Gérer l'état de chargement (`isLoading`), les erreurs et l'annulation (`stop()`).

Avec le Vercel AI SDK :
- Côté serveur : une seule fonction `streamText()` gère l'appel et le stream.
- Côté client React : un simple hook `useChat()` gère les messages, la saisie et le streaming mot à mot automatiquement !

---

## 3. Installation des dépendances

Dans votre projet Next.js (App Router), installez les paquets suivants :

```bash
npm install ai @ai-sdk/react @ai-sdk/google
```

- `ai` : Le cœur du SDK Vercel (fonctions de streaming côté serveur).
- `@ai-sdk/react` : Les hooks React (comme `useChat()`).
- `@ai-sdk/google` : Le connecteur officiel pour les modèles Google Gemini.

### Configuration de la clé d'API :
Dans votre fichier `.env` à la racine :

```env
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...votre_cle_ici
```

---

## 4. La Route Serveur : `app/api/chat/route.ts`

C'est le point d'entrée qui reçoit les messages de React et dialogue avec Gemini.

Voici le code minimaliste complet (moins de 25 lignes) :

```typescript
import { google } from '@ai-sdk/google';
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from 'ai';

// Autorise jusqu'à 30 secondes d'exécution pour le stream
export const maxDuration = 30;

export async function POST(req: Request) {
  // 1. On récupère les messages envoyés par le frontend React
  const { messages }: { messages: UIMessage[] } = await req.json();

  // 2. On lance la génération en streaming avec Gemini
  const result = streamText({
    model: google('gemini-3.1-flash-lite'), // Modèle rapide et économique
    system: 'Tu es un assistant IA serviable et concis. Réponds en français.',
    messages: await convertToModelMessages(messages),
  });

  // 3. On renvoie le flux SSE compatible directement au client
  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
```

### Décorticage des fonctions clés :
- `google('gemini-3.1-flash-lite')` : Instancie le modèle Gemini. Il lit automatiquement `GOOGLE_GENERATIVE_AI_API_KEY` dans vos variables d'environnement.
- `convertToModelMessages(messages)` : Convertit l'historique de chat du frontend dans le format attendu par le modèle IA.
- `streamText(...)` : Démarre la génération sans bloquer tout le texte d'un coup.
- `createUIMessageStreamResponse(...)` : Crée la réponse HTTP de type `text/event-stream` que le navigateur va lire en temps réel.

---

## 5. Le Composant Frontend : `useChat()`

Côté React, le hook `useChat()` de `@ai-sdk/react` s'occupe de tout.

```tsx
'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';

export default function ChatBot() {
  const [input, setInput] = useState('');
  
  // useChat appelle automatiquement la route POST /api/chat par défaut
  const { messages, sendMessage, status } = useChat();

  const isStreaming = status === 'streaming';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    // Envoie le message au serveur et l'ajoute à la liste des messages
    sendMessage({ text: input });
    setInput('');
  };

  return (
    <div className="chat-container">
      {/* 1. Affichage de la liste des messages */}
      <div className="messages-list">
        {messages.map((message) => {
          // On extrait le texte du message
          const text = message.parts
            ?.filter((p) => p.type === 'text')
            .map((p) => p.text)
            .join('');

          return (
            <div key={message.id} className={message.role}>
              <strong>{message.role === 'user' ? 'Vous : ' : 'IA : '}</strong>
              <span>{text}</span>
            </div>
          );
        })}

        {isStreaming && <p>L&apos;IA écrit sa réponse...</p>}
      </div>

      {/* 2. Formulaire d'envoi */}
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Posez votre question..."
        />
        <button type="submit" disabled={isStreaming || !input.trim()}>
          Envoyer
        </button>
      </form>
    </div>
  );
}
```

### Ce que fournit `useChat()` :
- `messages` : Tableau de tous les messages échangés (avec `id`, `role: 'user' | 'assistant'`, `parts`).
- `sendMessage({ text: '...' })` : Fonction pour envoyer un nouveau message.
- `status` : `'ready'`, `'submitted'`, `'streaming'`, ou `'error'`.
- `stop()` : Permet d'arrêter le stream en cours si l'utilisateur clique sur "Stop".

---

## 6. Comment fonctionne le streaming mot à mot ?

Au lieu de faire attendre l'utilisateur pendant 5 secondes et d'envoyer le paragraphe complet d'un seul bloc, le serveur envoie des paquets HTTP continus (appelés **Server-Sent Events**).

Le navigateur reçoit des petits bouts :
1. `{"type":"text-delta", "delta":"Bonjour"}`
2. `{"type":"text-delta", "delta":" comment"}`
3. `{"type":"text-delta", "delta":" puis-je vous aider ?"}`

Le hook `useChat()` concatène ces fragments instantanément dans l'état React, ce qui donne l'effet de frappe fluide en direct.

---

## 7. Sécurité : Les 3 règles d'or

Quand vous déployez un chatbot en production, ne laissez jamais votre route `/api/chat` ouverte sans contrôle :

1. **Limiter la taille des messages reçus** :
   Empêchez un utilisateur d'envoyer un pavé de 50 000 mots qui consommerait tous vos crédits d'API.
   ```typescript
   if (userText.length > 1000) {
     return new Response("Message trop long (max 1000 caractères)", { status: 400 });
   }
   ```

2. **Limiter le contexte envoyé (Trimming)** :
   Ne renvoyez pas 100 messages d'historique à chaque fois : ne gardez que les 6 ou 8 derniers échanges.
   ```typescript
   const trimmedMessages = messages.slice(-8);
   ```

3. **Mettre en place un Rate Limiting** :
   Plafonnez le nombre de requêtes par minute (ex: 20 messages / minute par IP) pour éviter les attaques par déni de service financier.

---

## 8. Comment brancher un Backend existant (Symfony / Laravel / etc.)

Si vous avez déjà une application métier (Symfony, Laravel, Django, etc.) :

1. **Laissez Next.js s'occuper de l'IA et de l'UI** : Le streaming SSE est natif et très performant sur les runtimes Node.js / Edge de Next.js.
2. **Utilisez votre API Symfony pour les données métier (Tool Calling)** :
   Si le chatbot a besoin de savoir *"Où en est la commande #1234 de l'utilisateur ?"*, le serveur Next.js appelle votre API Symfony (`GET https://api.monsite.com/orders/1234` avec le token de session) et donne le résultat à Gemini pour qu'il formule sa réponse.

---

## 9. Le Tool Calling (Function Calling) : Donner des super-pouvoirs à l'IA

Par défaut, l'IA ne connaît que les données sur lesquelles elle a été entraînée et ne peut pas agir sur le monde réel. **Les Tools permettent au modèle d'exécuter du code côté serveur.**

### Comment ça marche ?
```
1. L'utilisateur pose une question ("Où en est la commande CMD-1234 ?")
2. L'IA constate qu'elle a un outil `checkOrderStatus`.
3. L'IA génère les paramètres au format JSON (`{ orderId: "CMD-1234" }`).
4. Next.js exécute la fonction `execute()` sur le serveur (base de données, API externe, etc.).
5. Next.js renvoie le résultat à l'IA.
6. L'IA formule sa réponse finale en langage naturel à l'utilisateur.
```

### Anatomie d'un outil avec le SDK Vercel (`lib/tools.ts`) :
```typescript
import { tool } from 'ai';
import { z } from 'zod';

export const weatherTool = tool({
  description: 'Récupère la météo en direct pour une ville donnée.',
  inputSchema: z.object({
    city: z.string().describe('Le nom de la ville'),
  }),
  execute: async ({ city }) => {
    // Appel API externe ou logique serveur
    return { ville: city, temperature: '18°C', condition: 'Ensoleillé' };
  },
});
```

### Configuration dans `app/api/chat/route.ts` :
Pour que l'IA puisse exécuter l'outil puis formuler sa réponse dans le même échange, on utilise `stopWhen: isStepCount(5)` :

```typescript
const result = streamText({
  model: google('gemini-3.1-flash-lite'),
  messages: await convertToModelMessages(messages),
  stopWhen: isStepCount(5), // Permet la boucle automatique IA -> Tool -> Réponse
  tools: {
    getWeather: weatherTool,
    checkOrderStatus: checkOrderStatusTool,
  },
});
```

---

## 🎯 En résumé

Pour avoir un chatbot fonctionnel et outillé :
1. Installez `ai`, `@ai-sdk/react`, `@ai-sdk/google`, `zod`.
2. Mettez votre clé dans `.env` (`GOOGLE_GENERATIVE_AI_API_KEY=...`).
3. Définissez vos outils avec `tool()` et `zod` (`lib/tools.ts`).
4. Créez la route `app/api/chat/route.ts` avec `streamText()`, vos `tools` et `stopWhen: isStepCount(5)`.
5. Affichez les messages et badges d'outils dans votre composant avec `useChat()`.
