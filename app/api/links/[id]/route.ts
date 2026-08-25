import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/links/[id]">) {
  const { id } = await ctx.params;

  const auth = await createClient();
  const {
    data: { user },
  } = await auth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from("links")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Ошибка удаления ссылки:", error);
    return NextResponse.json({ error: "Не удалось удалить ссылку" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
