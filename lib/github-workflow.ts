import { getGitHubRepository, getGitHubToken } from "./github-token";

const WORKFLOW_FILE = "news-batch.yml";
const DISPATCH_EVENT = "run-news-batch";
const BRANCH = process.env.STATE_BRANCH ?? "main";

function githubHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

async function triggerWorkflowDispatch(
  token: string,
  repo: string
): Promise<{ ok: boolean; status: number; detail: string }> {
  const url = `https://api.github.com/repos/${repo}/actions/workflows/${WORKFLOW_FILE}/dispatches`;
  const res = await fetch(url, {
    method: "POST",
    headers: githubHeaders(token),
    body: JSON.stringify({ ref: BRANCH }),
  });
  const detail = res.ok ? "workflow_dispatch" : (await res.text()).slice(0, 200);
  return { ok: res.ok, status: res.status, detail };
}

async function triggerRepositoryDispatch(
  token: string,
  repo: string
): Promise<{ ok: boolean; status: number; detail: string }> {
  const url = `https://api.github.com/repos/${repo}/dispatches`;
  const res = await fetch(url, {
    method: "POST",
    headers: githubHeaders(token),
    body: JSON.stringify({ event_type: DISPATCH_EVENT }),
  });
  const detail = res.ok ? "repository_dispatch" : (await res.text()).slice(0, 200);
  return { ok: res.ok, status: res.status, detail };
}

/** Vercel 등에서 PAT Contents 쓰기 없이 배치 실행 */
export async function triggerNewsBatchWorkflow(): Promise<{
  ok: boolean;
  detail: string;
}> {
  const token = getGitHubToken();
  const repo = getGitHubRepository();
  if (!token) {
    return { ok: false, detail: "GitHub 토큰 없음" };
  }

  const wf = await triggerWorkflowDispatch(token, repo);
  if (wf.ok) return { ok: true, detail: wf.detail };

  const rd = await triggerRepositoryDispatch(token, repo);
  if (rd.ok) return { ok: true, detail: rd.detail };

  return {
    ok: false,
    detail: `workflow(${wf.status}): ${wf.detail} | repo_dispatch(${rd.status}): ${rd.detail}`,
  };
}

export function patPermissionHint(status: number): string {
  if (status !== 403) return "";
  return (
    " PAT 권한: 저장소 news, Actions Read and write. " +
    "또는 GitHub Actions에서 'CJ News Batch' 수동 실행."
  );
}
