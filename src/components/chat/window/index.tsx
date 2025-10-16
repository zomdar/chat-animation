'use client';

import { useCallback, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import type { ChatStatus, UIMessage, UIMessagePart } from "ai";
import { DefaultChatTransport } from "ai";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
  Loader,
  Message,
  MessageContent,
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuItem,
  PromptInputActionMenuTrigger,
  PromptInputAttachments,
  PromptInputAttachment,
  PromptInputBody,
  PromptInputButton,
  PromptInputMessage,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputProvider,
  PromptInputSpeechButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  Response,
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
  Suggestion,
  Suggestions,
  usePromptInputController,
} from "@/components/ai-elements";
import { Button } from "@/components/ui/button";
import { GlobeIcon } from "lucide-react";

type SearchSourceMetadata = {
  id: string;
  rank: number;
  title: string;
  url: string;
  snippet: string;
};

type ChatMessageMetadata = {
  model?: string;
  sources?: SearchSourceMetadata[];
  searchNote?: string;
};

type ChatMessage = UIMessage<ChatMessageMetadata>;

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome-message",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "Hello, I'm Franklin. Ask me anything to get started!",
      },
    ],
  },
];

const ALLOWED_PARTS = new Set(["text", "reasoning", "tool-result"]);

const getPartText = (part: UIMessagePart<any, any>): string => {
  const candidate = part as { type?: string; text?: unknown; content?: unknown };

  if (candidate.type && !ALLOWED_PARTS.has(candidate.type)) {
    return "";
  }

  if (typeof candidate.text === "string") {
    return candidate.text;
  }

  if (typeof candidate.content === "string") {
    return candidate.content;
  }

  return "";
};

const getMessageText = (message: ChatMessage): string => {
  if (!Array.isArray(message.parts)) {
    return "";
  }

  return message.parts
    .map(getPartText)
    .filter((text) => Boolean(text.trim()))
    .join("\n\n");
};

