// OrchestKit Hooks - TypeScript/ESM Bundle
// Generated: 2026-01-23T04:17:01.201Z
// https://github.com/yonatangross/orchestkit

var L=(t=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(t,{get:(e,o)=>(typeof require<"u"?require:e)[o]}):t)(function(t){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+t+'" is not supported')});function fo(t){return typeof t.command=="string"}function go(t){return typeof t.file_path=="string"&&typeof t.content=="string"}function ho(t){return typeof t.file_path=="string"&&typeof t.old_string=="string"&&typeof t.new_string=="string"}function ko(t){return typeof t.file_path=="string"&&t.content===void 0}import{appendFileSync as A,existsSync as O,statSync as Ct,renameSync as Pt,mkdirSync as jt}from"node:fs";var Et=process.env.CLAUDE_PLUGIN_ROOT||process.env.CLAUDE_PROJECT_DIR||".",F=process.env.CLAUDE_PROJECT_DIR||".",b=process.env.CLAUDE_SESSION_ID||"unknown";function T(){return process.env.CLAUDE_PLUGIN_ROOT?`${process.env.HOME}/.claude/logs/ork`:`${F}/.claude/logs`}function m(){return F}function N(){return Et}function So(){return b}function i(){return{continue:!0,suppressOutput:!0}}function g(){return{continue:!0,suppressOutput:!0,hookSpecificOutput:{permissionDecision:"allow"}}}function bo(t){return{continue:!1,stopReason:t,hookSpecificOutput:{permissionDecision:"deny",permissionDecisionReason:t}}}function x(t){return{continue:!0,suppressOutput:!0,hookSpecificOutput:{additionalContext:t}}}function p(t,e){let o={continue:!0,hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:t,permissionDecision:"allow"}};return e?o.systemMessage=e:o.suppressOutput=!0,o}function Ro(t){return{continue:!0,systemMessage:t}}function $o(t){return{continue:!0,systemMessage:`\u26A0 ${t}`}}function d(t){return{continue:!1,stopReason:t,hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:t}}}var Dt=200*1024,Lt=100*1024;function B(t,e){if(O(t))try{if(Ct(t).size>e){let n=`${t}.old.${Date.now()}`;Pt(t,n)}}catch{}}function G(t){O(t)||jt(t,{recursive:!0})}function u(t,e){let o=T(),n=`${o}/hooks.log`;try{G(o),B(n,Dt);let r=new Date().toISOString().replace("T"," ").slice(0,19);A(n,`[${r}] [${t}] ${e}
`)}catch{}}function c(t,e,o){let n=T(),r=`${n}/permission-feedback.log`;try{G(n),B(r,Lt);let s=new Date().toISOString(),a=o?.tool_name||process.env.HOOK_TOOL_NAME||"unknown",l=o?.session_id||b;A(r,`${s} | ${t} | ${e} | tool=${a} | session=${l}
`)}catch{}}function Ho(){try{let t=[],o=Buffer.allocUnsafe(256),n,r=0,{readSync:s}=L("node:fs");for(;;)try{if(n=s(r,o,0,256,null),n===0)break;t.push(Buffer.from(o.subarray(0,n)))}catch{break}let a=Buffer.concat(t).toString("utf8").trim();return a?JSON.parse(a):{tool_name:"",session_id:b,tool_input:{}}}catch{return{tool_name:"",session_id:b,tool_input:{}}}}function _o(t,e){let o=e.replace(/^\./,"").split("."),n=t;for(let r of o){if(n==null)return;n=n[r]}return n}function R(t){return t.replace(/\\\s*[\r\n]+/g," ").replace(/\n/g," ").replace(/\s+/g," ").trim()}function wo(t){return t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}import{execSync as y}from"node:child_process";function $(t){let e=t||m();try{return y("git branch --show-current",{cwd:e,encoding:"utf8",timeout:5e3,stdio:["pipe","pipe","pipe"]}).trim()}catch{return"unknown"}}function H(t){let e=t||$();return["dev","main","master"].includes(e)}function Po(t){let e=t||m();try{return y("git rev-parse --show-toplevel",{cwd:e,encoding:"utf8",timeout:5e3,stdio:["pipe","pipe","pipe"]}).trim()}catch{return e}}function jo(t){let e=t||m();try{return y("git rev-parse --git-dir",{cwd:e,encoding:"utf8",timeout:5e3,stdio:["pipe","pipe","pipe"]}),!0}catch{return!1}}function _(t){let e=t||m();try{return y("git status --short",{cwd:e,encoding:"utf8",timeout:1e4,stdio:["pipe","pipe","pipe"]}).trim()}catch{return""}}function Eo(t){return _(t).length>0}function Do(t){let e=t||m();try{return y("git rev-parse --verify main",{cwd:e,encoding:"utf8",timeout:5e3,stdio:["pipe","pipe","pipe"]}),"main"}catch{try{return y("git rev-parse --verify master",{cwd:e,encoding:"utf8",timeout:5e3,stdio:["pipe","pipe","pipe"]}),"master"}catch{return"main"}}}function At(t){let e=[/issue\/(\d+)/i,/feature\/(\d+)/i,/fix\/(\d+)/i,/bug\/(\d+)/i,/feat\/(\d+)/i,/^(\d+)-/,/-(\d+)$/,/#(\d+)/];for(let o of e){let n=t.match(o);if(n)return parseInt(n[1],10)}return null}function W(t){if(H(t))return null;let e=["issue/","feature/","fix/","bug/","feat/","chore/","docs/","refactor/","test/","ci/","perf/","style/","release/","hotfix/"];return e.some(n=>t.startsWith(n))?t.startsWith("issue/")&&!At(t)?"issue/ branches should include an issue number (e.g., issue/123-description)":null:`Branch name should start with a valid prefix: ${e.join(", ")}`}function Oo(t){return e=>t(e)?null:i()}function w(t,...e){let o=t.tool_input.file_path;if(!o)return i();let n=o.split(".").pop()?.toLowerCase()||"";return e.map(s=>s.toLowerCase().replace(/^\./,"")).includes(n)?null:i()}function Fo(t){return w(t,"py","ts","tsx","js","jsx","go","rs","java")}function To(t){return w(t,"py")}function No(t){return w(t,"ts","tsx","js","jsx")}function Bo(t){let e=t.tool_input.file_path;return e?[/test/i,/spec/i,/__tests__/i].some(n=>n.test(e))?null:i():i()}function Go(t){let e=t.tool_input.file_path||"";return e&&[/\/\.claude\//,/\/node_modules\//,/\/\.git\//,/\/dist\//,/\/build\//,/\/__pycache__\//,/\/\.venv\//,/\/venv\//,/\.lock$/].some(n=>n.test(e))?i():null}function Wo(t,...e){let o=t.tool_input.file_path;if(!o)return i();for(let n of e)if(typeof n=="string"){if(new RegExp(n.replace(/\*/g,".*").replace(/\?/g,".")).test(o))return null}else if(n.test(o))return null;return i()}function U(t,...e){let o=t.tool_name;return o?e.includes(o)?null:i():i()}function M(t){return U(t,"Write","Edit")}function Uo(t){return U(t,"Bash")}function Mo(t){let e=t.tool_input.command||"";return[/^echo\s/,/^ls(\s|$)/,/^pwd$/,/^cat\s/,/^head\s/,/^tail\s/,/^wc\s/,/^date$/,/^whoami$/].some(n=>n.test(e))?i():null}function qo(t){return(t.tool_input.command||"").startsWith("git")?null:i()}function Vo(t){let o=`${t.project_dir||process.env.CLAUDE_PROJECT_DIR||"."}/.claude/coordination/.claude.db`;try{let{existsSync:n}=L("node:fs");if(n(o))return null}catch{}return i()}function Jo(t,...e){for(let o of e){let n=o(t);if(n!==null)return n}return null}function q(t){let e=t.tool_name;return u("auto-approve-readonly",`Auto-approving readonly: ${e}`),c("allow",`Auto-approved readonly: ${e}`,t),g()}var Ot=[/^git (status|log|diff|branch|show|fetch|pull)/,/^git checkout/,/^npm (list|ls|outdated|audit|run|test)/,/^pnpm (list|ls|outdated|audit|run|test)/,/^yarn (list|outdated|audit|run|test)/,/^poetry (show|run|env)/,/^docker (ps|images|logs|inspect)/,/^docker-compose (ps|logs)/,/^docker compose (ps|logs)/,/^ls(\s|$)/,/^pwd$/,/^echo\s/,/^cat\s/,/^head\s/,/^tail\s/,/^wc\s/,/^find\s/,/^which\s/,/^type\s/,/^env$/,/^printenv/,/^gh (issue|pr|repo|workflow) (list|view|status)/,/^gh milestone/,/^pytest/,/^poetry run pytest/,/^npm run (test|lint|typecheck|format)/,/^ruff (check|format)/,/^ty check/,/^mypy/];function V(t){let e=t.tool_input.command||"";u("auto-approve-safe-bash",`Evaluating bash command: ${e.slice(0,50)}...`);for(let o of Ot)if(o.test(e))return u("auto-approve-safe-bash",`Auto-approved: matches safe pattern ${o}`),c("allow",`Matches safe pattern: ${o}`,t),g();return u("auto-approve-safe-bash","Command requires manual approval"),i()}import{resolve as Ft,isAbsolute as Tt}from"node:path";var Nt=["node_modules",".git","dist","build","__pycache__",".venv","venv"];function J(t){let e=t.tool_input.file_path||"",o=m();if(u("auto-approve-project-writes",`Evaluating write to: ${e}`),Tt(e)||(e=Ft(o,e)),e.startsWith(o)){for(let n of Nt)if(e.includes(`/${n}/`))return u("auto-approve-project-writes",`Write to excluded directory: ${n}`),i();return u("auto-approve-project-writes","Auto-approved: within project directory"),c("allow",`In-project write: ${e}`,t),g()}return u("auto-approve-project-writes","Write outside project directory - manual approval required"),i()}import{existsSync as Bt,readFileSync as Gt}from"node:fs";import{join as Wt}from"node:path";var Ut=[/rm\s+-rf\s+[/~]/,/sudo\s/,/chmod\s+-R\s+777/,/>\s*\/dev\/sd/,/mkfs\./,/dd\s+if=/,/:.*\(\).*\{.*\|.*&.*\}/,/curl.*\|\s*sh/,/wget.*\|\s*sh/];function Mt(t){return Ut.some(e=>e.test(t))}function qt(){let t=N(),e=Wt(t,".claude","feedback","learned-patterns.json");try{if(Bt(e))return JSON.parse(Gt(e,"utf8")).autoApprovePatterns||[]}catch{}return[]}function Vt(t){let e=qt();for(let o of e)try{if(new RegExp(o).test(t))return!0}catch{}return!1}function K(t){let e=t.tool_name,o=t.tool_input.command||t.tool_input.file_path||"";if(u("learning-tracker",`Processing permission for tool: ${e}, command: ${o.slice(0,50)}...`),e==="Bash"&&o){if(Mt(o))return u("learning-tracker","Command matches security blocklist, skipping"),i();if(Vt(o))return u("learning-tracker","Command matches learned auto-approve pattern"),c("allow","Learned pattern match",t),g()}return i()}var Jt=["rm -rf /","rm -rf ~","rm -fr /","rm -fr ~","> /dev/sda","mkfs.","chmod -R 777 /","dd if=/dev/zero of=/dev/","dd if=/dev/random of=/dev/",":(){:|:&};:","mv /* /dev/null","wget.*|.*sh","curl.*|.*sh"];function z(t){let e=t.tool_input.command||"";if(!e)return i();let o=R(e);for(let n of Jt)if(o.includes(n))return u("dangerous-command-blocker",`BLOCKED: Dangerous pattern: ${n}`),c("deny",`Dangerous pattern: ${n}`,t),d(`Command matches dangerous pattern: ${n}

This command could cause severe system damage and has been blocked.`);return i()}function Y(t){let e=t.tool_input.command||"";if(!e.startsWith("git"))return i();let o=$(t.project_dir);if(H(o)){if(/git\s+commit/.test(e)||/git\s+push/.test(e)){let r=`BLOCKED: Cannot commit or push directly to '${o}' branch.

You are currently on branch: ${o}

Required workflow:
1. Create a feature branch:
   git checkout -b issue/<number>-<description>

2. Make your changes and commit:
   git add .
   git commit -m "feat(#<number>): Description"

3. Push the feature branch:
   git push -u origin issue/<number>-<description>

4. Create a pull request:
   gh pr create --base dev

Aborting command to protect ${o} branch.`;return c("deny",`Blocked ${e} on protected branch ${o}`,t),u("git-branch-protection",`BLOCKED: ${e} on ${o}`),d(r)}let n=`Branch: ${o} (PROTECTED). Direct commits blocked. Create feature branch for changes: git checkout -b issue/<number>-<desc>`;return c("allow",`Git command on protected branch: ${e}`,t),x(n)}if(/git\s+(commit|push|merge)/.test(e)){let n=`Branch: ${o}. Protected: dev, main, master. PR workflow: push to feature branch, then gh pr create --base dev`;return c("allow",`Git command allowed: ${e}`,t),x(n)}return c("allow",`Git command allowed: ${e}`,t),i()}var I=["feat","fix","refactor","docs","test","chore","style","perf","ci","build"];function Kt(t){let e=t.match(/-m\s+["']([^"']+)["']/);if(e)return e[1];let o=t.match(/-m\s+(\S+)/);return o?o[1]:null}function Q(t){let e=t.tool_input.command||"";if(!/^git\s+commit/.test(e))return i();if(/<<['"]?EOF/.test(e)){let l=`Commit via heredoc detected. Ensure format: type(#issue): description

Allowed types: ${I.join(", ")}
Example: feat(#123): Add user authentication

Commit MUST end with:
Co-Authored-By: Claude <noreply@anthropic.com>`;return c("allow","Heredoc commit - injecting format guidance",t),p(l)}let o=Kt(e);if(!o){let l=`Interactive commit detected. Use conventional format:
type(#issue): description

Types: ${I.join("|")}`;return c("allow","Interactive commit - injecting guidance",t),p(l)}let n=I.join("|"),r=new RegExp(`^(${n})(\\(#?[0-9]+\\)|(\\([a-z-]+\\)))?: .+`),s=new RegExp(`^(${n}): .+`);if(r.test(o)||s.test(o)){let l=o.split(`
`)[0],f=l.length;if(f>72){let h=`Commit message title is ${f} chars (recommended: <72).
Consider shortening: ${l.slice(0,50)}...`;return c("allow",`Valid commit but long title (${f} chars)`,t),p(h)}return c("allow",`Valid conventional commit: ${o}`,t),u("git-commit-message-validator",`Valid: ${o}`),i()}let a=`INVALID COMMIT MESSAGE FORMAT

Your message: "${o}"

Required format: type(#issue): description

Allowed types:
  feat     - New feature
  fix      - Bug fix
  refactor - Code restructuring
  docs     - Documentation only
  test     - Adding/updating tests
  chore    - Build process, deps
  style    - Formatting, whitespace
  perf     - Performance improvement
  ci       - CI/CD changes
  build    - Build system changes

Examples:
  feat(#123): Add user authentication
  fix(#456): Resolve login redirect loop
  refactor: Extract validation helpers
  docs: Update API documentation

Please update your commit message to follow conventional format.`;return c("deny",`Invalid commit format: ${o}`,t),u("git-commit-message-validator",`Invalid: ${o}`),d(a)}function Z(t){let e=t.tool_input.command||"";if(!/git\s+(checkout\s+-b|branch\s+)/.test(e))return i();let o=null,n=e.match(/checkout\s+-b\s+(\S+)/);n&&(o=n[1]);let r=e.match(/git\s+branch\s+(\S+)/);if(r&&!o&&(o=r[1]),!o)return i();let s=W(o);if(s){let a=`Branch naming: ${s}

Recommended formats:
  issue/123-description
  feature/user-auth
  fix/login-bug
  chore/update-deps

Example: git checkout -b issue/123-add-user-auth`;return c("allow",`Branch naming guidance: ${o}`,t),u("git-branch-naming-validator",`Guidance for: ${o}`),p(a)}return c("allow",`Valid branch name: ${o}`,t),i()}var zt=10;function X(t){let e=t.tool_input.command||"";if(!/^git\s+commit/.test(e))return i();let r=_(t.project_dir).split(`
`).filter(s=>s.trim().length>0).length;if(r>zt){let s=`Large commit detected: ${r} files staged.

Atomic commits are easier to review, revert, and understand.
Consider splitting into smaller, focused commits:
  - Group related changes together
  - One feature/fix per commit
  - Max 5-10 files per commit recommended

Continue if this is intentional (refactoring, deps update, etc.)`;return c("allow",`Large commit: ${r} files`,t),u("git-atomic-commit-checker",`Warning: ${r} files`),p(s)}return c("allow","Atomic commit check passed",t),i()}var Yt=["rm -rf /","rm -rf ~","rm -fr /","rm -fr ~","mkfs","dd if=/dev","> /dev/sd","chmod -R 777 /"];function Qt(t){let e=t.trim();if(!e)return!0;for(let o of Yt)if(e.includes(o))return!1;return!0}function Zt(t){if(/curl.*\|.*(sh|bash)/.test(t)||/wget.*\|.*(sh|bash)/.test(t))return"pipe-to-shell execution (curl/wget piped to sh/bash)";if(!t.includes("&&")&&!t.includes("||")&&!t.includes("|")&&!t.includes(";"))return null;let e=t.split(/&&|\|\||[|;]/);for(let o of e)if(!Qt(o))return o.trim();return null}function tt(t){let e=t.tool_input.command||"";if(!e)return i();let o=R(e),n=Zt(o);if(n){let r=`BLOCKED: Dangerous compound command detected.

Blocked segment: ${n}

The command contains a potentially destructive operation.

Please review and modify your command to remove the dangerous operation.`;return c("deny",`Dangerous compound command: ${n}`,t),u("compound-command-validator",`BLOCKED: ${n}`),d(r)}return c("allow","Compound command validated: safe",t),i()}var et=12e4;function ot(t){let e=t.tool_input.command||"",o=t.tool_input.timeout,n=t.tool_input.description;if(typeof o=="number"&&o>0)return{continue:!0,suppressOutput:!0};let r={command:e,timeout:et};return n&&typeof n=="string"&&(r.description=n),u("default-timeout-setter",`Setting default timeout: ${et}ms`),{continue:!0,suppressOutput:!0,hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"allow",updatedInput:r}}}import{existsSync as Xt,readFileSync as te}from"node:fs";import{join as ee}from"node:path";function oe(t){let e=ee(t,".claude","rules","error_rules.json");try{if(Xt(e))return JSON.parse(te(e,"utf8")).rules||[]}catch{}return[]}function ne(t,e){let o=new Set(t.toLowerCase().split(/\s+/)),n=new Set(e.toLowerCase().split(/\s+/)),r=0;for(let s of o)n.has(s)&&s.length>2&&r++;return r}function nt(t){let e=m(),o=t.tool_input.command||"";if(!o)return i();let n=oe(e);if(n.length===0)return i();let r=[];/psql.*-U\s+(postgres|orchestkit|root)/.test(o)&&n.filter(a=>a.tool==="Bash"&&a.signature?.includes("role")).length>0&&r.push("DB role error: use docker exec -it <container> psql -U orchestkit_user"),o.includes("mcp__postgres")&&n.filter(a=>a.tool?.includes("postgres-mcp")).length>0&&r.push("MCP postgres: verify connection to correct database");for(let s of n){if(!s.pattern||(s.occurrence_count||0)<5)continue;let a=s.sample_input?.command;a&&ne(o,a)>3&&(u("error-pattern-warner",`Pattern match: ${s.signature}`),s.suggested_fix?r.push(`${s.signature} (${s.occurrence_count}x): ${s.suggested_fix}`):r.push(`${s.signature} (${s.occurrence_count}x)`))}if(r.length>0){let s="Learned error patterns | "+r.join(" | ");return s.length>200&&(s=s.slice(0,197)+"..."),x(s)}return i()}import{execSync as rt}from"node:child_process";function re(t,e){try{let n=rt(`git diff --name-only ${e}...HEAD 2>/dev/null || echo ""`,{cwd:t,encoding:"utf8",timeout:1e4,stdio:["pipe","pipe","pipe"]}).trim().split(`
`).filter(Boolean),r=[];for(let s of n.slice(0,20))try{rt(`git log -1 --pretty=format:"%h" ${e} -- "${s}" 2>/dev/null || echo ""`,{cwd:t,encoding:"utf8",timeout:5e3,stdio:["pipe","pipe","pipe"]}).trim()&&r.push(s)}catch{}return r}catch{return[]}}function st(t){let e=t.tool_input.command||"",o=m();if(!/git\s+(merge|rebase|pull)/.test(e))return i();let n=null,r=e.match(/git\s+(merge|rebase)\s+(\S+)/);if(r&&(n=r[2]),e.includes("git pull")&&(n="origin/dev"),!n)return i();let s=re(o,n);if(s.length>0){let a=`Potential conflicts detected: ${s.length} file(s)
Files: ${s.slice(0,5).join(", ")}${s.length>5?"...":""}

Consider:
1. Review changes in these files before merging
2. Run: git diff ${n}...HEAD -- <file>
3. Prepare conflict resolution strategy`;return c("allow",`Conflict prediction: ${s.length} files`,t),u("conflict-predictor",`Potential conflicts: ${s.join(", ")}`),p(a)}return c("allow","No conflicts predicted",t),i()}import{execSync as se}from"node:child_process";import{existsSync as ie}from"node:fs";import{join as ce,basename as ue,dirname as ae}from"node:path";function le(t,e){let o=[],n=ue(e).replace(/\.(ts|tsx|js|jsx|py)$/,""),r=ae(e),s=[`${r}/${n}.test.ts`,`${r}/${n}.test.tsx`,`${r}/${n}.spec.ts`,`${r}/${n}.spec.tsx`,`${r}/__tests__/${n}.test.ts`,`${r}/__tests__/${n}.test.tsx`,`tests/${e.replace(/\.(ts|tsx|js|jsx)$/,".test.ts")}`,`test_${n}.py`,`tests/test_${n}.py`];for(let a of s){let l=ce(t,a);ie(l)&&o.push(a)}return o}function pe(t){try{return se('git status --short 2>/dev/null || echo ""',{cwd:t,encoding:"utf8",timeout:5e3,stdio:["pipe","pipe","pipe"]}).split(`
`).filter(o=>o.trim()).map(o=>o.slice(3).trim()).filter(o=>/\.(ts|tsx|js|jsx|py)$/.test(o))}catch{return[]}}function it(t){let e=t.tool_input.command||"",o=m();if(!/git\s+push|npm\s+run\s+test|pytest/.test(e))return i();if(/npm\s+run\s+test|pytest/.test(e))return i();let n=pe(o);if(n.length===0)return i();let r=[];for(let a of n.slice(0,10)){let l=le(o,a);r.push(...l)}let s=[...new Set(r)];if(s.length>0){let a=`Related tests for changed files:
${s.slice(0,5).join(`
`)}${s.length>5?`
...`:""}

Consider running: npm run test -- ${s[0]}`;return c("allow",`Found ${s.length} related tests`,t),u("affected-tests-finder",`Tests: ${s.join(", ")}`),p(a)}return i()}import{existsSync as v}from"node:fs";import{join as C}from"node:path";function me(t){let e=[];return v(C(t,"package.json"))&&(e.push("npm run lint"),e.push("npm run typecheck"),e.push("npm run test")),v(C(t,"pyproject.toml"))&&(e.push("ruff check ."),e.push("mypy ."),e.push("pytest")),v(C(t,"go.mod"))&&(e.push("go vet ./..."),e.push("go test ./...")),e}function ct(t){let e=t.tool_input.command||"",o=m();if(!/git\s+push/.test(e))return i();let n=me(o);if(n.length===0)return i();let r=`Pre-push CI simulation suggested:
${n.slice(0,3).join(`
`)}

Run these locally to catch issues before CI fails.
Or: git push --no-verify to skip (not recommended)`;return c("allow","CI simulation suggested",t),u("ci-simulation",`Suggested checks: ${n.join(", ")}`),p(r)}import{existsSync as P}from"node:fs";import{join as j}from"node:path";function de(t){return P(j(t,".pre-commit-config.yaml"))||P(j(t,".pre-commit-config.yml"))}function fe(t){return P(j(t,".husky"))}function ut(t){let e=t.tool_input.command||"",o=m();if(!/git\s+commit/.test(e))return i();if(/--no-verify/.test(e)){let n=`WARNING: --no-verify will skip pre-commit hooks.
Consider removing it unless intentional.
Skipped checks may cause CI failures.`;return c("allow","Skip pre-commit detected",t),u("pre-commit-simulation","--no-verify used"),p(n)}if(de(o)){let n=`Pre-commit hooks will run: .pre-commit-config.yaml
If hooks fail, fix issues and retry.
Run manually: pre-commit run --all-files`;return c("allow","pre-commit config found",t),p(n)}if(fe(o)){let n=`Husky hooks will run: .husky/
If hooks fail, fix issues and retry.`;return c("allow","husky config found",t),p(n)}return i()}import{execSync as ge}from"node:child_process";function he(t,e){try{let o=e?`${e}`:"",n=ge(`gh pr view ${o} --json number,state,mergeable,statusCheckRollup,reviewDecision 2>/dev/null`,{cwd:t,encoding:"utf8",timeout:1e4,stdio:["pipe","pipe","pipe"]});return JSON.parse(n)}catch{return null}}function at(t){let e=t.tool_input.command||"",o=m();if(!/gh\s+pr\s+merge/.test(e))return i();let n=e.match(/gh\s+pr\s+merge\s+(\d+)/),r=n?parseInt(n[1],10):void 0,s=he(o,r);if(!s){let l=`Could not fetch PR status. Ensure:
1. gh CLI is installed and authenticated
2. You're in a git repository
3. PR exists and is accessible`;return c("allow","PR status unavailable",t),p(l)}let a=[];if(s.state!=="OPEN"&&a.push(`PR state: ${s.state} (expected OPEN)`),s.mergeable||a.push("PR has merge conflicts"),s.statusCheckRollup!=="SUCCESS"&&s.statusCheckRollup!=="PENDING"&&a.push(`Status checks: ${s.statusCheckRollup}`),s.reviewDecision==="CHANGES_REQUESTED"&&a.push("Changes requested by reviewer"),a.length>0){let l=`PR #${s.number} has issues:
${a.join(`
`)}

Resolve these before merging.`;return c("allow",`PR issues: ${a.join(", ")}`,t),u("pr-merge-gate",`PR #${s.number} has ${a.length} issues`),p(l)}return c("allow",`PR #${s.number} ready to merge`,t),i()}import{execSync as ke}from"node:child_process";function ye(t,e){try{let o=e?`--since="${e}"`:"--max-count=20";return ke(`git log ${o} --pretty=format:"%s" 2>/dev/null || echo ""`,{cwd:t,encoding:"utf8",timeout:1e4,stdio:["pipe","pipe","pipe"]}).split(`
`).filter(Boolean)}catch{return[]}}function xe(t){let e={feat:[],fix:[],refactor:[],docs:[],test:[],chore:[],other:[]};for(let o of t){let n=o.match(/^(feat|fix|refactor|docs|test|chore|perf|ci|build)/);if(n){let r=n[1]==="perf"||n[1]==="ci"||n[1]==="build"?"chore":n[1];e[r].push(o)}else e.other.push(o)}return e}function lt(t){let e=t.tool_input.command||"",o=m();if(!/npm\s+version|poetry\s+version|changelog/.test(e))return i();let n=ye(o);if(n.length===0)return i();let r=xe(n),s=[];if(r.feat.length>0&&s.push(`### Features
${r.feat.slice(0,5).map(l=>`- ${l}`).join(`
`)}`),r.fix.length>0&&s.push(`### Bug Fixes
${r.fix.slice(0,5).map(l=>`- ${l}`).join(`
`)}`),r.refactor.length>0||r.chore.length>0){let l=[...r.refactor,...r.chore];s.push(`### Maintenance
${l.slice(0,3).map(f=>`- ${f}`).join(`
`)}`)}if(s.length===0)return i();let a=`Suggested changelog entries:

${s.join(`

`)}

Update CHANGELOG.md before releasing.`;return c("allow","Changelog suggestions generated",t),u("changelog-generator",`Generated ${s.length} sections`),p(a)}import{existsSync as pt,readFileSync as mt}from"node:fs";import{join as dt}from"node:path";function Se(t){let e=dt(t,"package.json");try{if(pt(e))return JSON.parse(mt(e,"utf8")).version||null}catch{}return null}function be(t){let e=dt(t,"pyproject.toml");try{if(pt(e)){let n=mt(e,"utf8").match(/version\s*=\s*["']([^"']+)["']/);return n?n[1]:null}}catch{}return null}function Re(t){let e=[],o=Se(t);o&&e.push({file:"package.json",version:o});let n=be(t);return n&&e.push({file:"pyproject.toml",version:n}),e}function ft(t){let e=t.tool_input.command||"",o=m();if(!/npm\s+version|poetry\s+version/.test(e))return i();let n=Re(o);if(n.length<2)return i();let r=n.map(a=>a.version),s=[...new Set(r)];if(s.length>1){let a=`Version mismatch detected:
${n.map(l=>`${l.file}: ${l.version}`).join(`
`)}

Consider syncing versions across all files.`;return c("allow","Version mismatch detected",t),u("version-sync",`Versions: ${r.join(", ")}`),p(a)}return c("allow",`Versions in sync: ${s[0]}`,t),i()}import{existsSync as $e,readFileSync as He}from"node:fs";import{join as _e}from"node:path";var we=["GPL","AGPL","LGPL","CC-BY-NC","SSPL"];function Ie(t){let e=[],o=_e(t,"package-lock.json");try{if($e(o)){let n=He(o,"utf8");for(let r of we)n.includes(`"license": "${r}`)&&e.push(`Found ${r} license in npm dependencies`)}}catch{}return e}function gt(t){let e=t.tool_input.command||"",o=m();if(!/npm\s+install|yarn\s+add|pip\s+install|poetry\s+add/.test(e))return i();if(/npm\s+ci|npm\s+install\s*$/.test(e))return i();let n=e.match(/(?:npm\s+install|yarn\s+add|pip\s+install|poetry\s+add)\s+(\S+)/),r=n?n[1]:null;if(!r)return i();let s=Ie(o);if(s.length>0){let l=`License compliance check:
${s.join(`
`)}

New dependency: ${r}
Consider checking its license before adding.

Use: npm view ${r} license`;return c("allow","License compliance warning",t),u("license-compliance",`Checking: ${r}`),p(l)}let a=`Installing: ${r}
Verify license compatibility before production use.
Check: npm view ${r} license`;return c("allow",`Installing package: ${r}`,t),p(a)}var ht={bug:`## Description
<!-- Clear description of the bug -->

## Steps to Reproduce
1.
2.
3.

## Expected Behavior
<!-- What should happen -->

## Actual Behavior
<!-- What actually happens -->

## Environment
- OS:
- Version:`,feature:`## Description
<!-- Clear description of the feature -->

## Motivation
<!-- Why is this feature needed? -->

## Proposed Solution
<!-- How should this be implemented? -->

## Alternatives Considered
<!-- Other approaches considered -->`,chore:`## Description
<!-- What maintenance task needs to be done? -->

## Impact
<!-- What does this affect? -->

## Checklist
- [ ] Task 1
- [ ] Task 2`};function ve(t){return/--label.*bug|bug\s+report/i.test(t)?"bug":/--label.*feature|feature\s+request/i.test(t)?"feature":/--label.*chore|maintenance/i.test(t)?"chore":null}function kt(t){let e=t.tool_input.command||"";if(!/gh\s+issue\s+create/.test(e))return i();if(/--body|--body-file|-b\s/.test(e))return i();let o=ve(e);if(o&&ht[o]){let r=`Issue type detected: ${o}

Suggested template:
${ht[o].slice(0,200)}...

Add --body with template or use --web for interactive creation.`;return c("allow",`Issue creation: ${o}`,t),u("gh-issue-creation-guide",`Type: ${o}`),p(r)}let n=`Creating GitHub issue. Consider:
- Clear, descriptive title
- Add appropriate labels (bug, feature, chore)
- Include reproduction steps for bugs
- Reference related issues/PRs

Use --web for interactive creation with templates.`;return c("allow","Issue creation guidance",t),p(n)}var Ce=`Documentation checklist for features:
- [ ] Update README.md if public API changes
- [ ] Add/update JSDoc or docstrings
- [ ] Update CHANGELOG.md
- [ ] Add usage examples
- [ ] Update API documentation`;function yt(t){let e=t.tool_input.command||"";if(!/gh\s+(issue\s+close|pr\s+merge)/.test(e))return i();if(!(/--label.*feat/i.test(e)||/feat|feature/.test(e)))return i();let n=`Feature completion detected. Ensure documentation is updated.

${Ce}

Skip with --no-edit if docs are already complete.`;return c("allow","Feature docs reminder",t),u("issue-docs-requirement","Feature completion - docs reminder"),p(n)}import{existsSync as xt,readFileSync as Pe}from"node:fs";import{join as St}from"node:path";function je(t){let e=St(t,".claude","coordination",".claude.db");return xt(e)}function Ee(t){let e=St(t,".claude","coordination","work-registry.json");try{if(xt(e))return JSON.parse(Pe(e,"utf8")).qualityGates||{}}catch{}return{}}function bt(t){let e=t.tool_input.command||"",o=m();if(!/gh\s+pr\s+merge|git\s+merge|deploy/.test(e))return i();if(!je(o))return i();let n=Ee(o),s=["tests","lint","typecheck"].filter(a=>!n[a]);if(s.length>0){let a=`Multi-instance quality gate check:
Failed/missing gates: ${s.join(", ")}

Run these checks before merging:
${s.map(l=>`- npm run ${l}`).join(`
`)}

Quality gates ensure consistency across instances.`;return c("allow",`Quality gates failed: ${s.join(", ")}`,t),u("multi-instance-quality-gate",`Failed: ${s.join(", ")}`),p(a)}return c("allow","All quality gates passed",t),i()}var De=[/localhost.*admin/i,/127\.0\.0\.1.*admin/i,/internal\./i,/intranet\./i,/\.local\//i,/file:\/\//i],Le=["click.*delete","click.*remove","fill.*password","fill.*credit","submit.*payment"];function Ae(t){let e=t.match(/(?:navigate|goto|open)\s+["']?([^"'\s]+)["']?/i);return e?e[1]:null}function Oe(t){return De.some(e=>e.test(t))}function Fe(t){return Le.some(e=>new RegExp(e,"i").test(t))}function Rt(t){let e=t.tool_input.command||"";if(!/agent-browser|ab\s/.test(e))return i();let o=Ae(e);if(o&&Oe(o))return c("deny",`Blocked URL: ${o}`,t),u("agent-browser-safety",`BLOCKED: ${o}`),d(`agent-browser blocked: URL matches blocked pattern.

URL: ${o}

Blocked patterns include internal, localhost admin, and file:// URLs.
If this is intentional, use direct browser access instead.`);if(Fe(e)){let n=`Sensitive browser action detected:
${e.slice(0,100)}...

This may interact with:
- Delete/remove buttons
- Password fields
- Payment forms

Proceed with caution. Verify target elements.`;return c("allow","Sensitive action warning",t),u("agent-browser-safety","Sensitive action detected"),p(n)}return c("allow","agent-browser command validated",t),i()}import{realpathSync as Te,existsSync as Ne}from"node:fs";import{resolve as Be,isAbsolute as Ge}from"node:path";var We=[/\.env$/,/\.env\.local$/,/\.env\.production$/,/credentials\.json$/,/secrets\.json$/,/private\.key$/,/\.pem$/,/id_rsa$/,/id_ed25519$/],Ue=[/package\.json$/,/pyproject\.toml$/,/tsconfig\.json$/];function Me(t,e){try{let o=Ge(t)?t:Be(e,t);return Ne(o)?Te(o):o}catch{return t}}function qe(t){for(let e of We)if(e.test(t))return e;return null}function Ve(t){return Ue.some(e=>e.test(t))}function $t(t){let e=t.tool_input.file_path||"",o=m();if(!e)return i();u("file-guard",`File write/edit: ${e}`);let n=Me(e,o);u("file-guard",`Resolved path: ${n}`);let r=qe(n);return r?(c("deny",`Protected file blocked: ${e} (pattern: ${r})`,t),u("file-guard",`BLOCKED: ${e} matches ${r}`),d(`Cannot modify protected file: ${e}

Resolved path: ${n}
Matched pattern: ${r}

Protected files include:
- Environment files (.env, .env.local, .env.production)
- Credential files (credentials.json, secrets.json)
- Private keys (.pem, id_rsa, id_ed25519)

If you need to modify this file, do it manually outside Claude Code.`)):(Ve(n)&&(u("file-guard",`WARNING: Config file modification: ${n}`),c("warn",`Config file modification: ${e}`,t)),c("allow",`File write allowed: ${e}`,t),i())}import{existsSync as Ht,readFileSync as Je}from"node:fs";import{join as _t}from"node:path";function Ke(t){return _t(t,".claude","coordination","locks.json")}function ze(t){return Ht(_t(t,".claude","coordination"))}function Ye(){return process.env.CLAUDE_SESSION_ID||`instance-${process.pid}`}function Qe(t,e){let o=Ke(t),n=Ye();try{if(!Ht(o))return null;let s=JSON.parse(Je(o,"utf8")).locks||[],a=new Date().toISOString();return s.find(f=>f.file_path===e&&f.instance_id!==n&&f.expires_at>a)||null}catch{return null}}function wt(t){let e=t.tool_input.file_path||"",o=m(),n=t.tool_name;if(!e)return i();if(!ze(o))return i();if(e.includes(".claude/coordination"))return i();let r=e.startsWith(o)?e.slice(o.length+1):e,s=Qe(o,r);return s?(c("deny",`File ${e} locked by ${s.instance_id}`,t),u("file-lock-check",`BLOCKED: ${e} locked by ${s.instance_id}`),d(`File ${e} is locked by instance ${s.instance_id}.

Lock acquired at: ${s.acquired_at}
Expires at: ${s.expires_at}

You may want to wait or check the work registry:
.claude/coordination/work-registry.json`)):(c("allow",`Lock check passed for ${e}`,t),u("file-lock-check",`Lock check passed: ${e} (${n})`),i())}import{existsSync as D,readFileSync as Ze,writeFileSync as Xe,mkdirSync as to}from"node:fs";import{join as E,dirname as eo}from"node:path";function oo(t){return E(t,".claude","coordination","locks.json")}function no(){return`lock-${Date.now()}-${Math.random().toString(36).slice(2,10)}`}function ro(){return process.env.CLAUDE_SESSION_ID||`instance-${process.pid}`}function so(){return new Date(Date.now()+6e4).toISOString()}function io(t){try{if(D(t))return JSON.parse(Ze(t,"utf8"))}catch{}return{locks:[]}}function co(t,e){let o=eo(t);D(o)||to(o,{recursive:!0}),Xe(t,JSON.stringify(e,null,2))}function uo(t,e,o){let n=new Date().toISOString();return t.find(r=>r.file_path===e&&r.instance_id!==o&&r.expires_at>n)||null}function ao(t,e,o){let n=new Date().toISOString();return t.find(r=>r.lock_type==="directory"&&e.startsWith(r.file_path)&&r.instance_id!==o&&r.expires_at>n)||null}function lo(t,e,o,n){t.locks=t.locks.filter(s=>!(s.file_path===e&&s.instance_id===o));let r=new Date().toISOString();t.locks=t.locks.filter(s=>s.expires_at>r),t.locks.push({lock_id:no(),file_path:e,lock_type:"exclusive_write",instance_id:o,acquired_at:r,expires_at:so(),reason:n})}function It(t){let e=M(t);if(e)return e;let o=t.tool_input.file_path||"",n=m(),r=t.tool_name;if(!o)return i();let s=oo(n),a=E(n,".instance");if(!D(E(a,"id.json")))return u("multi-instance-lock","No instance identity, passing through"),i();let l=o.startsWith(n)?o.slice(n.length+1):o,f=ro(),h=io(s),k=ao(h.locks,l,f);if(k)return c("deny",`Directory ${k.file_path} locked by ${k.instance_id}`,t),u("multi-instance-lock",`BLOCKED: Directory lock by ${k.instance_id}`),d(`Directory ${k.file_path} is locked by another Claude instance (${k.instance_id}).
Wait for lock release.`);let S=uo(h.locks,l,f);return S?(c("deny",`File ${l} locked by ${S.instance_id}`,t),u("multi-instance-lock",`BLOCKED: ${l} locked by ${S.instance_id}`),d(`File ${l} is locked by another Claude instance (${S.instance_id}).
Wait for lock release.`)):(lo(h,l,f,`Modifying via ${r}`),co(s,h),u("multi-instance-lock",`Lock acquired: ${l}`),c("allow",`Lock acquired for ${l}`,t),i())}var vt={"permission/auto-approve-readonly":q,"permission/auto-approve-safe-bash":V,"permission/auto-approve-project-writes":J,"permission/learning-tracker":K,"pretool/bash/dangerous-command-blocker":z,"pretool/bash/git-branch-protection":Y,"pretool/bash/git-commit-message-validator":Q,"pretool/bash/git-branch-naming-validator":Z,"pretool/bash/git-atomic-commit-checker":X,"pretool/bash/compound-command-validator":tt,"pretool/bash/default-timeout-setter":ot,"pretool/bash/error-pattern-warner":nt,"pretool/bash/conflict-predictor":st,"pretool/bash/affected-tests-finder":it,"pretool/bash/ci-simulation":ct,"pretool/bash/pre-commit-simulation":ut,"pretool/bash/pr-merge-gate":at,"pretool/bash/changelog-generator":lt,"pretool/bash/version-sync":ft,"pretool/bash/license-compliance":gt,"pretool/bash/gh-issue-creation-guide":kt,"pretool/bash/issue-docs-requirement":yt,"pretool/bash/multi-instance-quality-gate":bt,"pretool/bash/agent-browser-safety":Rt,"pretool/write-edit/file-guard":$t,"pretool/write-edit/file-lock-check":wt,"pretool/write-edit/multi-instance-lock":It};function po(t){return vt[t]}function es(){return Object.keys(vt)}async function os(t,e){let o=po(t);return o?o(e):{continue:!0,suppressOutput:!0}}export{Oo as createGuard,wo as escapeRegex,At as extractIssueNumber,$ as getCurrentBranch,Do as getDefaultBranch,_o as getField,_ as getGitStatus,po as getHook,T as getLogDir,N as getPluginRoot,m as getProjectDir,Po as getRepoRoot,So as getSessionId,Uo as guardBash,Fo as guardCodeFiles,w as guardFileExtension,qo as guardGitCommand,Vo as guardMultiInstance,Mo as guardNontrivialBash,Wo as guardPathPattern,To as guardPythonFiles,Go as guardSkipInternal,Bo as guardTestFiles,U as guardTool,No as guardTypescriptFiles,M as guardWriteEdit,Eo as hasUncommittedChanges,vt as hooks,fo as isBashInput,ho as isEditInput,jo as isGitRepo,H as isProtectedBranch,ko as isReadInput,go as isWriteInput,es as listHooks,u as logHook,c as logPermissionFeedback,R as normalizeCommand,p as outputAllowWithContext,bo as outputBlock,d as outputDeny,Ro as outputError,g as outputSilentAllow,i as outputSilentSuccess,$o as outputWarning,x as outputWithContext,Ho as readHookInput,Jo as runGuards,os as runHook,W as validateBranchName};
//# sourceMappingURL=hooks.mjs.map
