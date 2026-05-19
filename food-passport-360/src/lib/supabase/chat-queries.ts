import type { SupabaseClient } from "@supabase/supabase-js";
import type { FPConversationWithPreview, FPMessage } from "./food-passport.types";

export async function getConversations(
  supabase: SupabaseClient,
  userId: string
): Promise<FPConversationWithPreview[]> {
  const { data: convs } = await supabase
    .schema("food_passport" as never)
    .from("conversations")
    .select("*")
    .filter("participant_ids", "cs", `{${userId}}`)
    .order("updated_at", { ascending: false });

  if (!convs || convs.length === 0) return [];

  const results: FPConversationWithPreview[] = [];

  for (const conv of convs) {
    // Fetch last message
    const { data: msgs } = await supabase
      .schema("food_passport" as never)
      .from("messages")
      .select("*")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const lastMessage = msgs?.[0] ?? null;

    // Fetch other participant profile
    const otherIds = (conv.participant_ids as string[]).filter((id: string) => id !== userId);
    let otherParticipant = null;
    if (otherIds.length > 0) {
      const { data: profile } = await supabase
        .schema("food_passport" as never)
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", otherIds[0])
        .single();
      otherParticipant = profile;
    }

    results.push({
      ...conv,
      last_message: lastMessage,
      other_participant: otherParticipant as FPConversationWithPreview["other_participant"],
    });
  }

  return results;
}

export async function getMessages(
  supabase: SupabaseClient,
  conversationId: string
): Promise<FPMessage[]> {
  const { data } = await supabase
    .schema("food_passport" as never)
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return (data as FPMessage[]) ?? [];
}

export async function sendMessage(
  supabase: SupabaseClient,
  conversationId: string,
  senderId: string,
  content: string
): Promise<{ data: FPMessage | null; error: string | null }> {
  const { data, error } = await supabase
    .schema("food_passport" as never)
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, content })
    .select()
    .single();

  // Also update conversation updated_at
  await supabase
    .schema("food_passport" as never)
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return { data: data as FPMessage | null, error: error?.message ?? null };
}

export async function getOrCreateConversation(
  supabase: SupabaseClient,
  type: string,
  participantIds: string[]
): Promise<{ data: { id: string } | null; error: string | null }> {
  // Check if conversation already exists with these exact participants
  const { data: existing } = await supabase
    .schema("food_passport" as never)
    .from("conversations")
    .select("id")
    .eq("type", type)
    .filter("participant_ids", "cs", `{${participantIds[0]}}`)
    .filter("participant_ids", "cs", `{${participantIds[1] ?? participantIds[0]}}`)
    .limit(1);

  if (existing && existing.length > 0) {
    return { data: existing[0] as { id: string }, error: null };
  }

  const { data, error } = await supabase
    .schema("food_passport" as never)
    .from("conversations")
    .insert({ type, participant_ids: participantIds })
    .select("id")
    .single();

  return { data: data as { id: string } | null, error: error?.message ?? null };
}

export async function getProfilesByRole(
  supabase: SupabaseClient,
  role: string
): Promise<Array<{ id: string; full_name: string | null }>> {
  const { data } = await supabase
    .schema("food_passport" as never)
    .from("profiles")
    .select("id, full_name")
    .eq("role", role);

  return (data ?? []) as Array<{ id: string; full_name: string | null }>;
}

export function countUnread(messages: FPMessage[], userId: string): number {
  return messages.filter(
    (m) => m.sender_id !== userId && !m.read_by.includes(userId)
  ).length;
}
