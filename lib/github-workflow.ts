import { getGitHubRepository, getGitHubToken } from "./github-token";

const WORKFLOW_FILE = "news-batch.yml";
const BRANCH = process.env.STATE_BRANCH ?? "main";

function githubHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

/** PAT에 Contents 쓰기 권한이 없을 때 Actions 배치 실행 */
export async function triggerNewsBatchWorkflow(): Promise<boolean> {
  const token = getGitHubToken();
  const repo = getGitHubRepository();
  if (!token) return false;

  const url = `https://api.github.com/repos/${repo}/actions/workflows/${WORKFLOW_FILE}/dispatches`;
  const res = await fetch(url, {
    method: "POST",
    headers: githubHeaders(token),
    body: JSON.stringify({ ref: BRANCH }),
  });

  return res.ok;
}

export function patPermissionHint(status: number): string {
  if (status !== 403) return "";
  return (
    " Fine-grained PAT 설정: 저장소 lmg2738-dot/news 선택, " +
    "Contents·Actions 권한 Read and write, 조직 SSO 사용 시 토큰 승인 필요."
  );
}
