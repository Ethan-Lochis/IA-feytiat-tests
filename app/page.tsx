import ChatBot from '@/components/ChatBot';

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold text-center text-zinc-800 dark:text-zinc-100">
          Chatbot Google Gemini & Vercel AI SDK
        </h1>
        <ChatBot />
      </div>
    </main>
  );
}
