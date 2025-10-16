import { createOpenAI } from "@ai-sdk/openai";
import type { CoreMessage, UIMessage } from "ai";
import { convertToCoreMessages, safeValidateUIMessages, streamText } from "ai";

export const runtime = "edge";

type RequestPayload = {
  messages?: unknown;
  model?: unknown;
  useWebSearch?: unknown;
};

type SearchResult = {
  title: string;
  url: string;
  snippet: string;
};

type SearchSource = {
  id: string;
  rank: number;
  title: string;
  url: string;
  snippet: string;
};

type ResponseMetadata = {
  model: string;
  sources?: SearchSource[];
  searchNote?: string;
};

const OPENAI_MODEL_ALIASES: Record<string, string> = {
  "gpt-4o-mini": "gpt-4o-mini",
  "gpt-4o": "gpt-4o",
  "gpt-4.1-mini": "gpt-4.1-mini",
  "gpt-4-turbo": "gpt-4-turbo",
  "gpt-4": "gpt-4o",
  "gpt-3.5-turbo": "gpt-3.5-turbo",
};

const DEFAULT_MODEL = "gpt-4o-mini";

const extractText = (message: UIMessage): string => {
  if (!message || typeof message !== "object") {
    return "";
  }

  const parts = Array.isArray(message.parts) ? message.parts : null;
  if (parts) {
    for (const part of parts) {
      if (
        part &&
        typeof part === "object" &&
        "type" in part &&
        (part as { type?: unknown }).type === "text"
      ) {
        const text = (part as { text?: unknown }).text;
        if (typeof text === "string") {
          return text;
        }
      }
    }
  }

  const content = (message as { content?: unknown }).content;

  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    for (const item of content) {
      if (
        item &&
        typeof item === "object" &&
        "text" in item &&
        typeof (item as { text?: unknown }).text === "string"
      ) {
        return (item as { text: string }).text;
      }
    }
  }

  return "";
};

const resolveModel = (model: unknown) => {
  if (typeof model !== "string" || model.trim() === "") {
    return { resolved: DEFAULT_MODEL, fallbackNote: null };
  }

  const trimmed = model.trim();
  const alias = OPENAI_MODEL_ALIASES[trimmed];

  if (alias) {
    return { resolved: alias, fallbackNote: null };
  }

  return {
    resolved: DEFAULT_MODEL,
    fallbackNote: `Model "${trimmed}" is not supported by the current backend. Falling back to ${DEFAULT_MODEL}.`,
  };
};

const formatSearchResults = (query: string, sources: SearchSource[]) => {
  const lines = sources.map((source) => {
    const snippet = source.snippet.replace(/\s+/g, " ").trim();
    return `[${source.rank}] ${source.title}\n${snippet}\n${source.url}`;
  });

  return `Web search results for "${query}":\n\n${lines.join(
    "\n\n"
  )}\n\nUse these results to craft your answer. You must include at least one citation in the form [n] that corresponds to the numbered sources above. Do not say that you cannot browse the web—acknowledge that these sources were provided to you moments ago. If none of the sources contain relevant information, state that clearly.`;
};

