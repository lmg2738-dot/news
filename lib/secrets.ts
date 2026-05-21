import { config as loadDotenv } from "dotenv";
import { join } from "path";

let envFilesLoaded = false;

/** tsx 배치 스크립트에서 .env / .env.local 로드 (Next는 자체 로드) */
export function ensureEnvFilesLoaded(): void {
  if (envFilesLoaded) return;
  envFilesLoaded = true;
  loadDotenv({ path: join(process.cwd(), ".env.local") });
  loadDotenv({ path: join(process.cwd(), ".env") });
}

export function missingEnvHint(names: string[]): string {
  const where = process.env.VERCEL
    ? "Vercel 대시보드 → Project → Settings → Environment Variables"
    : "로컬 .env.local 또는 GitHub Actions Secrets";
  return `${names.join(", ")} 를 ${where}에 설정하세요.`;
}

ensureEnvFilesLoaded();
