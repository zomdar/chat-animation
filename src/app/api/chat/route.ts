import { createOpenAI } from '@ai-sdk/openai';
import { convertToCoreMessages, streamText } from 'ai';

export const runtime = 'edge';

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return new Response('OPENAI_API_KEY is not configured.', { status: 500 });
  }

  const openai = createOpenAI({
    apiKey,
  });

  const body = await request.json();
  const coreMessages = convertToCoreMessages(body.messages ?? []);

  const result = await streamText({
    model: openai('gpt-4o-mini'),
    messages: coreMessages,
  });

  return result.toUIMessageStreamResponse();
}
