import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getMenuWithItems } from "@/lib/supabase/queries";
import type { SupportedLang } from "@/lib/supabase/food-passport.types";
import PrintButton from "@/app/[locale]/(resto)/resto/print/PrintButton";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

const CATEGORY_FR: Record<string, string> = {
  feculent: "Féculents",
  proteine_animale: "Protéines animales",
  proteine_vegetale: "Protéines végétales",
  legume: "Légumes",
  fruit: "Fruits",
  laitage: "Laitages",
  pain_viennoiserie: "Pains & viennoiseries",
  dessert: "Desserts",
  boisson: "Boissons",
  supplement: "Suppléments",
  condiment: "Condiments",
};

export default async function MenuPrintPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const t = await getTranslations("menus");
  const locale = (await getLocale()) as SupportedLang;

  const { menu, items } = await getMenuWithItems(supabase, id, locale);
  if (!menu) notFound();

  // Grouper par catégorie
  const byCategory = items.reduce<Record<string, typeof items>>((acc, item) => {
    const cat = item.article?.category ?? "autre";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const menuDate = new Date(menu.date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Actions — masquées à l'impression */}
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/resto/menus/${id}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
          {t("back")}
        </Link>
        <PrintButton label={t("print")} />
      </div>

      {/* Contenu imprimable */}
      <header className="text-center space-y-1 pb-4 border-b border-border">
        <div className="text-xs text-muted-foreground uppercase tracking-widest">FOOD PASSPORT 360</div>
        <h1 className="text-2xl font-bold">{menu.title}</h1>
        <p className="text-sm text-muted-foreground capitalize">{menuDate}</p>
        <p className="text-xs text-muted-foreground">
          {menu.location_name && `${menu.location_name} · `}
          {menu.start_time && `${menu.start_time}–${menu.end_time}`}
        </p>
      </header>

      {Object.entries(byCategory).map(([cat, catItems]) => (
        <section key={cat} className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
            {CATEGORY_FR[cat] ?? cat}
          </h2>
          <ul className="space-y-1">
            {catItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between text-sm py-1">
                <span className={!item.available ? "line-through text-muted-foreground" : ""}>
                  {item.article?.name ?? "—"}
                </span>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {item.article?.is_halal && <span className="text-emerald-600 font-medium">Halal</span>}
                  {item.article?.is_gluten_free && <span className="text-amber-600 font-medium">SG</span>}
                  {item.article?.is_vegan && <span className="text-green-600 font-medium">Vegan</span>}
                  {item.article?.standard_portion_g && <span>{item.article.standard_portion_g} g</span>}
                  {item.portions_available != null && <span>×{item.portions_available}</span>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {items.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">{t("noItems")}</p>
      )}

      <footer className="print:block hidden text-center text-xs text-muted-foreground pt-4 border-t border-border">
        Imprimé le {new Date().toLocaleDateString("fr-FR")} — FOOD PASSPORT 360
      </footer>
    </div>
  );
}
