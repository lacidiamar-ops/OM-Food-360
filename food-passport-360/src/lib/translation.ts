import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const LANGUAGE_NAMES: Record<string, string> = {
  fr: "français",
  en: "English",
  es: "español",
  pt: "português",
  ar: "العربية",
  de: "Deutsch",
};

export async function translateMessage(
  content: string,
  fromLang: string,
  toLang: string
): Promise<string> {
  if (fromLang === toLang) return content;

  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `Translate this message from ${LANGUAGE_NAMES[fromLang] ?? fromLang} to ${LANGUAGE_NAMES[toLang] ?? toLang}.
Context: sports nutrition app for a professional football club (Olympique de Marseille).
Keep the same tone (formal/informal). Translate only, no explanation, no quotes.

Message: ${content}`,
      },
    ],
  });

  return response.content[0].type === "text" ? response.content[0].text.trim() : content;
}