const MODEL_OPTIONS = [
  { id: "gpt-4o-mini", name: "GPT-4o mini" },
  { id: "gpt-4.1-mini", name: "GPT-4.1 mini" },
  { id: "gpt-4", name: "GPT-4" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
  { id: "claude-2", name: "Claude 2" },
  { id: "claude-instant", name: "Claude Instant" },
  { id: "palm-2", name: "PaLM 2" },
  { id: "llama-2-70b", name: "Llama 2 70B" },
  { id: "llama-2-13b", name: "Llama 2 13B" },
  { id: "cohere-command", name: "Command" },
  { id: "mistral-7b", name: "Mistral 7B" },
];

const QuickSuggestions = ({
  items,
  onSelect,
}: {
  items: string[];
  onSelect?: () => void;
}) => {
  const controller = usePromptInputController();

  return (
    <Suggestions className="px-1">
      {items.map((suggestion) => (
        <Suggestion
          key={suggestion}
          suggestion={suggestion}
          onClick={(value) => {
            controller.textInput.setInput(value);
            onSelect?.();
          }}
          variant="secondary"
        />
      ))}
    </Suggestions>
  );
};

type ChatInputBarProps = {
  isStreaming: boolean;
  onSubmit: (payload: PromptInputMessage) => void | Promise<void>;
  status: ChatStatus;
  model: string;
  onModelChange: (model: string) => void;
  useWebSearch: boolean;
  onToggleWebSearch: () => void;
};

const ChatInputBar = ({
  isStreaming,
  onSubmit,
  status,
  model,
  onModelChange,
  useWebSearch,
  onToggleWebSearch,
}: ChatInputBarProps) => {
  const controller = usePromptInputController();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const hasMessage =
    controller.textInput.value.trim().length > 0 ||
    controller.attachments.files.length > 0;

  return (
    <PromptInput
      className="chat-input-form w-full"
      globalDrop
      maxFiles={4}
      multiple
      onSubmit={onSubmit}
    >
      <PromptInputAttachments>
        {(attachment) => (
          <PromptInputAttachment
            key={attachment.id}
            className="border-white/10 bg-white/5"
            data={attachment}
          />
        )}
      </PromptInputAttachments>

      <PromptInputBody>
        <PromptInputTextarea
          className="min-h-12 bg-transparent text-sm text-white placeholder:text-neutral-500 sm:min-h-14"
          disabled={isStreaming}
          placeholder={
            isStreaming
              ? "Waiting for Franklin to respond…"
              : "What would you like to know?"
          }
          ref={textareaRef}
        />
      </PromptInputBody>

      <PromptInputToolbar className="flex items-center gap-2 border-none bg-transparent px-1 py-2 sm:px-2">
        <PromptInputTools className="flex items-center gap-1 text-neutral-400">
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger
              aria-label="Open prompt tools"
              className="rounded-full bg-white/5 text-neutral-300 hover:bg-white/10"
            />
            <PromptInputActionMenuContent className="border border-white/10 bg-[#0f0f0f] text-sm">
              <PromptInputActionAddAttachments />
              <PromptInputActionMenuItem disabled>
                More tools coming soon
              </PromptInputActionMenuItem>
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>

          <PromptInputSpeechButton
            aria-label="Start voice input"
            className="rounded-full text-neutral-300 hover:bg-white/10"
            onTranscriptionChange={controller.textInput.setInput}
            textareaRef={textareaRef}
            variant="ghost"
          />

          <PromptInputButton
            aria-pressed={useWebSearch}
            onClick={onToggleWebSearch}
            variant={useWebSearch ? "default" : "ghost"}
          >
            <GlobeIcon size={16} />
            <span>Search</span>
          </PromptInputButton>

          <PromptInputModelSelect onValueChange={onModelChange} value={model}>
            <PromptInputModelSelectTrigger
              aria-label="Select model"
              className="w-auto rounded-full border border-white/10 bg-transparent px-3 text-xs uppercase tracking-wide text-neutral-400 hover:bg-white/5"
            >
              <PromptInputModelSelectValue placeholder="Select a model" />
            </PromptInputModelSelectTrigger>
            <PromptInputModelSelectContent className="max-h-60 border border-white/10 bg-[#0f0f0f]">
              {MODEL_OPTIONS.map((option) => (
                <PromptInputModelSelectItem key={option.id} value={option.id}>
                  {option.name}
                </PromptInputModelSelectItem>
              ))}
            </PromptInputModelSelectContent>
          </PromptInputModelSelect>
        </PromptInputTools>

        <PromptInputSubmit
          className="ml-auto rounded-full bg-white text-black hover:bg-white/90"
          disabled={!hasMessage || isStreaming}
          status={status}
          variant="default"
        />
      </PromptInputToolbar>
    </PromptInput>
  );
};

export const ChatWindow = () => {
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [selectedModel, setSelectedModel] = useState(
    () => MODEL_OPTIONS[0]?.id ?? ""
  );
  const [useWebSearch, setUseWebSearch] = useState(false);

  const transport = useMemo(
    () => new DefaultChatTransport<ChatMessage>({ api: "/api/chat" }),
    []
  );

  const { messages, sendMessage, status, setMessages, error } = useChat<ChatMessage>({
    transport,
    messages: INITIAL_MESSAGES,
  });

  const isStreaming = status === "streaming" || status === "submitted";
  const hasUserMessages = useMemo(
    () => messages.some((message) => message.role === "user"),
    [messages]
  );

  const sendUserMessage = useCallback(
    async (payload: PromptInputMessage) => {
      if (isStreaming) {
        return;
      }

      const trimmed = payload.text?.trim();
      const hasText = Boolean(trimmed);
      const hasFiles = Boolean(payload.files?.length);

      if (!hasText && !hasFiles) {
        return;
      }

      setShowSuggestions(false);
      const messagePayload = hasText
        ? { text: trimmed!, ...(hasFiles ? { files: payload.files } : {}) }
        : { files: payload.files! };

      await sendMessage(messagePayload, {
        body: {
          model: selectedModel,
          useWebSearch,
        },
      });
    },
    [isStreaming, sendMessage, selectedModel, useWebSearch]
  );

  const suggestions = useMemo(
    () => [
      "Summarize the conversation so far in three bullet points.",
      "What are the next steps I should take based on this chat?",
      "Explain the main concept we just discussed in simple terms.",
    ],
    []
  );

  const shouldShowInlineSuggestions =
    showSuggestions && !hasUserMessages && !isStreaming;

  const statusLabel =
    status === "streaming"
      ? "Responding"
      : status === "submitted"
        ? "Sending"
        : status === "error"
          ? "Error"
          : "Ready";

  const statusTone =
    status === "error"
      ? "bg-red-500/80"
      : status === "streaming" || status === "submitted"
        ? "bg-emerald-400/80"
        : "bg-neutral-500/60";

  const handleClearHistory = useCallback(() => {
    setMessages(
      INITIAL_MESSAGES.map((message) => ({
        ...message,
        parts: Array.isArray(message.parts) ? [...message.parts] : [],
      }))
    );
    setShowSuggestions(true);
  }, [setMessages]);

  const lastMessage = messages[messages.length - 1];

  const shouldShowLoader = useMemo(() => {
    if (!(status === "streaming" || status === "submitted")) {
      return false;
    }

    if (!lastMessage || lastMessage.role !== "assistant") {
      return true;
    }

    return !getMessageText(lastMessage).trim();
  }, [lastMessage, status]);

  return (
    <PromptInputProvider>
      <div className="flex min-h-screen flex-col bg-[#050505] text-neutral-100">
        <div className="flex-1 px-4 py-4 sm:px-6 sm:py-6 md:px-8">
          <div className="mx-auto flex h-full w-full max-w-[400px] flex-col gap-6 sm:max-w-[500px] md:max-w-3xl md:w-[720px]">
            <header className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 shadow-lg shadow-black/40 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5">
              <div className="space-y-1 text-center sm:text-left">
                <h1 className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400 sm:text-sm">
                  Franklin
                </h1>
                <p className="text-[11px] text-neutral-500 sm:text-xs">
                  Your friendly neighborhood AI assistant
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-[11px] text-neutral-400 sm:text-xs">
                  <span className={`h-2 w-2 rounded-full ${statusTone}`} />
                  {statusLabel}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-white/10 bg-transparent text-[11px] text-neutral-300 hover:bg-white/10 sm:text-xs"
                  onClick={handleClearHistory}
                  disabled={
                    isStreaming || messages.length <= INITIAL_MESSAGES.length
                  }
                >
                  Clear
                </Button>
              </div>
            </header>

            <Conversation className="flex-1">
              <ConversationContent className="px-0">
                <div className="mx-auto flex w-full max-w-[400px] flex-col gap-6 px-2 sm:max-w-[480px] sm:gap-8 sm:px-0 md:max-w-2xl">
                  {messages.length === 0 ? (
                    <ConversationEmptyState
                      className="bg-transparent px-2 sm:px-0"
                      description="Start a conversation to see responses from Franklin."
                      title="No messages yet"
                    />
                  ) : (
                    messages.map((message) => {
                      const isUser = message.role === "user";
                      const text = getMessageText(message);
                      const metadata = message.metadata;
                      const sources = Array.isArray(metadata?.sources)
                        ? metadata.sources.filter((source) =>
                            Boolean(source.url)
                          )
                        : [];
                      const searchNote =
                        typeof metadata?.searchNote === "string"
                          ? metadata.searchNote
                          : null;

                      if (!text) {
                        return null;
                      }

                      return (
                        <Message key={message.id} from={message.role}>
                          {isUser ? (
                            <MessageContent
                              variant="contained"
                              className="ml-auto max-w-[85%] rounded-2xl bg-white/10 px-4 py-2 text-sm text-white shadow-sm sm:max-w-xs"
                            >
                              {text}
                            </MessageContent>
                          ) : (
                            <div className="flex max-w-full flex-col gap-3">
                              <Response className="max-w-full whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-200 sm:text-base">
                                {text}
                              </Response>
                              {sources.length > 0 ? (
                                <Sources>
                                  <SourcesTrigger count={sources.length} />
                                  <SourcesContent>
                                    {sources.map((source) => (
                                      <Source
                                        description={source.snippet}
                                        href={source.url}
                                        key={source.id}
                                        rank={source.rank}
                                        title={source.title}
                                      />
                                    ))}
                                  </SourcesContent>
                                </Sources>
                              ) : null}
                              {searchNote ? (
                                <p className="text-xs text-neutral-500">
                                  {searchNote}
                                </p>
                              ) : null}
                            </div>
                          )}
                        </Message>
                      );
                    })
                  )}

                  {shouldShowLoader ? (
                    <div className="flex items-center gap-2 py-4 pl-1 text-sm text-neutral-400">
                      <Loader size={18} />
                      <span>Franklin is thinking…</span>
                    </div>
                  ) : null}

                  {shouldShowInlineSuggestions ? (
                    <div className="flex justify-center pt-1 sm:pt-2">
                      <QuickSuggestions
                        items={suggestions}
                        onSelect={() => setShowSuggestions(false)}
                      />
                    </div>
                  ) : null}
                </div>
              </ConversationContent>
              <ConversationScrollButton className="border-0 bg-white/10 text-white hover:bg-white/20" />
            </Conversation>

            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-300">
                {error.message ?? "Something went wrong. Please try again."}
              </div>
            ) : null}
          </div>
        </div>

        <div className="sticky bottom-0 w-full border-white/10 bg-[#050505]/95 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 sm:px-6 sm:pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:pt-4 md:px-8">
          <div className="mx-auto w-full max-w-[400px] sm:max-w-[500px] md:max-w-3xl md:w-[720px]">
            <ChatInputBar
              isStreaming={isStreaming}
              onSubmit={sendUserMessage}
              status={status}
              model={selectedModel}
              onModelChange={setSelectedModel}
              useWebSearch={useWebSearch}
              onToggleWebSearch={() => setUseWebSearch((prev) => !prev)}
            />
          </div>
        </div>
      </div>
    </PromptInputProvider>
  );
};
