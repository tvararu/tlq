"use client";

import { useConversation } from "@11labs/react";
import { useCallback, useState } from "react";

type VoiceActivityIndicatorProps = {
  isActive: boolean;
  label: string;
};

export function VoiceActivityIndicator({
  isActive,
  label,
}: VoiceActivityIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-3 h-3 rounded-full transition-colors duration-200 ${
          isActive ? "bg-green-500" : "bg-gray-300"
        }`}
      />
      <div className="text-sm text-gray-300">{label}</div>
    </div>
  );
}

type Message = {
  message: string;
  source: "ai" | "user";
};

export function Conversation() {
  const [messages, setMessages] = useState<Message[]>([]);

  const conversation = useConversation({
    onConnect: () => console.log("Connected"),
    onDisconnect: () => console.log("Disconnected"),
    onMessage: (message: Message) => {
      setMessages((prev) => [...prev, message]);
    },
    onError: (error: string) => console.error("Error:", error),
  });

  const startConversation = useCallback(async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start the conversation with your agent
      await conversation.startSession({
        agentId: process.env.NEXT_PUBLIC_AGENT_ID,
      });
      setMessages([]); // Clear messages when starting new conversation
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  return (
    <>
      <div className="flex gap-2 my-4">
        <button
          onClick={startConversation}
          disabled={conversation.status === "connected"}
          className="px-4 py-2 bg-green-600 text-white rounded disabled:bg-gray-300 disabled:opacity-50"
        >
          📞 Start
        </button>
        <button
          onClick={stopConversation}
          disabled={conversation.status !== "connected"}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300 disabled:opacity-50"
        >
          👋
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <p className="">Status: {conversation.status}</p>

        <div className="flex flex-col gap-2">
          <VoiceActivityIndicator
            isActive={
              conversation.status === "connected" && !conversation.isSpeaking
            }
            label="Your turn to speak"
          />
          <VoiceActivityIndicator
            isActive={
              conversation.status === "connected" && conversation.isSpeaking
            }
            label="Narrator is speaking"
          />
        </div>

        <div className="w-full max-w-md bg-white rounded-lg shadow-sm border p-4 mt-4">
          <div className="flex flex-col gap-4 min-h-[400px] max-h-[600px] overflow-y-auto">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.source === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.source === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
