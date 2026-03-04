"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Dictionary } from "@/lib/dictionary";
import { Send, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LoginFormProps {
  onMagicLink: (formData: FormData) => Promise<{ success?: boolean; error?: string } | void>;
  sent?: boolean;
  dict: Dictionary["dashboard"]["login"];
}

export default function LoginForm({ onMagicLink, sent: initialSent, dict }: LoginFormProps) {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(initialSent || false);
  const [serverError, setServerError] = useState<string | null>(null);

  const error = serverError || urlError;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setServerError(null);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await onMagicLink(formData);
      if (result && result.success) {
        setIsSent(true);
      } else if (result && result.error) {
        setServerError(result.error);
      }
    } catch (e) {
      console.error("Login submission error:", e);
      setServerError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  if (isSent) {
    return (
      <div className="w-full space-y-6">
        <div className="rounded-sm border p-5">
          <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-sm border">
            <Send className="h-4 w-4" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {dict?.success_title || "Check your email"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {dict?.success_desc ||
              "We've sent a magic link to your inbox. Please click the link to sign in."}
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            {dict?.spam_notice || "If you don't see the email, please check your spam folder."}
          </p>
        </div>

        <Button variant="outline" onClick={() => setIsSent(false)}>
          <ArrowLeft />
          {dict?.wrong_email || "Use a different email"}
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8 text-center lg:text-left">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {dict?.title || "Sign In"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {dict?.subtitle || "Connect to the Athena node"}
        </p>
      </div>

      {error ? (
        <div className="mb-5 flex items-start gap-2 rounded-sm border border-destructive/30 bg-destructive/5 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
          <div>
            <p className="text-sm font-semibold text-destructive">
              {dict?.error_title || "Authentication Failure"}
            </p>
            <p className="text-xs text-destructive/90">
              {error === "OAuthAccountNotLinked"
                ? dict?.error_oauth || "This email is linked to another provider."
                : error === "AccessDenied"
                  ? dict?.error_denied || "Access denied. Your account may be restricted."
                  : error === "Configuration"
                    ? dict?.error_config || "System configuration error."
                    : error === "Verification"
                      ? dict?.error_verification || "The sign-in link is no longer valid."
                      : `${dict?.error_default || "Error"}: ${error}.`}
            </p>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-muted-foreground">
            {dict?.email_label || "Email Address"}
          </label>
          <Input
            type="email"
            name="email"
            placeholder="name@example.com"
            defaultValue={searchParams.get("email") || ""}
            required
          />
        </div>

        <Button variant="outline" type="submit" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : null}
          {loading ? dict?.submit_loading || "Sending..." : dict?.submit_send || "Send Magic Link"}
        </Button>
      </form>

      <p className="mt-8 text-center text-xs text-muted-foreground lg:text-left">
        {dict?.footer || "Secure access via Supabase Auth"}
      </p>
    </div>
  );
}
