import { google } from '@ai-sdk/google';
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from 'ai';
import {
  weatherTool,
  currencyConverterTool,
  searchProductsTool,
  checkOrderStatusTool,
} from '@/lib/tools';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: google('gemini-3.1-flash-lite'),
    system:
      'Tu es un assistant IA serviable, précis et concis. Réponds en français. ' +
      'Utilise les outils à ta disposition dès que l’utilisateur demande la météo, une conversion monétaire, une recherche de produit ou le suivi d’une commande.',
    messages: await convertToModelMessages(messages),
    stopWhen: isStepCount(5),
    tools: {
      getWeather: weatherTool,
      convertCurrency: currencyConverterTool,
      searchProducts: searchProductsTool,
      checkOrderStatus: checkOrderStatusTool,
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