const fetchSearchResults = async (
  query: string,
  serpApiKey: string
): Promise<SearchResult[] | null> => {
  if (!query || !query.trim()) {
    return null;
  }

  if (!serpApiKey) {
    return null;
  }

  const searchUrl = new URL("https://serpapi.com/search.json");
  searchUrl.searchParams.set("engine", "google");
  searchUrl.searchParams.set("api_key", serpApiKey);
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("num", "5");

  try {
    const response = await fetch(searchUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error("Search request failed:", response.statusText);
      return null;
    }

    const data = (await response.json()) as {
      organic_results?: Array<{
        title?: string;
        link?: string;
        snippet?: string;
      }>;
    };

    if (!Array.isArray(data.organic_results)) {
      return null;
    }

    return data.organic_results
      .map((item) => ({
        title:
          typeof item.title === "string" && item.title.trim() !== ""
            ? item.title.trim()
            : "Untitled result",
        url:
          typeof item.link === "string" && item.link.trim() !== ""
            ? item.link.trim()
            : "",
        snippet:
          typeof item.snippet === "string" && item.snippet.trim() !== ""
            ? item.snippet.trim()
            : "",
      }))
      .filter((item) => item.url !== "")
      .slice(0, 5);
  } catch (error) {
    console.error("Search request error:", error);
    return null;
  }
};

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return new Response("OPENAI_API_KEY is not configured.", { status: 500 });
  }

  const openai = createOpenAI({
    apiKey,
  });

  let parsedBody: RequestPayload;

  try {
    parsedBody = (await request.json()) as RequestPayload;
  } catch (error) {
    console.error("Failed to parse request body:", error);
    return new Response("Invalid request body.", { status: 400 });
  }

  const rawMessages = Array.isArray(parsedBody.messages)
    ? parsedBody.messages
    : [];

  const validated = await safeValidateUIMessages({ messages: rawMessages });

  if (!validated.success) {
    console.error("Invalid messages payload:", validated.error);
    return new Response("Invalid chat messages payload.", { status: 400 });
  }

  const messages = validated.data;
  const { resolved: resolvedModel, fallbackNote } = resolveModel(
    parsedBody.model
  );
  const useWebSearch = Boolean(parsedBody.useWebSearch);
  const serpApiKey = process.env.SERP_API_KEY ?? "";

  const coreMessages = convertToCoreMessages(messages);

  const augmentedMessages: CoreMessage[] = [...coreMessages];
  const responseMetadata: ResponseMetadata = {
    model: resolvedModel,
  };

  if (fallbackNote) {
    augmentedMessages.unshift({
      role: "system",
      content: fallbackNote,
    });
  }

  if (useWebSearch && messages.length > 0) {
    const lastUserMessageIndex = (() => {
      for (let i = messages.length - 1; i >= 0; i -= 1) {
        if (messages[i]?.role === "user") {
          return i;
        }
      }
      return -1;
    })();

    const query =
      lastUserMessageIndex >= 0
        ? extractText(messages[lastUserMessageIndex])
        : "";
    if (query) {
      if (!serpApiKey) {
        const note =
          "Web search is enabled, but SERP_API_KEY is not configured on the server.";
        augmentedMessages.unshift({
          role: "system",
          content: note,
        });
        responseMetadata.searchNote = note;
      } else {
        const searchResults = await fetchSearchResults(query, serpApiKey);

        if (searchResults && searchResults.length > 0) {
          const normalizedSources: SearchSource[] = searchResults.map(
            (result, index) => ({
              id: `search-${index + 1}`,
              rank: index + 1,
              title: result.title,
              url: result.url,
              snippet: result.snippet,
            })
          );
          const searchMessage: CoreMessage = {
            role: "system",
            content: formatSearchResults(query, normalizedSources),
          };

          const insertionIndex = (() => {
            for (let i = augmentedMessages.length - 1; i >= 0; i -= 1) {
              if (augmentedMessages[i]?.role === "user") {
                return i;
              }
            }
            return augmentedMessages.length;
          })();

          augmentedMessages.splice(insertionIndex, 0, searchMessage);
          responseMetadata.sources = normalizedSources;
        } else {
          const note = `Web search was requested for "${query}", but no results were available.`;
          augmentedMessages.unshift({
            role: "system",
            content: note,
          });
          responseMetadata.searchNote = note;
        }
      }
    } else {
      responseMetadata.searchNote =
        "Web search was requested, but the query could not be determined.";
    }
  }

  const result = await streamText({
    model: openai(resolvedModel),
    messages: augmentedMessages,
  });

  return result.toUIMessageStreamResponse({
    sendSources: true,
    messageMetadata: () => responseMetadata,
  });
}
