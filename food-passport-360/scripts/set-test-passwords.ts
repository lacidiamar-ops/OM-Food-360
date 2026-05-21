import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const testUsers = [
  { id: "11111111-0000-0000-0000-000000000001", email: "joueur@test.fp" },
  { id: "22222222-0000-0000-0000-000000000002", email: "nutri@test.fp" },
  { id: "33333333-0000-0000-0000-000000000003", email: "cuisine@test.fp" },
  { id: "44444444-0000-0000-0000-000000000004", email: "hotel@test.fp" },
  { id: "55555555-0000-0000-0000-000000000005", email: "manager@test.fp" },
  { id: "66666666-0000-0000-0000-000000000006", email: "direction@test.fp" },
];

async function main() {
  for (const user of testUsers) {
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: "test1234!",
      email_confirm: true,
    });
    console.log(user.email, error ? "❌ " + error.message : "✅");
  }
}

main().catch(console.error);
