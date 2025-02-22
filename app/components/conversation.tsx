"use client";

import { useConversation } from "@11labs/react";
import { useCallback, useState, useRef, useEffect } from "react";
import { fal } from "@fal-ai/client";

// Add type for LLM response
type AnyLlmResponse = {
  output: string;
};

fal.config({
  proxyUrl: "/api/fal/proxy",
});

type ButtonProps = {
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "danger" | "secondary";
  children: React.ReactNode;
};

function Button({
  onClick,
  disabled,
  variant = "primary",
  children,
}: ButtonProps) {
  const baseStyles = "rounded-lg font-bold transition-colors px-4 py-2 text-md";

  const variantStyles = {
    primary:
      "bg-green-500 hover:bg-green-600 text-green-900 disabled:bg-gray-800 disabled:opacity-50",
    danger:
      "bg-red-500 hover:bg-red-600 text-red-900 disabled:bg-gray-800 disabled:opacity-50",
    secondary:
      "bg-gray-700 hover:bg-gray-600 text-gray-200 disabled:bg-gray-800",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]}`}
    >
      {children}
    </button>
  );
}

type Message = {
  message: string;
  source: "ai" | "user";
  generatedImageUrl?: string;
  processedText?: string;
};

type ChatMessageLogProps = {
  messages: Message[];
};

function ChatMessageLog({ messages: initialMessages }: ChatMessageLogProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState(initialMessages);
  const [loadingStates, setLoadingStates] = useState<{
    [key: number]: boolean;
  }>({});

  useEffect(() => {
    setMessages((prevMessages) => {
      const imageUrlMap = new Map(
        prevMessages.map((msg, idx) => [idx, msg.generatedImageUrl])
      );

      return initialMessages.map((msg, idx) => ({
        ...msg,
        generatedImageUrl: imageUrlMap.get(idx) || msg.generatedImageUrl,
      }));
    });
  }, [initialMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const processTextForImage = async (text: string): Promise<string> => {
    try {
      console.log("Processing text through LLM:", text);

      const result = await fal.subscribe("fal-ai/any-llm", {
        input: {
          prompt: `Convert this text into a concise, visual description suitable for image generation. Focus on the key visual elements and remove any unnecessary context or dialogue. Make it descriptive but concise:

