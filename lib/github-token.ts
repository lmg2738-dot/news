import { existsSync, readFileSync } from "fs";
import { join } from "path";

type FileConfig = {
  github_token?: string;
};

function loadFileConfig(): FileConfig {
  const path = join(process.cwd(), "config.json");
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as FileConfig;
  } catch {
    return {};
  }
}

export function getGitHubToken(): string | undefined {
  return (
    process.env.GITHUB_TOKEN?.trim() ||
    loadFileConfig().github_token?.trim() ||
    undefined
  );
}

export function getGitHubRepository(): string {
  return (
    process.env.GITHUB_REPOSITORY?.trim() || "lmg2738-dot/news"
  );
}
