"use client";

import { useConversation } from "@11labs/react";
import { useCallback } from "react";
import { VoiceActivityIndicator } from "./voice-activity-indicator";

export function Conversation() {
  const conversation = useConversation({
    onConnect: () => console.log("Connected"),
    onDisconnect: () => console.log("Disconnected"),
    onMessage: (message: string) => console.log("Message:", message),
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
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex gap-2">
        <button
          onClick={startConversation}
          disabled={conversation.status === "connected"}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Start Conversation
        </button>
        <button
          onClick={stopConversation}
          disabled={conversation.status !== "connected"}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300"
        >
          Stop Conversation
        </button>
      </div>

      <div className="flex flex-col items-center gap-4">
        <p>Status: {conversation.status}</p>

        <div className="flex flex-col gap-2">
          <VoiceActivityIndicator
            isActive={
              conversation.status === "connected" && !conversation.isSpeaking
            }
            label="Waiting for your input"
          />
          <VoiceActivityIndicator
            isActive={
              conversation.status === "connected" && conversation.isSpeaking
            }
            label="Narrator is speaking"
          />
        </div>
      </div>
    </div>
  );
}