${text}`,
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      });

      console.log("LLM processing result:", result.data);
      console.log("LLM request ID:", result.requestId);

      // Extract the response from the LLM result
      const llmResponse = result.data as AnyLlmResponse;
      if (!llmResponse.output) {
        console.warn("No output from LLM, using original text");
        return text;
      }

      // Clean up the response - remove quotes if present and trim
      const processedText = llmResponse.output
        .replace(/^["']|["']$/g, "")
        .trim();
      console.log("Processed text for image generation:", processedText);
      return processedText;
    } catch (error) {
      console.error("Failed to process text through LLM:", error);
      return text; // Fallback to original text if processing fails
    }
  };

  const handleGenerateImage = async (message: string, messageIndex: number) => {
    if (loadingStates[messageIndex]) return; // Prevent duplicate generations

    setLoadingStates((prev) => ({
      ...prev,
      [messageIndex]: true,
    }));

    try {
      // Process the text through LLM first
      const processedPrompt = await processTextForImage(message);
      console.log("Original text:", message);
      console.log("Processed prompt:", processedPrompt);

      const result = await fal.subscribe("fal-ai/flux/dev", {
        input: {
          prompt: processedPrompt, // Now using the processed prompt
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      });

      console.log("Generation result:", result.data);
      console.log("Request ID:", result.requestId);

      if (result.data.images?.[0]?.url) {
        setMessages((prevMessages) =>
          prevMessages.map((msg, idx) =>
            idx === messageIndex
              ? {
                  ...msg,
                  generatedImageUrl: result.data.images[0].url,
                  processedText: processedPrompt,
                }
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Failed to generate image:", error);
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        [messageIndex]: false,
      }));
    }
  };

  // Automatically generate images for new AI messages
  useEffect(() => {
    messages.forEach((msg, idx) => {
      if (
        msg.source === "ai" &&
        idx > 0 &&
        !msg.generatedImageUrl &&
        !loadingStates[idx]
      ) {
        handleGenerateImage(msg.message, idx);
      }
    });
  }, [messages, loadingStates]);

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .word-animate {
          opacity: 0;
          animation: fadeIn 0.3s ease-out forwards;
          display: inline-block;
        }
        .chat-container {
          transition: all 0.3s ease;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .spinner {
          display: inline-block;
          animation: spin 1s linear infinite;
        }
      `}</style>
      <div className="pt-32 w-full chat-container">
        <div className="flex flex-col gap-4">
          {messages.map((msg, messageIndex) => (
            <div
              key={messageIndex}
              className={`flex flex-col ${
                msg.source === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`rounded-lg py-2 ${
                  msg.source === "user"
                    ? "max-w-[80%] px-4 bg-gray-800 text-gray-200"
                    : "text-gray-200"
                }`}
              >
                {msg.source === "user"
                  ? msg.message
                  : msg.message.split(" ").map((word, wordIndex) => (
                      <span key={wordIndex}>
                        <span
                          className="word-animate"
                          style={{
                            animationDelay: `${
                              messageIndex * 300 + wordIndex * 100
                            }ms`,
                          }}
                        >
                          {word}&nbsp;
                        </span>
                      </span>
                    ))}
              </div>
              {msg.source === "ai" && messageIndex > 0 && (
                <div className="mt-2">
                  {msg.generatedImageUrl ? (
                    <img
                      src={msg.generatedImageUrl}
                      alt={msg.processedText || "Generated image"}
                      className="rounded-lg"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400">
                      <span className="spinner">🌀</span>
                      <span>Generating image...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const isDevelopment = process.env.NODE_ENV === "development";

const DEMO_MESSAGES: Message[] = [
  {
    message: "Hello. Would you like to listen to a story?",
    source: "ai",
  },
  {
    message: "Yes.",
    source: "user",
  },
  {
    message:
      "The last question was asked for the first time, half in jest, on May 21, 2061, at a time when humanity first stepped into the light. The question came about as a result of a five-dollar bet over highballs, and it happened this way: Alexander Adell and Bertram Lupov were two of the faithful attendants of Multivac. As well as any human beings could, they knew what lay behind the cold, clicking, flashing face -- miles and miles of face -- of that giant computer.",
    source: "ai",
  },
  {
    message: "What is Multivac?",
    source: "user",
  },
  {
    message:
      "Multivac was the first computer to be built by the Multivac Corporation. It was a large, complex machine that could store and process information.",
    source: "ai",
  },
  {
    message: "Can you tell me more about Alexander Adell and Bertram Lupov?",
    source: "user",
  },
  {
    message:
      "Alexander Adell and Bertram Lupov were technicians who worked with Multivac. They were among the few humans who truly understood the complexity of the computer system. They spent their days monitoring and maintaining Multivac, ensuring it operated at peak efficiency. Their expertise and dedication made them invaluable to the operation of this remarkable machine.",
    source: "ai",
  },
  {
    message: "What was the five-dollar bet about?",
    source: "user",
  },
  {
    message:
      "The five-dollar bet was about whether Multivac could be asked a question that it couldn't answer. Adell and Lupov were discussing this over drinks, which led to them asking Multivac what would later become known as 'the last question' - a question about the ultimate fate of the universe and the possibility of reversing entropy.",
    source: "ai",
  },
  {
    message: "What exactly is entropy?",
    source: "user",
  },
  {
    message:
      "Entropy is a fundamental concept in physics that describes the gradual but inevitable trend of the universe toward increasing disorder and the dissipation of usable energy. In simple terms, it's the principle that everything in the universe is slowly running down, like a cosmic battery losing its charge. This concept becomes central to the story as it relates to humanity's ultimate question about the fate of the universe.",
    source: "ai",
  },
];

export function Conversation() {
  const [messages, setMessages] = useState<Message[]>(
    isDevelopment ? DEMO_MESSAGES : []
  );
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const MAX_DURATION = 300; // 5 minutes in seconds

  const conversation = useConversation({
    onConnect: () => console.log("Connected"),
    onDisconnect: () => console.log("Disconnected"),
    onMessage: (message: Message) => {
      setMessages((prev) => [...prev, message]);
    },
    onError: (error: string) => console.error("Error:", error),
  });

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  useEffect(() => {
    if (conversation.status === "connected") {
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= MAX_DURATION) {
            stopConversation().catch((error) =>
              console.error("Failed to stop conversation:", error)
            );
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setDuration(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [conversation.status, stopConversation, MAX_DURATION]);

  const startConversation = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: process.env.NEXT_PUBLIC_AGENT_ID,
      });
      setMessages([]);
      setDuration(0);
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  }, [conversation]);

  const isUserTurn =
    conversation.status === "connected" && !conversation.isSpeaking;

  const progressPercent = (duration / MAX_DURATION) * 100;

  return (
    <>
      <div
        className={`fixed top-0 left-0 right-0 z-10 p-4 border-b border-gray-700 transition-colors duration-300 ${
          isUserTurn ? "bg-green-500" : "bg-black"
        }`}
      >
        <div className="flex gap-2 justify-between max-w-md mx-auto">
          <Button
            onClick={startConversation}
            disabled={conversation.status === "connected"}
            variant="primary"
          >
            📞 {conversation.status !== "connected" && "Hello?"}
          </Button>

          {conversation.status === "connected" && (
            <div className="flex items-center gap-3 ml-4">
              <div className="text-gray-200 min-w-[80px]">
                {formatTime(duration)} / 5:00
              </div>
              <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 transition-all duration-1000 ease-linear"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor:
                      progressPercent > 80 ? "#ef4444" : "#22c55e",
                  }}
                />
              </div>
            </div>
          )}

          <Button
            onClick={stopConversation}
            disabled={conversation.status !== "connected"}
            variant="danger"
          >
            👋
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 max-w-md mx-auto">
        <ChatMessageLog messages={messages} />
      </div>
    </>
  );
}
