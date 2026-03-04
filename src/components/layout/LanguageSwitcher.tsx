"use client";

import { useTransition } from "react";
import { setLanguage } from "@/actions/language";
import { Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export default function LanguageSwitcher({ currentLang }: {currentLang: Locale;}) {
  const [isPending, startTransition] = useTransition();

  const handleLanguageChange = (lang: Locale) => {
    startTransition(() => {
      setLanguage(lang);
    });
  };

  return (
    <div className="inline-flex items-center rounded-full border p-0.5">
      <Button
        variant={currentLang === "en" ? "secondary" : "ghost"}
        onClick={() => handleLanguageChange("en")}
        disabled={isPending || currentLang === "en"}
        aria-pressed={currentLang === "en"}
      >
        English
      </Button>
      <Button
        variant={currentLang === "zh" ? "secondary" : "ghost"}
        onClick={() => handleLanguageChange("zh")}
        disabled={isPending || currentLang === "zh"}
        aria-pressed={currentLang === "zh"}
      >
        中文
      </Button>
    </div>
  );

}
