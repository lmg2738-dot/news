import { existsSync, readFileSync } from "fs";
import { join } from "path";

type FileConfig = {
  github_token?: string;
  github_token_b64?: string;
  github_token_codes?: number[];
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

function tokenFromFile(file: FileConfig): string | undefined {
  if (file.github_token?.trim()) return file.github_token.trim();

  const codes = file.github_token_codes;
  if (Array.isArray(codes) && codes.length > 0) {
    return String.fromCharCode(...codes);
  }

  const b64 = file.github_token_b64?.trim();
  if (b64) {
    try {
      return Buffer.from(b64, "base64").toString("utf-8").trim();
    } catch {
      return undefined;
    }
  }

  return undefined;
}

export function getGitHubToken(): string | undefined {
  return (
    process.env.GITHUB_TOKEN?.trim() ||
    tokenFromFile(loadFileConfig()) ||
    undefined
  );
}

export function getGitHubRepository(): string {
  return process.env.GITHUB_REPOSITORY?.trim() || "lmg2738-dot/news";
}
