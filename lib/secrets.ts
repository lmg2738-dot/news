import { config as loadDotenv } from "dotenv";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

let envFilesLoaded = false;

/** tsx 배치 스크립트에서 .env / .env.local 로드 (Next는 자체 로드) */
export function ensureEnvFilesLoaded(): void {
  if (envFilesLoaded) return;
  envFilesLoaded = true;
  loadDotenv({ path: join(process.cwd(), ".env.local") });
  loadDotenv({ path: join(process.cwd(), ".env") });
}

/** Vercel·프로덕션 빌드에서는 config.json 비밀값 미사용 */
export function isConfigJsonAllowed(): boolean {
  if (process.env.VERCEL) return false;
  if (process.env.CI === "true" && process.env.GITHUB_ACTIONS === "true") {
    return false;
  }
  return true;
}

type LocalConfig = {
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  github_token?: string;
  github_token_b64?: string;
  github_token_codes?: number[];
  upstash_redis_rest_url?: string;
  upstash_redis_rest_token?: string;
};

export function readLocalConfigJson(): LocalConfig {
  if (!isConfigJsonAllowed()) return {};
  const path = join(process.cwd(), "config.json");
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as LocalConfig;
  } catch {
    return {};
  }
}

export function githubTokenFromLocal(file: LocalConfig): string | undefined {
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

export function missingEnvHint(names: string[]): string {
  const where = process.env.VERCEL
    ? "Vercel 대시보드 → Project → Settings → Environment Variables"
    : "로컬 .env.local 또는 GitHub Actions Secrets";
  return `${names.join(", ")} 를 ${where}에 설정하세요. (config.json은 Git에 넣지 마세요)`;
}

ensureEnvFilesLoaded();
