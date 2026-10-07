# 🤖 Démonstration Chatbot IA (Next.js + Vercel AI SDK + Symfony)

Ce projet est une application concrète montrant comment intégrer un **Chatbot IA en streaming** dans un frontend **Next.js**, tout en répondant aux enjeux d'architecture et de **sécurité** avec un backend **Symfony**.

---

## 🚀 Démarrage Rapide

1. **Installer les dépendances (déjà fait) :**
   ```bash
   npm install
   ```

2. **Lancer le serveur de développement :**
   ```bash
   npm run dev
   ```
   Rendez-vous sur [http://localhost:3000](http://localhost:3000) dans votre navigateur.

---

## 💡 Fonctionnement par Défaut : Mode Démo Simulé

Pour vous permettre de tester immédiatement l'interface et le streaming **sans avoir besoin de payer ou d'ajouter une clé API tout de suite** :
- Le serveur intègre un **mode de simulation de streaming Vercel AI SDK** (`MockLanguageModelV3`).
- Vous pouvez dialoguer en temps réel, tester le streaming mot à mot, tester les suggestions et éprouver les garde-fous de sécurité.

### 🔑 Configuration de la clé d'API :

Le projet supporte nativement **Google Gemini** (via `@ai-sdk/google`) ainsi qu'**OpenAI** :
- **Google Gemini** (Recommandé & déjà configuré) :
  Dans votre fichier `.env` :
  ```env
  GEMINI_API_KEY=votre_cle_gemini
  # ou GOOGLE_GENERATIVE_AI_API_KEY=votre_cle_gemini
  ```
  Le modèle utilisé est `gemini-3.1-flash-lite`, ultra-rapide et économique.

- **OpenAI** (Alternative) :
  ```env
  OPENAI_API_KEY=sk-...
  ```

---

## 🔒 Réponses aux questions de sécurité

### 1. "Le fait d'avoir l'IA en front ne pose-t-il pas des soucis de sécurité ?"
**Non**, car l'IA n'est pas exécutée dans le navigateur client :
- Le navigateur utilise uniquement le hook React `useChat()` pour envoyer du texte et recevoir un flux HTTP (SSE).
- L'appel aux modèles LLM se fait dans le **Route Handler serveur** Next.js (`app/api/chat/route.ts`).
- **Vos clés d'API ne transitent jamais sur le réseau client.**

### 2. "Qu'en est-il de la quantité et de la taille des prompts ?"
Dans `app/api/chat/route.ts`, nous avons implémenté les 4 boucliers recommandés :
1. **Contrôle de taille du prompt** : Tout message supérieur à 500 caractères est rejeté immédiatement avec un statut HTTP `400`.
2. **Anti-DDoS / Rate Limiting** : Limite du nombre de requêtes par IP (15 requêtes / minute) pour empêcher le spamming et l'épuisement des crédits.
3. **Fenêtre de contexte tronquée** : Seuls les 6 derniers messages de l'historique sont envoyés au LLM (évite l'explosion du coût en tokens d'entrée).
4. **Plafond mensuel fournisseur** : Côté OpenAI/Mistral, définir un *Hard Limit* mensuel (ex: 20 $).

---

## 🏛️ Architecture recommandée avec Symfony

```
[Navigateur / React useChat]
          │ (Stream SSE temps réel)
          ▼
[Route Next.js : /api/chat] ──────► [OpenAI / Mistral]
          │ (Tool Calling)
          ▼
[API Symfony REST/GraphQL]  ──────► [Base de données MySQL/PostgreSQL]
```

- **Next.js** s'occupe de l'expérience utilisateur, du streaming réactif et de la sécurisation des prompts.
- **Symfony** conserve la logique métier, la gestion des droits utilisateurs et l'intégrité de la base de données.
