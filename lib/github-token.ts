import { ensureEnvFilesLoaded } from "./secrets";

export function getGitHubToken(): string | undefined {
  ensureEnvFilesLoaded();
  if (process.env.GITHUB_ACTIONS === "true") {
    return process.env.GITHUB_TOKEN?.trim();
  }
  return process.env.GITHUB_TOKEN?.trim() || undefined;
}

export function getGitHubRepository(): string {
  return process.env.GITHUB_REPOSITORY?.trim() || "lmg2738-dot/news";
}
