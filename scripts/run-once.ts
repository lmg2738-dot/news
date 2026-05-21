/**
 * 배치 1회만 실행.
 * 사용: npm run batch:once
 */
import { runNewsCycle } from "../lib/runner";

runNewsCycle()
  .then((r) => {
    console.log(r.message, r);
    process.exit(r.ok ? 0 : 1);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
