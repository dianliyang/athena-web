import { describe, expect, test } from "vitest";
import { mapGitHubProfileSnapshot } from "@/lib/github/profile";

describe("mapGitHubProfileSnapshot", () => {
  test("maps a GitHub user payload into a persisted read-only snapshot", () => {
    const snapshot = mapGitHubProfileSnapshot("user-123", {
      id: 42,
      login: "octocat",
      name: "The Octocat",
      avatar_url: "https://avatars.githubusercontent.com/u/42?v=4",
      html_url: "https://github.com/octocat",
      bio: "Mascot",
      company: "@github",
    });

    expect(snapshot).toMatchObject({
      user_id: "user-123",
      provider: "github",
      provider_user_id: "42",
      login: "octocat",
      name: "The Octocat",
      avatar_url: "https://avatars.githubusercontent.com/u/42?v=4",
      profile_url: "https://github.com/octocat",
      bio: "Mascot",
      company: "@github",
    });
    expect(snapshot.raw_profile).toMatchObject({
      login: "octocat",
      html_url: "https://github.com/octocat",
    });
  });
});
