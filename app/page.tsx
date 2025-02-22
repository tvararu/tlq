import { Conversation } from "./components/conversation";

export default function Home() {
  return (
    <main className="p-8 min-h-screen bg-black text-white">
      <h1 className="text-4xl font-bold mb-8">The Last Question</h1>
      <Conversation />
    </main>
  );
}
