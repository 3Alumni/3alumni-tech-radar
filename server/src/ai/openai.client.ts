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

const DEFAULT_MODEL = "gpt-6-luna";

/** One OpenAI entry point. Callers load OPENAI_API_KEY before calling. */
export async function completeJson<T>(input: CompleteJsonInput): Promise<T> {
  const model = input.model ?? DEFAULT_MODEL;
  const messages =
    input.messages ??
    [
      { role: "system" as const, content: input.system ?? "" },
      { role: "user" as const, content: input.user ?? "" },
    ];
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  const payload: Record<string, unknown> = {
    model,
    reasoning_effort: model.includes("luna") ? "none" : "low",
    response_format: { type: "json_object" },
    messages,
  };
  if (model.includes("luna")) {
    payload.temperature = 0;
  }
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(payload),
  });
  const body = (await response.json()) as {
    error?: { message?: string };
    choices?: { message?: { content?: string } }[];
  };
  if (!response.ok) {
    throw new Error(body.error?.message ?? `OpenAI ${response.status}`);
  }
  return JSON.parse(body.choices?.[0]?.message?.content ?? "{}") as T;
}
