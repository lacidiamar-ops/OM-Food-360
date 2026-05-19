import { translateMessage } from "@/lib/translation";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { messageId, content, fromLang, toLang } = body as {
    messageId?: string;
    content?: string;
    fromLang?: string;
    toLang?: string;
  };

  if (!content || !toLang) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    // Check cache first
    if (messageId) {
      const { data: cached } = await supabase
        .schema("food_passport" as never)
        .from("message_translations")
        .select("translated_content")
        .eq("message_id", messageId)
        .eq("language", toLang)
        .single();

      if (cached) {
        return NextResponse.json({ translated: (cached as { translated_content: string }).translated_content });
      }
    }

    const translated = await translateMessage(content, fromLang ?? "fr", toLang);

    // Cache it
    if (messageId) {
      await supabase
        .schema("food_passport" as never)
        .from("message_translations")
        .upsert({ message_id: messageId, language: toLang, translated_content: translated });
    }

    return NextResponse.json({ translated });
  } catch {
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
