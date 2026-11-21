export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CompleteJsonInput {
  model?: string;
  system?: string;
  user?: string;
  messages?: ChatMessage[];
}

const DEFAULT_MODEL = "qwen3:8b";

/** One local Ollama entry point. Thinking is off so the reply is JSON. */
export async function completeJson<T>(input: CompleteJsonInput): Promise<T> {
  const model = input.model ?? DEFAULT_MODEL;
  const messages =
    input.messages ??
    [
      { role: "system" as const, content: input.system ?? "" },
      { role: "user" as const, content: input.user ?? "" },
    ];
  const response = await fetch("http://127.0.0.1:11434/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      format: "json",
      think: false,
      options: { temperature: 0 },
      messages,
    }),
  });
  const body = (await response.json()) as {
    error?: string;
    message?: { content?: string };
  };
  if (!response.ok) {
    throw new Error(body.error ?? `Ollama ${response.status}`);
  }
  return JSON.parse(body.message?.content ?? "{}") as T;
}
