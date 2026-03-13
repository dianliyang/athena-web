import React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const signInWithOAuth = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createBrowserSupabaseClient: () => ({
    auth: {
      signInWithOAuth,
    },
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("SecurityIdentitySection GitHub profile", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    cleanup();
  });

  test("renders a connect CTA when GitHub is not connected", async () => {
    const { default: SecurityIdentitySection } = await import("@/components/identity/SecurityIdentitySection");

    render(<SecurityIdentitySection view="identity" provider="email" githubProfile={null} />);

    expect(screen.getByText("GitHub Profile")).toBeDefined();
    expect(screen.getByRole("button", { name: "Connect GitHub" })).toBeDefined();
  });

  test("renders the synced GitHub profile details when connected", async () => {
    const { default: SecurityIdentitySection } = await import("@/components/identity/SecurityIdentitySection");

    render(
      <SecurityIdentitySection
        view="identity"
        provider="email"
        githubProfile={{
          provider: "github",
          login: "octocat",
          name: "The Octocat",
          profile_url: "https://github.com/octocat",
          avatar_url: "https://avatars.githubusercontent.com/u/42?v=4",
          bio: "Mascot",
          company: "@github",
          updated_at: "2026-03-11T14:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText("octocat")).toBeDefined();
    expect(screen.getByText("The Octocat")).toBeDefined();
    expect(screen.getByText("Mascot")).toBeDefined();
    expect(screen.getByText("@github")).toBeDefined();
    expect(screen.getByRole("link", { name: "View GitHub Profile" }).getAttribute("href")).toBe(
      "https://github.com/octocat",
    );
  });

  test("starts GitHub OAuth from the connect CTA", async () => {
    const { default: SecurityIdentitySection } = await import("@/components/identity/SecurityIdentitySection");

    render(<SecurityIdentitySection view="identity" provider="email" githubProfile={null} />);

    fireEvent.click(screen.getByRole("button", { name: "Connect GitHub" }));

    await waitFor(() => {
      expect(signInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: "github",
          options: expect.objectContaining({
            redirectTo: "http://localhost:3000/auth/callback?next=/identity",
          }),
        }),
      );
    });
  });
});
