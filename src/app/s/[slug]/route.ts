import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: site } = await supabase
    .from("published_sites")
    .select("html_content, business_name, views")
    .eq("slug", slug)
    .single();

  if (!site) {
    return new NextResponse("<h1>Site não encontrado</h1>", {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  await supabase
    .from("published_sites")
    .update({ views: (site.views || 0) + 1 })
    .eq("slug", slug);

  return new NextResponse(site.html_content, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
}
