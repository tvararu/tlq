"use client";

import { useConversation } from "@11labs/react";
import { useCallback, useState, useRef, useEffect } from "react";

type Message = {
  message: string;
  source: "ai" | "user";
};

type ChatMessageLogProps = {
  messages: Message[];
};

function ChatMessageLog({ messages }: ChatMessageLogProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      `}</style>
      <div className="pt-32 w-full chat-container">
        <div className="flex flex-col gap-4">
          {messages.map((msg, messageIndex) => (
            <div
              key={messageIndex}
              className={`flex ${
                msg.source === "user" ? "justify-end" : "justify-start"
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

export function Conversation() {
  const [messages, setMessages] = useState<Message[]>([]);
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
          isUserTurn ? "bg-green-900" : "bg-gray-900"
        }`}
      >
        <div className="flex gap-2 items-center max-w-md mx-auto">
          <button
            onClick={startConversation}
            disabled={conversation.status === "connected"}
            className="px-4 py-2 bg-green-600 text-white disabled:bg-gray-300 disabled:opacity-50"
          >
            📞 {conversation.status !== "connected" && "Start"}
          </button>
          <button
            onClick={stopConversation}
            disabled={conversation.status !== "connected"}
            className="px-4 py-2 bg-red-500 text-white disabled:bg-gray-300 disabled:opacity-50"
          >
            👋
          </button>

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
        </div>
      </div>

      <div className="flex flex-col gap-4 max-w-md mx-auto">
        <ChatMessageLog messages={messages} />
      </div>
    </>
  );
}
