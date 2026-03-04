import LandingNavbar from "@/components/layout/LandingNavbar";
import LandingFooter from "@/components/layout/LandingFooter";
import Link from "next/link";
import { getLanguage } from "@/actions/language";
import { getDictionary } from "@/lib/dictionary";
import { ArrowRight, Brain, Wrench, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import UniversityIcon from "@/components/common/UniversityIcon";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const revalidate = 60;

export default async function Home() {
  const lang = await getLanguage();
  const dict = await getDictionary(lang);

  const featureCards = [
    {
      icon: Zap,
      title: dict.features.universal_index.title,
      description: dict.features.universal_index.desc,
    },
    {
      icon: Wrench,
      title: dict.features.progress_analytics.title,
      description: dict.features.progress_analytics.desc,
    },
    {
      icon: Brain,
      title: dict.features.gap_analysis.title,
      description: dict.features.gap_analysis.desc,
    },
  ];

  const curriculumItems = [
    {
      number: "01",
      title: dict.features.universal_index.title,
      description: dict.features.universal_index.desc,
      tag: "Catalog",
    },
    {
      number: "02",
      title: dict.features.progress_analytics.title,
      description: dict.features.progress_analytics.desc,
      tag: "Progress",
    },
    {
      number: "03",
      title: dict.features.gap_analysis.title,
      description: dict.features.gap_analysis.desc,
      tag: "Planning",
    },
  ];

  const universities = ["MIT", "Stanford", "UC Berkeley", "CMU"] as const;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNavbar dict={dict.navbar} />

      <header id="hero" className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <Badge variant="secondary" className="mb-6">
            {dict.hero.system_status}
          </Badge>

          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            {dict.hero.title_prefix}
            <br />
            {dict.hero.title_highlight} {dict.hero.title_suffix}
          </h1>

          <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            {dict.hero.description}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/courses">
                {dict.hero.cta}
                <ArrowRight />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="#features">View Features</Link>
            </Button>
          </div>
        </div>
      </header>

      <section id="mission" className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {dict.mission.label}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {dict.mission.desc_1}
          </p>

          <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
            {featureCards.map((feature) => (
              <div key={feature.title} className="rounded-sm border p-4">
                <feature.icon className="mb-3 h-5 w-5" />
                <h3 className="text-base font-semibold">{feature.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How It Works</h2>

          <div className="mt-8 space-y-3">
            {curriculumItems.map((item) => (
              <div key={item.number} className="rounded-sm border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Step {item.number}</p>
                    <h3 className="mt-1 text-base font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Badge variant="outline">{item.tag}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="universities">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {dict.universities.label}
          </p>
          <Separator className="my-6" />
          <div className="flex flex-wrap items-center justify-center gap-8">
            {universities.map((uni) => (
              <UniversityIcon
                key={uni}
                name={uni}
                size={48}
                className="border border-border"
              />
            ))}
          </div>
        </div>
      </section>

      <LandingFooter dict={dict.footer} lang={lang} />
    </div>
  );
}
