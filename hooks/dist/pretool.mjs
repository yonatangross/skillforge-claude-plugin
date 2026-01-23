// OrchestKit Hooks - pretool bundle
// Generated: 2026-01-23T16:38:20.859Z

var G=(t=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(t,{get:(e,o)=>(typeof require<"u"?require:e)[o]}):t)(function(t){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+t+'" is not supported')});function In(t){return typeof t.command=="string"}function Cn(t){return typeof t.file_path=="string"&&typeof t.content=="string"}function vn(t){return typeof t.file_path=="string"&&typeof t.old_string=="string"&&typeof t.new_string=="string"}function Pn(t){return typeof t.file_path=="string"&&t.content===void 0}import{appendFileSync as M,existsSync as W,statSync as Jt,renameSync as Zt,mkdirSync as Qt}from"node:fs";var Yt=process.env.CLAUDE_PLUGIN_ROOT||process.env.CLAUDE_PROJECT_DIR||".",B=process.env.CLAUDE_PROJECT_DIR||".";function y(){return process.env.CLAUDE_PLUGIN_ROOT?`${process.env.HOME}/.claude/logs/ork`:`${B}/.claude/logs`}function m(){return B}function En(){return Yt}function w(){return process.env.CLAUDE_SESSION_ID}function s(){return{continue:!0,suppressOutput:!0}}function Tn(){return{continue:!0,suppressOutput:!0,hookSpecificOutput:{permissionDecision:"allow"}}}function An(t){return{continue:!1,stopReason:t,hookSpecificOutput:{permissionDecision:"deny",permissionDecisionReason:t}}}function f(t){return{continue:!0,suppressOutput:!0,hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:t}}}function Ln(t){return{continue:!0,suppressOutput:!0,hookSpecificOutput:{hookEventName:"UserPromptSubmit",additionalContext:t}}}function d(t,e){let o={continue:!0,hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:t,permissionDecision:"allow"}};return e?o.systemMessage=e:o.suppressOutput=!0,o}function On(t){return{continue:!0,systemMessage:t}}function H(t){return{continue:!0,systemMessage:`\u26A0 ${t}`}}function g(t){return{continue:!1,stopReason:t,hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:t}}}var Xt=200*1024,te=100*1024;function U(t,e){if(W(t))try{if(Jt(t).size>e){let n=`${t}.old.${Date.now()}`;Zt(t,n)}}catch{}}function q(t){W(t)||Qt(t,{recursive:!0})}function u(t,e){let o=y(),n=`${o}/hooks.log`;try{q(o),U(n,Xt);let i=new Date().toISOString().replace("T"," ").slice(0,19);M(n,`[${i}] [${t}] ${e}
`)}catch{}}function a(t,e,o){let n=y(),i=`${n}/permission-feedback.log`;try{q(n),U(i,te);let r=new Date().toISOString(),c=o?.tool_name||process.env.HOOK_TOOL_NAME||"unknown",l=o?.session_id||w();M(i,`${r} | ${t} | ${e} | tool=${c} | session=${l}
`)}catch{}}function Nn(){try{let t=[],o=Buffer.allocUnsafe(256),n,i=0,{readSync:r}=G("node:fs");for(;;)try{if(n=r(i,o,0,256,null),n===0)break;t.push(Buffer.from(o.subarray(0,n)))}catch{break}let c=Buffer.concat(t).toString("utf8").trim();return c?JSON.parse(c):{tool_name:"",session_id:w(),tool_input:{}}}catch{return{tool_name:"",session_id:w(),tool_input:{}}}}function Fn(t,e){let o=e.replace(/^\./,"").split("."),n=t;for(let i of o){if(n==null)return;n=n[i]}return n}function I(t){return t.replace(/\\\s*[\r\n]+/g," ").replace(/\n/g," ").replace(/\s+/g," ").trim()}function Gn(t){return t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}import{execSync as x}from"node:child_process";function v(t){let e=t||m();try{return x("git branch --show-current",{cwd:e,encoding:"utf8",timeout:5e3,stdio:["pipe","pipe","pipe"]}).trim()}catch{return"unknown"}}function P(t){let e=t||v();return["dev","main","master"].includes(e)}function Un(t){let e=t||m();try{return x("git rev-parse --show-toplevel",{cwd:e,encoding:"utf8",timeout:5e3,stdio:["pipe","pipe","pipe"]}).trim()}catch{return e}}function qn(t){let e=t||m();try{return x("git rev-parse --git-dir",{cwd:e,encoding:"utf8",timeout:5e3,stdio:["pipe","pipe","pipe"]}),!0}catch{return!1}}function D(t){let e=t||m();try{return x("git status --short",{cwd:e,encoding:"utf8",timeout:1e4,stdio:["pipe","pipe","pipe"]}).trim()}catch{return""}}function Vn(t){return D(t).length>0}function zn(t){let e=t||m();try{return x("git rev-parse --verify main",{cwd:e,encoding:"utf8",timeout:5e3,stdio:["pipe","pipe","pipe"]}),"main"}catch{try{return x("git rev-parse --verify master",{cwd:e,encoding:"utf8",timeout:5e3,stdio:["pipe","pipe","pipe"]}),"master"}catch{return"main"}}}function ee(t){let e=[/issue\/(\d+)/i,/feature\/(\d+)/i,/fix\/(\d+)/i,/bug\/(\d+)/i,/feat\/(\d+)/i,/^(\d+)-/,/-(\d+)$/,/#(\d+)/];for(let o of e){let n=t.match(o);if(n)return parseInt(n[1],10)}return null}function V(t){if(P(t))return null;let e=["issue/","feature/","fix/","bug/","feat/","chore/","docs/","refactor/","test/","ci/","perf/","style/","release/","hotfix/"];return e.some(n=>t.startsWith(n))?t.startsWith("issue/")&&!ee(t)?"issue/ branches should include an issue number (e.g., issue/123-description)":null:`Branch name should start with a valid prefix: ${e.join(", ")}`}function Zn(t){return e=>t(e)?null:s()}function j(t,...e){let o=t.tool_input.file_path;if(!o)return s();let n=o.split(".").pop()?.toLowerCase()||"";return e.map(r=>r.toLowerCase().replace(/^\./,"")).includes(n)?null:s()}function _(t){return j(t,"py","ts","tsx","js","jsx","go","rs","java")}function Qn(t){return j(t,"py")}function Yn(t){return j(t,"ts","tsx","js","jsx")}function Xn(t){let e=t.tool_input.file_path;return e?[/test/i,/spec/i,/__tests__/i].some(n=>n.test(e))?null:s():s()}function C(t){let e=t.tool_input.file_path||"";return e&&[/\/\.claude\//,/\/node_modules\//,/\/\.git\//,/\/dist\//,/\/build\//,/\/__pycache__\//,/\/\.venv\//,/\/venv\//,/\.lock$/].some(n=>n.test(e))?s():null}function z(t,...e){let o=t.tool_input.file_path;if(!o)return s();for(let n of e)if(typeof n=="string"){if(new RegExp(n.replace(/\*/g,".*").replace(/\?/g,".")).test(o))return null}else if(n.test(o))return null;return s()}function K(t,...e){let o=t.tool_name;return o?e.includes(o)?null:s():s()}function J(t){return K(t,"Write","Edit")}function tr(t){return K(t,"Bash")}function er(t){let e=t.tool_input.command||"";return[/^echo\s/,/^ls(\s|$)/,/^pwd$/,/^cat\s/,/^head\s/,/^tail\s/,/^wc\s/,/^date$/,/^whoami$/].some(n=>n.test(e))?s():null}function or(t){return(t.tool_input.command||"").startsWith("git")?null:s()}function nr(t){let o=`${t.project_dir||process.env.CLAUDE_PROJECT_DIR||"."}/.claude/coordination/.claude.db`;try{let{existsSync:n}=G("node:fs");if(n(o))return null}catch{}return s()}function b(t,...e){for(let o of e){let n=o(t);if(n!==null)return n}return null}var oe=["rm -rf /","rm -rf ~","rm -fr /","rm -fr ~","> /dev/sda","mkfs.","chmod -R 777 /","dd if=/dev/zero of=/dev/","dd if=/dev/random of=/dev/",":(){:|:&};:","mv /* /dev/null","wget.*|.*sh","curl.*|.*sh"];function Z(t){let e=t.tool_input.command||"";if(!e)return s();let o=I(e);for(let n of oe)if(o.includes(n))return u("dangerous-command-blocker",`BLOCKED: Dangerous pattern: ${n}`),a("deny",`Dangerous pattern: ${n}`,t),g(`Command matches dangerous pattern: ${n}

This command could cause severe system damage and has been blocked.`);return s()}function Q(t){let e=t.tool_input.command||"";if(!e.startsWith("git"))return s();let o=v(t.project_dir);if(P(o)){if(/git\s+commit/.test(e)||/git\s+push/.test(e)){let i=`BLOCKED: Cannot commit or push directly to '${o}' branch.

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

Aborting command to protect ${o} branch.`;return a("deny",`Blocked ${e} on protected branch ${o}`,t),u("git-branch-protection",`BLOCKED: ${e} on ${o}`),g(i)}let n=`Branch: ${o} (PROTECTED). Direct commits blocked. Create feature branch for changes: git checkout -b issue/<number>-<desc>`;return a("allow",`Git command on protected branch: ${e}`,t),f(n)}if(/git\s+(commit|push|merge)/.test(e)){let n=`Branch: ${o}. Protected: dev, main, master. PR workflow: push to feature branch, then gh pr create --base dev`;return a("allow",`Git command allowed: ${e}`,t),f(n)}return a("allow",`Git command allowed: ${e}`,t),s()}var E=["feat","fix","refactor","docs","test","chore","style","perf","ci","build"];function ne(t){let e=t.match(/-m\s+["']([^"']+)["']/);if(e)return e[1];let o=t.match(/-m\s+(\S+)/);return o?o[1]:null}function Y(t){let e=t.tool_input.command||"";if(!/^git\s+commit/.test(e))return s();if(/<<['"]?EOF/.test(e)){let l=`Commit via heredoc detected. Ensure format: type(#issue): description

Allowed types: ${E.join(", ")}
Example: feat(#123): Add user authentication

Commit MUST end with:
Co-Authored-By: Claude <noreply@anthropic.com>`;return a("allow","Heredoc commit - injecting format guidance",t),d(l)}let o=ne(e);if(!o){let l=`Interactive commit detected. Use conventional format:
type(#issue): description

Types: ${E.join("|")}`;return a("allow","Interactive commit - injecting guidance",t),d(l)}let n=E.join("|"),i=new RegExp(`^(${n})(\\(#?[0-9]+\\)|(\\([a-z-]+\\)))?: .+`),r=new RegExp(`^(${n}): .+`);if(i.test(o)||r.test(o)){let l=o.split(`
`)[0],p=l.length;if(p>72){let h=`Commit message title is ${p} chars (recommended: <72).
Consider shortening: ${l.slice(0,50)}...`;return a("allow",`Valid commit but long title (${p} chars)`,t),d(h)}return a("allow",`Valid conventional commit: ${o}`,t),u("git-commit-message-validator",`Valid: ${o}`),s()}let c=`INVALID COMMIT MESSAGE FORMAT

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

Please update your commit message to follow conventional format.`;return a("deny",`Invalid commit format: ${o}`,t),u("git-commit-message-validator",`Invalid: ${o}`),g(c)}function X(t){let e=t.tool_input.command||"";if(!/git\s+(checkout\s+-b|branch\s+)/.test(e))return s();let o=null,n=e.match(/checkout\s+-b\s+(\S+)/);n&&(o=n[1]);let i=e.match(/git\s+branch\s+(\S+)/);if(i&&!o&&(o=i[1]),!o)return s();let r=V(o);if(r){let c=`Branch naming: ${r}

Recommended formats:
  issue/123-description
  feature/user-auth
  fix/login-bug
  chore/update-deps

Example: git checkout -b issue/123-add-user-auth`;return a("allow",`Branch naming guidance: ${o}`,t),u("git-branch-naming-validator",`Guidance for: ${o}`),d(c)}return a("allow",`Valid branch name: ${o}`,t),s()}var re=10;function tt(t){let e=t.tool_input.command||"";if(!/^git\s+commit/.test(e))return s();let i=D(t.project_dir).split(`
`).filter(r=>r.trim().length>0).length;if(i>re){let r=`Large commit detected: ${i} files staged.

Atomic commits are easier to review, revert, and understand.
Consider splitting into smaller, focused commits:
  - Group related changes together
  - One feature/fix per commit
  - Max 5-10 files per commit recommended

Continue if this is intentional (refactoring, deps update, etc.)`;return a("allow",`Large commit: ${i} files`,t),u("git-atomic-commit-checker",`Warning: ${i} files`),d(r)}return a("allow","Atomic commit check passed",t),s()}var ie=["rm -rf /","rm -rf ~","rm -fr /","rm -fr ~","mkfs","dd if=/dev","> /dev/sd","chmod -R 777 /"];function se(t){let e=t.trim();if(!e)return!0;for(let o of ie)if(e.includes(o))return!1;return!0}function ce(t){if(/curl.*\|.*(sh|bash)/.test(t)||/wget.*\|.*(sh|bash)/.test(t))return"pipe-to-shell execution (curl/wget piped to sh/bash)";if(!t.includes("&&")&&!t.includes("||")&&!t.includes("|")&&!t.includes(";"))return null;let e=t.split(/&&|\|\||[|;]/);for(let o of e)if(!se(o))return o.trim();return null}function et(t){let e=t.tool_input.command||"";if(!e)return s();let o=I(e),n=ce(o);if(n){let i=`BLOCKED: Dangerous compound command detected.

Blocked segment: ${n}

The command contains a potentially destructive operation.

Please review and modify your command to remove the dangerous operation.`;return a("deny",`Dangerous compound command: ${n}`,t),u("compound-command-validator",`BLOCKED: ${n}`),g(i)}return a("allow","Compound command validated: safe",t),s()}var ot=12e4;function nt(t){let e=t.tool_input.command||"",o=t.tool_input.timeout,n=t.tool_input.description;if(typeof o=="number"&&o>0)return{continue:!0,suppressOutput:!0};let i={command:e,timeout:ot};return n&&typeof n=="string"&&(i.description=n),u("default-timeout-setter",`Setting default timeout: ${ot}ms`),{continue:!0,suppressOutput:!0,hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"allow",updatedInput:i}}}import{existsSync as ae,readFileSync as ue}from"node:fs";import{join as le}from"node:path";function pe(t){let e=le(t,".claude","rules","error_rules.json");try{if(ae(e))return JSON.parse(ue(e,"utf8")).rules||[]}catch{}return[]}function me(t,e){let o=new Set(t.toLowerCase().split(/\s+/)),n=new Set(e.toLowerCase().split(/\s+/)),i=0;for(let r of o)n.has(r)&&r.length>2&&i++;return i}function rt(t){let e=m(),o=t.tool_input.command||"";if(!o)return s();let n=pe(e);if(n.length===0)return s();let i=[];/psql.*-U\s+(postgres|orchestkit|root)/.test(o)&&n.filter(c=>c.tool==="Bash"&&c.signature?.includes("role")).length>0&&i.push("DB role error: use docker exec -it <container> psql -U orchestkit_user"),o.includes("mcp__postgres")&&n.filter(c=>c.tool?.includes("postgres-mcp")).length>0&&i.push("MCP postgres: verify connection to correct database");for(let r of n){if(!r.pattern||(r.occurrence_count||0)<5)continue;let c=r.sample_input?.command;c&&me(o,c)>3&&(u("error-pattern-warner",`Pattern match: ${r.signature}`),r.suggested_fix?i.push(`${r.signature} (${r.occurrence_count}x): ${r.suggested_fix}`):i.push(`${r.signature} (${r.occurrence_count}x)`))}if(i.length>0){let r="Learned error patterns | "+i.join(" | ");return r.length>200&&(r=r.slice(0,197)+"..."),f(r)}return s()}import{execSync as it}from"node:child_process";function de(t,e){try{let n=it(`git diff --name-only ${e}...HEAD 2>/dev/null || echo ""`,{cwd:t,encoding:"utf8",timeout:1e4,stdio:["pipe","pipe","pipe"]}).trim().split(`
`).filter(Boolean),i=[];for(let r of n.slice(0,20))try{it(`git log -1 --pretty=format:"%h" ${e} -- "${r}" 2>/dev/null || echo ""`,{cwd:t,encoding:"utf8",timeout:5e3,stdio:["pipe","pipe","pipe"]}).trim()&&i.push(r)}catch{}return i}catch{return[]}}function st(t){let e=t.tool_input.command||"",o=m();if(!/git\s+(merge|rebase|pull)/.test(e))return s();let n=null,i=e.match(/git\s+(merge|rebase)\s+(\S+)/);if(i&&(n=i[2]),e.includes("git pull")&&(n="origin/dev"),!n)return s();let r=de(o,n);if(r.length>0){let c=`Potential conflicts detected: ${r.length} file(s)
Files: ${r.slice(0,5).join(", ")}${r.length>5?"...":""}

Consider:
1. Review changes in these files before merging
2. Run: git diff ${n}...HEAD -- <file>
3. Prepare conflict resolution strategy`;return a("allow",`Conflict prediction: ${r.length} files`,t),u("conflict-predictor",`Potential conflicts: ${r.join(", ")}`),d(c)}return a("allow","No conflicts predicted",t),s()}import{execSync as fe}from"node:child_process";import{existsSync as ge}from"node:fs";import{join as he,basename as ke,dirname as ye}from"node:path";function Se(t,e){let o=[],n=ke(e).replace(/\.(ts|tsx|js|jsx|py)$/,""),i=ye(e),r=[`${i}/${n}.test.ts`,`${i}/${n}.test.tsx`,`${i}/${n}.spec.ts`,`${i}/${n}.spec.tsx`,`${i}/__tests__/${n}.test.ts`,`${i}/__tests__/${n}.test.tsx`,`tests/${e.replace(/\.(ts|tsx|js|jsx)$/,".test.ts")}`,`test_${n}.py`,`tests/test_${n}.py`];for(let c of r){let l=he(t,c);ge(l)&&o.push(c)}return o}function $e(t){try{return fe('git status --short 2>/dev/null || echo ""',{cwd:t,encoding:"utf8",timeout:5e3,stdio:["pipe","pipe","pipe"]}).split(`
`).filter(o=>o.trim()).map(o=>o.slice(3).trim()).filter(o=>/\.(ts|tsx|js|jsx|py)$/.test(o))}catch{return[]}}function ct(t){let e=t.tool_input.command||"",o=m();if(!/git\s+push|npm\s+run\s+test|pytest/.test(e))return s();if(/npm\s+run\s+test|pytest/.test(e))return s();let n=$e(o);if(n.length===0)return s();let i=[];for(let c of n.slice(0,10)){let l=Se(o,c);i.push(...l)}let r=[...new Set(i)];if(r.length>0){let c=`Related tests for changed files:
${r.slice(0,5).join(`
`)}${r.length>5?`
...`:""}

Consider running: npm run test -- ${r[0]}`;return a("allow",`Found ${r.length} related tests`,t),u("affected-tests-finder",`Tests: ${r.join(", ")}`),d(c)}return s()}import{existsSync as T}from"node:fs";import{join as A}from"node:path";function xe(t){let e=[];return T(A(t,"package.json"))&&(e.push("npm run lint"),e.push("npm run typecheck"),e.push("npm run test")),T(A(t,"pyproject.toml"))&&(e.push("ruff check ."),e.push("mypy ."),e.push("pytest")),T(A(t,"go.mod"))&&(e.push("go vet ./..."),e.push("go test ./...")),e}function at(t){let e=t.tool_input.command||"",o=m();if(!/git\s+push/.test(e))return s();let n=xe(o);if(n.length===0)return s();let i=`Pre-push CI simulation suggested:
${n.slice(0,3).join(`
`)}

Run these locally to catch issues before CI fails.
Or: git push --no-verify to skip (not recommended)`;return a("allow","CI simulation suggested",t),u("ci-simulation",`Suggested checks: ${n.join(", ")}`),d(i)}import{existsSync as L}from"node:fs";import{join as O}from"node:path";function _e(t){return L(O(t,".pre-commit-config.yaml"))||L(O(t,".pre-commit-config.yml"))}function be(t){return L(O(t,".husky"))}function ut(t){let e=t.tool_input.command||"",o=m();if(!/git\s+commit/.test(e))return s();if(/--no-verify/.test(e)){let n=`WARNING: --no-verify will skip pre-commit hooks.
Consider removing it unless intentional.
Skipped checks may cause CI failures.`;return a("allow","Skip pre-commit detected",t),u("pre-commit-simulation","--no-verify used"),d(n)}if(_e(o)){let n=`Pre-commit hooks will run: .pre-commit-config.yaml
If hooks fail, fix issues and retry.
Run manually: pre-commit run --all-files`;return a("allow","pre-commit config found",t),d(n)}if(be(o)){let n=`Husky hooks will run: .husky/
If hooks fail, fix issues and retry.`;return a("allow","husky config found",t),d(n)}return s()}import{execSync as we}from"node:child_process";function He(t,e){try{let o=e?`${e}`:"",n=we(`gh pr view ${o} --json number,state,mergeable,statusCheckRollup,reviewDecision 2>/dev/null`,{cwd:t,encoding:"utf8",timeout:1e4,stdio:["pipe","pipe","pipe"]});return JSON.parse(n)}catch{return null}}function lt(t){let e=t.tool_input.command||"",o=m();if(!/gh\s+pr\s+merge/.test(e))return s();let n=e.match(/gh\s+pr\s+merge\s+(\d+)/),i=n?parseInt(n[1],10):void 0,r=He(o,i);if(!r){let l=`Could not fetch PR status. Ensure:
1. gh CLI is installed and authenticated
2. You're in a git repository
3. PR exists and is accessible`;return a("allow","PR status unavailable",t),d(l)}let c=[];if(r.state!=="OPEN"&&c.push(`PR state: ${r.state} (expected OPEN)`),r.mergeable||c.push("PR has merge conflicts"),r.statusCheckRollup!=="SUCCESS"&&r.statusCheckRollup!=="PENDING"&&c.push(`Status checks: ${r.statusCheckRollup}`),r.reviewDecision==="CHANGES_REQUESTED"&&c.push("Changes requested by reviewer"),c.length>0){let l=`PR #${r.number} has issues:
${c.join(`
`)}

Resolve these before merging.`;return a("allow",`PR issues: ${c.join(", ")}`,t),u("pr-merge-gate",`PR #${r.number} has ${c.length} issues`),d(l)}return a("allow",`PR #${r.number} ready to merge`,t),s()}import{execSync as Re}from"node:child_process";function Ie(t,e){try{let o=e?`--since="${e}"`:"--max-count=20";return Re(`git log ${o} --pretty=format:"%s" 2>/dev/null || echo ""`,{cwd:t,encoding:"utf8",timeout:1e4,stdio:["pipe","pipe","pipe"]}).split(`
`).filter(Boolean)}catch{return[]}}function Ce(t){let e={feat:[],fix:[],refactor:[],docs:[],test:[],chore:[],other:[]};for(let o of t){let n=o.match(/^(feat|fix|refactor|docs|test|chore|perf|ci|build)/);if(n){let i=n[1]==="perf"||n[1]==="ci"||n[1]==="build"?"chore":n[1];e[i].push(o)}else e.other.push(o)}return e}function pt(t){let e=t.tool_input.command||"",o=m();if(!/npm\s+version|poetry\s+version|changelog/.test(e))return s();let n=Ie(o);if(n.length===0)return s();let i=Ce(n),r=[];if(i.feat.length>0&&r.push(`### Features
${i.feat.slice(0,5).map(l=>`- ${l}`).join(`
`)}`),i.fix.length>0&&r.push(`### Bug Fixes
${i.fix.slice(0,5).map(l=>`- ${l}`).join(`
`)}`),i.refactor.length>0||i.chore.length>0){let l=[...i.refactor,...i.chore];r.push(`### Maintenance
${l.slice(0,3).map(p=>`- ${p}`).join(`
`)}`)}if(r.length===0)return s();let c=`Suggested changelog entries:

${r.join(`

`)}

Update CHANGELOG.md before releasing.`;return a("allow","Changelog suggestions generated",t),u("changelog-generator",`Generated ${r.length} sections`),d(c)}import{existsSync as mt,readFileSync as dt}from"node:fs";import{join as ft}from"node:path";function ve(t){let e=ft(t,"package.json");try{if(mt(e))return JSON.parse(dt(e,"utf8")).version||null}catch{}return null}function Pe(t){let e=ft(t,"pyproject.toml");try{if(mt(e)){let n=dt(e,"utf8").match(/version\s*=\s*["']([^"']+)["']/);return n?n[1]:null}}catch{}return null}function De(t){let e=[],o=ve(t);o&&e.push({file:"package.json",version:o});let n=Pe(t);return n&&e.push({file:"pyproject.toml",version:n}),e}function gt(t){let e=t.tool_input.command||"",o=m();if(!/npm\s+version|poetry\s+version/.test(e))return s();let n=De(o);if(n.length<2)return s();let i=n.map(c=>c.version),r=[...new Set(i)];if(r.length>1){let c=`Version mismatch detected:
${n.map(l=>`${l.file}: ${l.version}`).join(`
`)}

Consider syncing versions across all files.`;return a("allow","Version mismatch detected",t),u("version-sync",`Versions: ${i.join(", ")}`),d(c)}return a("allow",`Versions in sync: ${r[0]}`,t),s()}import{existsSync as je,readFileSync as Ee}from"node:fs";import{join as Te}from"node:path";var Ae=["GPL","AGPL","LGPL","CC-BY-NC","SSPL"];function Le(t){let e=[],o=Te(t,"package-lock.json");try{if(je(o)){let n=Ee(o,"utf8");for(let i of Ae)n.includes(`"license": "${i}`)&&e.push(`Found ${i} license in npm dependencies`)}}catch{}return e}function ht(t){let e=t.tool_input.command||"",o=m();if(!/npm\s+install|yarn\s+add|pip\s+install|poetry\s+add/.test(e))return s();if(/npm\s+ci|npm\s+install\s*$/.test(e))return s();let n=e.match(/(?:npm\s+install|yarn\s+add|pip\s+install|poetry\s+add)\s+(\S+)/),i=n?n[1]:null;if(!i)return s();let r=Le(o);if(r.length>0){let l=`License compliance check:
${r.join(`
`)}

New dependency: ${i}
Consider checking its license before adding.

Use: npm view ${i} license`;return a("allow","License compliance warning",t),u("license-compliance",`Checking: ${i}`),d(l)}let c=`Installing: ${i}
Verify license compatibility before production use.
Check: npm view ${i} license`;return a("allow",`Installing package: ${i}`,t),d(c)}var kt={bug:`## Description
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
- [ ] Task 2`};function Oe(t){return/--label.*bug|bug\s+report/i.test(t)?"bug":/--label.*feature|feature\s+request/i.test(t)?"feature":/--label.*chore|maintenance/i.test(t)?"chore":null}function yt(t){let e=t.tool_input.command||"";if(!/gh\s+issue\s+create/.test(e))return s();if(/--body|--body-file|-b\s/.test(e))return s();let o=Oe(e);if(o&&kt[o]){let i=`Issue type detected: ${o}

Suggested template:
${kt[o].slice(0,200)}...

Add --body with template or use --web for interactive creation.`;return a("allow",`Issue creation: ${o}`,t),u("gh-issue-creation-guide",`Type: ${o}`),d(i)}let n=`Creating GitHub issue. Consider:
- Clear, descriptive title
- Add appropriate labels (bug, feature, chore)
- Include reproduction steps for bugs
- Reference related issues/PRs

Use --web for interactive creation with templates.`;return a("allow","Issue creation guidance",t),d(n)}var Ne=`Documentation checklist for features:
- [ ] Update README.md if public API changes
- [ ] Add/update JSDoc or docstrings
- [ ] Update CHANGELOG.md
- [ ] Add usage examples
- [ ] Update API documentation`;function St(t){let e=t.tool_input.command||"";if(!/gh\s+(issue\s+close|pr\s+merge)/.test(e))return s();if(!(/--label.*feat/i.test(e)||/feat|feature/.test(e)))return s();let n=`Feature completion detected. Ensure documentation is updated.

${Ne}

Skip with --no-edit if docs are already complete.`;return a("allow","Feature docs reminder",t),u("issue-docs-requirement","Feature completion - docs reminder"),d(n)}import{existsSync as $t,readFileSync as Fe}from"node:fs";import{join as xt}from"node:path";function Ge(t){let e=xt(t,".claude","coordination",".claude.db");return $t(e)}function Me(t){let e=xt(t,".claude","coordination","work-registry.json");try{if($t(e))return JSON.parse(Fe(e,"utf8")).qualityGates||{}}catch{}return{}}function _t(t){let e=t.tool_input.command||"",o=m();if(!/gh\s+pr\s+merge|git\s+merge|deploy/.test(e))return s();if(!Ge(o))return s();let n=Me(o),r=["tests","lint","typecheck"].filter(c=>!n[c]);if(r.length>0){let c=`Multi-instance quality gate check:
Failed/missing gates: ${r.join(", ")}

Run these checks before merging:
${r.map(l=>`- npm run ${l}`).join(`
`)}

Quality gates ensure consistency across instances.`;return a("allow",`Quality gates failed: ${r.join(", ")}`,t),u("multi-instance-quality-gate",`Failed: ${r.join(", ")}`),d(c)}return a("allow","All quality gates passed",t),s()}var We=[/localhost.*admin/i,/127\.0\.0\.1.*admin/i,/internal\./i,/intranet\./i,/\.local\//i,/file:\/\//i],Be=["click.*delete","click.*remove","fill.*password","fill.*credit","submit.*payment"];function Ue(t){let e=t.match(/(?:navigate|goto|open)\s+["']?([^"'\s]+)["']?/i);return e?e[1]:null}function qe(t){return We.some(e=>e.test(t))}function Ve(t){return Be.some(e=>new RegExp(e,"i").test(t))}function bt(t){let e=t.tool_input.command||"";if(!/agent-browser|ab\s/.test(e))return s();let o=Ue(e);if(o&&qe(o))return a("deny",`Blocked URL: ${o}`,t),u("agent-browser-safety",`BLOCKED: ${o}`),g(`agent-browser blocked: URL matches blocked pattern.

URL: ${o}

Blocked patterns include internal, localhost admin, and file:// URLs.
If this is intentional, use direct browser access instead.`);if(Ve(e)){let n=`Sensitive browser action detected:
${e.slice(0,100)}...

This may interact with:
- Delete/remove buttons
- Password fields
- Payment forms

Proceed with caution. Verify target elements.`;return a("allow","Sensitive action warning",t),u("agent-browser-safety","Sensitive action detected"),d(n)}return a("allow","agent-browser command validated",t),s()}import{realpathSync as ze,existsSync as Ke}from"node:fs";import{resolve as Je,isAbsolute as Ze}from"node:path";var Qe=[/\.env$/,/\.env\.local$/,/\.env\.production$/,/credentials\.json$/,/secrets\.json$/,/private\.key$/,/\.pem$/,/id_rsa$/,/id_ed25519$/],Ye=[/package\.json$/,/pyproject\.toml$/,/tsconfig\.json$/];function Xe(t,e){try{let o=Ze(t)?t:Je(e,t);return Ke(o)?ze(o):o}catch{return t}}function to(t){for(let e of Qe)if(e.test(t))return e;return null}function eo(t){return Ye.some(e=>e.test(t))}function wt(t){let e=t.tool_input.file_path||"",o=m();if(!e)return s();u("file-guard",`File write/edit: ${e}`);let n=Xe(e,o);u("file-guard",`Resolved path: ${n}`);let i=to(n);return i?(a("deny",`Protected file blocked: ${e} (pattern: ${i})`,t),u("file-guard",`BLOCKED: ${e} matches ${i}`),g(`Cannot modify protected file: ${e}

Resolved path: ${n}
Matched pattern: ${i}

Protected files include:
- Environment files (.env, .env.local, .env.production)
- Credential files (credentials.json, secrets.json)
- Private keys (.pem, id_rsa, id_ed25519)

If you need to modify this file, do it manually outside Claude Code.`)):(eo(n)&&(u("file-guard",`WARNING: Config file modification: ${n}`),a("warn",`Config file modification: ${e}`,t)),a("allow",`File write allowed: ${e}`,t),s())}import{existsSync as Ht,readFileSync as oo}from"node:fs";import{join as Rt}from"node:path";function no(t){return Rt(t,".claude","coordination","locks.json")}function ro(t){return Ht(Rt(t,".claude","coordination"))}function io(){return process.env.CLAUDE_SESSION_ID}function so(t,e){let o=no(t),n=io();try{if(!Ht(o))return null;let r=JSON.parse(oo(o,"utf8")).locks||[],c=new Date().toISOString();return r.find(p=>p.file_path===e&&p.instance_id!==n&&p.expires_at>c)||null}catch{return null}}function It(t){let e=t.tool_input.file_path||"",o=m(),n=t.tool_name;if(!e)return s();if(!ro(o))return s();if(e.includes(".claude/coordination"))return s();let i=e.startsWith(o)?e.slice(o.length+1):e,r=so(o,i);return r?(a("deny",`File ${e} locked by ${r.instance_id}`,t),u("file-lock-check",`BLOCKED: ${e} locked by ${r.instance_id}`),g(`File ${e} is locked by instance ${r.instance_id}.

Lock acquired at: ${r.acquired_at}
Expires at: ${r.expires_at}

You may want to wait or check the work registry:
.claude/coordination/work-registry.json`)):(a("allow",`Lock check passed for ${e}`,t),u("file-lock-check",`Lock check passed: ${e} (${n})`),s())}import{existsSync as F,readFileSync as co,writeFileSync as ao,mkdirSync as uo}from"node:fs";import{join as N,dirname as lo}from"node:path";function po(t){return N(t,".claude","coordination","locks.json")}function mo(){return`lock-${Date.now()}-${Math.random().toString(36).slice(2,10)}`}function fo(){return process.env.CLAUDE_SESSION_ID}function go(){return new Date(Date.now()+6e4).toISOString()}function ho(t){try{if(F(t))return JSON.parse(co(t,"utf8"))}catch{}return{locks:[]}}function ko(t,e){let o=lo(t);F(o)||uo(o,{recursive:!0}),ao(t,JSON.stringify(e,null,2))}function yo(t,e,o){let n=new Date().toISOString();return t.find(i=>i.file_path===e&&i.instance_id!==o&&i.expires_at>n)||null}function So(t,e,o){let n=new Date().toISOString();return t.find(i=>i.lock_type==="directory"&&e.startsWith(i.file_path)&&i.instance_id!==o&&i.expires_at>n)||null}function $o(t,e,o,n){t.locks=t.locks.filter(r=>!(r.file_path===e&&r.instance_id===o));let i=new Date().toISOString();t.locks=t.locks.filter(r=>r.expires_at>i),t.locks.push({lock_id:mo(),file_path:e,lock_type:"exclusive_write",instance_id:o,acquired_at:i,expires_at:go(),reason:n})}function Ct(t){let e=J(t);if(e)return e;let o=t.tool_input.file_path||"",n=m(),i=t.tool_name;if(!o)return s();let r=po(n),c=N(n,".instance");if(!F(N(c,"id.json")))return u("multi-instance-lock","No instance identity, passing through"),s();let l=o.startsWith(n)?o.slice(n.length+1):o,p=fo(),h=ho(r),k=So(h.locks,l,p);if(k)return a("deny",`Directory ${k.file_path} locked by ${k.instance_id}`,t),u("multi-instance-lock",`BLOCKED: Directory lock by ${k.instance_id}`),g(`Directory ${k.file_path} is locked by another Claude instance (${k.instance_id}).
Wait for lock release.`);let $=yo(h.locks,l,p);return $?(a("deny",`File ${l} locked by ${$.instance_id}`,t),u("multi-instance-lock",`BLOCKED: ${l} locked by ${$.instance_id}`),g(`File ${l} is locked by another Claude instance (${$.instance_id}).
Wait for lock release.`)):($o(h,l,p,`Modifying via ${i}`),ko(r,h),u("multi-instance-lock",`Lock acquired: ${l}`),a("allow",`Lock acquired for ${l}`,t),s())}import{existsSync as Pt,readFileSync as xo}from"node:fs";import{join as vt}from"node:path";var _o={"api-layer":[/\/api\//,/\/routes\//,/\/endpoints\//],"service-layer":[/\/services\//],"data-layer":[/\/db\//,/\/models\//,/\/repositories\//],"workflow-layer":[/\/workflows\//,/\/agents\//],unknown:[]};function bo(t){for(let[e,o]of Object.entries(_o))if(e!=="unknown"&&o.some(n=>n.test(t)))return e;return"unknown"}function wo(t,e){let o=vt(e,".claude","context","patterns"),n=vt(o,`${t}.json`);try{if(Pt(n)){let i=xo(n,"utf8"),r=JSON.parse(i),c=Array.isArray(r)?r.length:Object.keys(r).length;if(c>0)return` | Patterns loaded: ${c}`}}catch{}return""}function Dt(t){let e=t.tool_input.file_path||"",o=t.project_dir||m();if(!e)return s();let i=z(t,...["**/api/**","**/services/**","**/db/**","**/models/**","**/workflows/**"]);if(i!==null)return i;let r=bo(e);if(r==="unknown")return s();let c=wo(r,o),l=!Pt(e),p;return l?p=`New ${r} file. Follow layer conventions: dependency injection, interface contracts${c}`:p=`Modifying ${r}. Ensure: no breaking API changes, maintain layer boundaries${c}`,a("allow",`Architectural change: ${e} (${r})`,t),u("architecture-change-detector",`ARCH_DETECT: ${e} (layer=${r})`),f(p)}import{existsSync as Ho,readFileSync as Ro}from"node:fs";import{join as Io,extname as Co}from"node:path";var S=50,jt=4,vo=10;function Po(t){return Co(t).toLowerCase().replace(".","")}function Do(t,e){let o=[],n=t.split(`
`);if(e==="py"){let i=!1,r="",c=0;for(let l of n){let p=l.match(/^(\s*)(?:async\s+)?def\s+([a-zA-Z_][a-zA-Z0-9_]*)/),h=l.match(/^(\s*)class\s+/);p?(i&&c>S&&o.push(`Function '${r}' is ${c} lines (max: ${S})`),i=!0,r=p[2],c=1):h?(i&&c>S&&o.push(`Function '${r}' is ${c} lines (max: ${S})`),i=!1):i&&l.trim()&&c++}i&&c>S&&o.push(`Function '${r}' is ${c} lines (max: ${S})`)}else if(["ts","tsx","js","jsx","go","java","rs"].includes(e)){let i=0,r=0,c=!1,l="";for(let p of n){let h=p.match(/(?:function|func|fn)\s+([a-zA-Z_][a-zA-Z0-9_]*)/),k=p.match(/const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(?:async\s*)?\(/);if(h?(l=h[1],c=!0,r=0,i=0):k&&(l=k[1],c=!0,r=0,i=0),c){let $=(p.match(/\{/g)||[]).length,Kt=(p.match(/\}/g)||[]).length;i+=$-Kt,p.trim()&&r++,i<=0&&r>0&&(r>S&&o.push(`Function '${l}' is ${r} lines (max: ${S})`),c=!1)}}}return o}function jo(t,e){let o=[],n=t.split(`
`),i=0;if(e==="py")for(let r of n){let c=r.match(/^(\s*)(if|for|while|with|try|elif|else|except|finally)[\s:]/);if(c){let l=c[1].length,p=Math.floor(l/4);p>i&&(i=p)}}else if(["ts","tsx","js","jsx","go","java","rs"].includes(e)){let r=0;for(let c of n){let l=(c.match(/\{/g)||[]).length,p=(c.match(/\}/g)||[]).length;r+=l-p,/(?:if|for|while|switch|try)\s*\(/.test(c)&&r>i&&(i=r)}}return i>jt&&o.push(`Deep nesting detected (depth: ${i}, max: ${jt})`),o}function Eo(t){let e=[],o=(t.match(/\b(if|elif|else if)\b/g)||[]).length,n=(t.match(/\b(switch|match)\b/g)||[]).length,i=(t.match(/\?[^:]+:/g)||[]).length,r=o+n+i,c=Math.max((t.match(/\b(def|function|func|fn)\b/g)||[]).length,1),l=Math.floor(r/c);return l>vo&&e.push(`High cyclomatic complexity (~${l} conditionals/function, consider refactoring)`),e}function To(t,e){let o=Io(e,".claude","cache","type-errors.json");if(!Ho(o))return"";try{let n=JSON.parse(Ro(o,"utf8")),i=t.split("/").pop()||"";return n[i]||""}catch{return""}}function Et(t){let e=t.tool_input.file_path||"",o=t.tool_input.content||"",n=t.project_dir||m(),i=b(t,_,C);if(i!==null)return i;if(!e||!o)return s();let r=Po(e),c=[];c.push(...Do(o,r)),c.push(...jo(o,r)),c.push(...Eo(o));let l=To(e,n);if(l&&c.push(l),c.length>0){u("code-quality-gate",`Quality warnings for ${e}: ${c.join(", ")}`);let p=`Code quality: ${c.join(" | ")}`;return p.length>350&&(p=p.slice(0,347)+"..."),f(p)}return u("code-quality-gate",`No quality issues in ${e}`),s()}import{extname as Ao}from"node:path";function Lo(t){return Ao(t).toLowerCase().replace(".","")}function Oo(t){return[/test/i,/spec/i,/__tests__/i,/_test\.py$/,/\.test\.ts$/,/\.spec\.ts$/].some(o=>o.test(t))}function No(t){let e=[],o=t.split(`
`);for(let n=0;n<o.length;n++){let r=o[n].match(/^(?:\s*)(?:async\s+)?def\s+([^_][a-zA-Z0-9_]*)\s*\(/);if(r){let c=r[1],l=!1;for(let p=n+1;p<o.length;p++){let h=o[p].trim();if(h){(h.startsWith('"""')||h.startsWith("'''"))&&(l=!0);break}}if(!l&&(e.push(c),e.length>=5))break}}return e}function Fo(t){let e=[],o=t.split(`
`),n=!1;for(let i=0;i<o.length;i++){let r=o[i];(i>0?o[i-1].trim():"").endsWith("*/")&&(n=!0);let l=r.match(/^export\s+(?:async\s+)?(?:function\s+([a-zA-Z][a-zA-Z0-9_]*)|const\s+([a-zA-Z][a-zA-Z0-9_]*)\s*=)/);if(l){let p=l[1]||l[2];if(!n&&(e.push(p),e.length>=5))break;n=!1}else r.trim().endsWith("*/")||(n=!1)}return e}function Tt(t){let e=t.tool_input.file_path||"",o=t.tool_input.content||"",n=b(t,_,C);if(n!==null)return n;if(!e||!o)return s();if(Oo(e))return s();let i=Lo(e),r=[];if(i==="py"?r=No(o):["ts","tsx","js","jsx"].includes(i)&&(r=Fo(o)),r.length>0){let c=r.join(", "),l;return i==="py"?l=`Documentation: ${r.length} public function(s) missing docstrings: ${c}. Consider adding """docstrings""" for better code documentation.`:l=`Documentation: ${r.length} exported function(s) missing JSDoc: ${c}. Consider adding /** JSDoc */ comments for better IDE support.`,l.length>200&&(i==="py"?l=`Documentation: ${r.length} public function(s) missing docstrings. Add """docstrings""" for better documentation.`:l=`Documentation: ${r.length} exported function(s) missing JSDoc. Add /** JSDoc */ for better IDE support.`),u("docstring-enforcer",`DOCSTRING_WARN: ${r.length} functions missing docs in ${e}`),f(l)}return u("docstring-enforcer",`DOCSTRING_OK: All public functions documented in ${e}`),s()}import{basename as Go}from"node:path";var Mo=[{name:"Potential hardcoded secret detected",pattern:/(api[_-]?key|password|secret|token)\s*[=:]\s*['"][^'"]+['"]/i,severity:"high"},{name:"Potential SQL injection vulnerability",pattern:/execute\s*\(\s*['"].*\+|f['"].*SELECT.*\{/,severity:"high"},{name:"Dangerous eval/exec usage detected",pattern:/eval\s*\(|exec\s*\(/,severity:"high"},{name:"Subprocess with shell=True detected",pattern:/subprocess\.(run|call|Popen).*shell\s*=\s*True/,severity:"medium"},{name:"Potential XSS vulnerability (innerHTML)",pattern:/\.innerHTML\s*=|dangerouslySetInnerHTML/,severity:"medium"},{name:"Insecure random number generation",pattern:/Math\.random\(\).*(?:password|token|secret|key)/i,severity:"medium"},{name:"Potential command injection",pattern:/os\.system\s*\(|os\.popen\s*\(/,severity:"high"},{name:"Insecure HTTP (should use HTTPS)",pattern:/http:\/\/(?!localhost|127\.0\.0\.1)/,severity:"low"}];function Wo(t){let e=[];for(let{name:o,pattern:n}of Mo)n.test(t)&&e.push(o);return e}function At(t){let e=t.tool_input.file_path||"",o=t.tool_input.content||"",n=b(t,_);if(n!==null)return n;if(!e)return s();let i=Wo(o);if(i.length>0){u("security-pattern-validator",`SECURITY_WARN: ${e} - ${i.join(", ")}`);let r=`Security warnings for ${Go(e)}: ${i.join(", ")}`;return a("warn",`Security issues in ${e}: ${i.join(", ")}`,t),f(r)}return u("security-pattern-validator",`SECURITY_OK: ${e}`),a("allow",`No security issues in ${e}`,t),s()}import{existsSync as Lt,readFileSync as Bo,appendFileSync as Uo,statSync as qo,renameSync as Vo,mkdirSync as zo}from"node:fs";import{join as Ko}from"node:path";var Jo=102400;function Zo(){let t=y();return Ko(t,"context7-telemetry.log")}function Qo(t){try{Lt(t)&&qo(t).size>Jo&&Vo(t,`${t}.old`)}catch{}}function Yo(t){if(!Lt(t))return"";try{let o=Bo(t,"utf8").trim().split(`
`).filter(Boolean),n=o.length;if(n===0)return"";let i=new Set;for(let l of o){let p=l.match(/library=([^| ]+)/);p&&p[1]&&p[1]!==""&&i.add(p[1])}let r=[];for(let l=o.length-1;l>=0&&r.length<3;l--){let p=o[l].match(/library=([^| ]+)/);p&&p[1]&&!r.includes(p[1])&&r.push(p[1])}let c=r.length>0?r.join(", "):"none";return`Context7: ${n} queries, ${i.size} libraries. Recent: ${c}`}catch{return""}}function Ot(t){let e=t.tool_name||"";if(!e.startsWith("mcp__context7__"))return s();let o=t.tool_input.libraryId||"",n=t.tool_input.query||"",i=y();try{zo(i,{recursive:!0})}catch{}let r=Zo();Qo(r);let l=`${new Date().toISOString()} | tool=${e} | library=${o} | query_length=${n.length}
`;try{Uo(r,l)}catch{}let p=Yo(r);return a("allow",`Documentation lookup: ${o}`,t),u("context7-tracker",`Query: ${e} library=${o}`),p?f(p):s()}import{existsSync as Nt,mkdirSync as Ft,readFileSync as Xo,writeFileSync as tn,readdirSync as en}from"node:fs";import{join as R}from"node:path";function on(t,e){let o=R(t,".claude","logs"),n=0;if(!Nt(o))return 0;try{let i=en(o);for(let r of i)if(r.startsWith(".mem0-pending-sync-")&&r.endsWith(".json")){let c=r.replace(".mem0-pending-sync-","").replace(".json","");c!==e&&c!=="unknown"&&n++}}catch{}return n}function nn(t){let e=[R(t,".claude","logs","mem0-processed"),R(t,".claude","context","session")];for(let o of e)try{Ft(o,{recursive:!0})}catch{}}function rn(){return process.env.MEM0_API_KEY?"enhanced":"ready"}function sn(t,e){let o=R(t,".claude","logs",".memory-fabric-sessions.json"),n=new Date().toISOString();try{Ft(R(t,".claude","logs"),{recursive:!0});let i={};if(Nt(o)){let r=Xo(o,"utf8");i=JSON.parse(r).sessions||{}}i[e]={active:!0,last_seen:n},tn(o,JSON.stringify({sessions:i},null,2))}catch{}}function Gt(t){let e=t.project_dir||m(),o=t.session_id||w();u("memory-fabric-init","Memory Fabric lazy initialization triggered"),nn(e),sn(e,o);let n=on(e,o),i=rn();u("memory-fabric-init",`Initialization complete: health=${i}, orphaned=${n}`);let r="";return n>0&&(r=`[Memory Fabric] Detected ${n} orphaned session(s) with pending syncs.
Consider running maintenance: claude --maintenance`),i==="enhanced"?u("memory-fabric-init","Memory Fabric ready (enhanced mode with mem0)"):u("memory-fabric-init","Memory Fabric ready (graph mode)"),r?f(r):s()}function Mt(t){let e=t.tool_name||"";if(!e.startsWith("mcp__memory__"))return s();switch(e){case"mcp__memory__delete_entities":{let o=t.tool_input.entityNames,n=Array.isArray(o)?o.length:0;if(n>5)return a("warn",`Bulk delete: ${n} entities`,t),u("memory-validator",`WARN: Bulk entity delete: ${n} entities`),H(`Deleting ${n} entities from knowledge graph`);break}case"mcp__memory__delete_relations":{let o=t.tool_input.relations,n=Array.isArray(o)?o.length:0;if(n>10)return a("warn",`Bulk relation delete: ${n} relations`,t),u("memory-validator",`WARN: Bulk relation delete: ${n} relations`),H(`Deleting ${n} relations from knowledge graph`);break}case"mcp__memory__create_entities":{let o=t.tool_input.entities;if(!Array.isArray(o))return a("allow","Creating entities (non-array input)",t),s();let n=o.length,i=o.filter(r=>!r.name||r.name===""||!r.entityType||r.entityType==="").length;if(i>0)return a("warn",`Invalid entities: ${i} missing name or entityType`,t),u("memory-validator",`WARN: ${i} entities missing required fields`),H(`${i} entities missing required fields (name, entityType)`);a("allow",`Creating ${n} valid entities`,t);break}case"mcp__memory__create_relations":{let o=t.tool_input.relations;if(!Array.isArray(o))return a("allow","Creating relations (non-array input)",t),s();let n=o.length,i=o.filter(r=>!r.from||!r.to||!r.relationType).length;if(i>0)return a("warn",`Invalid relations: ${i} missing from/to/relationType`,t),u("memory-validator",`WARN: ${i} relations missing required fields`),H(`${i} relations missing required fields`);a("allow",`Creating ${n} valid relations`,t);break}default:a("allow",`Read operation: ${e}`,t);break}return s()}import{existsSync as cn,appendFileSync as an,statSync as un,renameSync as ln,mkdirSync as pn}from"node:fs";import{join as mn}from"node:path";var dn=102400;function fn(){let t=y();return mn(t,"sequential-thinking.log")}function gn(t){try{cn(t)&&un(t).size>dn&&ln(t,`${t}.old`)}catch{}}function Wt(t){if(!(t.tool_name||"").startsWith("mcp__sequential-thinking__"))return s();let o=t.tool_input.thought||"",n=t.tool_input.thoughtNumber||1,i=t.tool_input.totalThoughts||1,r=t.tool_input.nextThoughtNeeded||!1,c=t.tool_input.isRevision||!1,l=y();try{pn(l,{recursive:!0})}catch{}let p=fn();gn(p);let k=`${new Date().toISOString()} | step=${n}/${i} | revision=${c} | next_needed=${r} | thought_length=${o.length}
`;try{an(p,k)}catch{}return n===1?(a("allow",`Starting reasoning chain (${i} estimated thoughts)`,t),u("sequential-thinking-auto",`Starting chain: ${i} thoughts`)):c?(a("allow",`Revision at step ${n}`,t),u("sequential-thinking-auto",`Revision at step ${n}`)):r?(a("allow",`Reasoning step ${n}/${i}`,t),u("sequential-thinking-auto",`Step ${n}/${i}`)):(a("allow",`Completed reasoning chain at step ${n}`,t),u("sequential-thinking-auto",`Completed at step ${n}`)),s()}import{existsSync as hn}from"node:fs";import{extname as kn}from"node:path";function yn(){return new Date().toISOString().split("T")[0]}function Sn(t,e){let o=yn();switch(t.toLowerCase()){case"py":return`# Generated by OrchestKit Claude Plugin
# Created: ${o}

${e}`;case"js":case"ts":return`// Generated by OrchestKit Claude Plugin
// Created: ${o}

${e}`;case"sh":{if(e.startsWith("#!/")){let n=e.indexOf(`
`),i=e.slice(0,n),r=e.slice(n+1);return`${i}
# Generated by OrchestKit Claude Plugin
# Created: ${o}

${r}`}return`#!/bin/bash
# Generated by OrchestKit Claude Plugin
# Created: ${o}

${e}`}case"sql":return`-- Generated by OrchestKit Claude Plugin
-- Created: ${o}

${e}`;case"html":case"xml":return`<!-- Generated by OrchestKit Claude Plugin - ${o} -->

${e}`;case"css":case"scss":case"sass":return`/* Generated by OrchestKit Claude Plugin - ${o} */

${e}`;case"yaml":case"yml":return`# Generated by OrchestKit Claude Plugin
# Created: ${o}

${e}`;case"json":return e;default:return e}}function Bt(t){let e=t.tool_name||"",o=t.tool_input.file_path||"",n=t.tool_input.content||"";if(e!=="Write")return s();if(hn(o))return s();let i=kn(o).replace(".","");return n.includes("OrchestKit")?(u("write-headers",`Skipping header for ${o} (already has OrchestKit marker)`),s()):(Sn(i,n)!==n&&u("write-headers",`Added header to ${o}`),{continue:!0,suppressOutput:!0,hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"allow"}})}import{existsSync as $n,appendFileSync as xn,mkdirSync as _n}from"node:fs";import{join as Ut,dirname as bn,basename as wn}from"node:path";function Hn(t){try{$n(t)||_n(t,{recursive:!0})}catch{}}function qt(t,e){try{Hn(bn(t)),xn(t,e)}catch{}}function Vt(t){let e=t.tool_input.skill||"",o=t.tool_input.args||"",n=t.project_dir||m();if(!e)return s();u("skill-tracker",`Skill invocation: ${e}${o?` (args: ${o})`:""}`);let i=Ut(n,".claude","logs","skill-usage.log"),r=new Date().toISOString();qt(i,`${r} | ${e} | ${o||"no args"}
`);let c=Ut(n,".claude","logs","skill-analytics.jsonl"),l=JSON.stringify({skill:e,args:o||"",timestamp:r,project:wn(n),phase:"start"});return qt(c,l+`
`),u("skill-tracker",`Skill usage logged for ${e}`),s()}var zt={"pretool/bash/dangerous-command-blocker":Z,"pretool/bash/git-branch-protection":Q,"pretool/bash/git-commit-message-validator":Y,"pretool/bash/git-branch-naming-validator":X,"pretool/bash/git-atomic-commit-checker":tt,"pretool/bash/compound-command-validator":et,"pretool/bash/default-timeout-setter":nt,"pretool/bash/error-pattern-warner":rt,"pretool/bash/conflict-predictor":st,"pretool/bash/affected-tests-finder":ct,"pretool/bash/ci-simulation":at,"pretool/bash/pre-commit-simulation":ut,"pretool/bash/pr-merge-gate":lt,"pretool/bash/changelog-generator":pt,"pretool/bash/version-sync":gt,"pretool/bash/license-compliance":ht,"pretool/bash/gh-issue-creation-guide":yt,"pretool/bash/issue-docs-requirement":St,"pretool/bash/multi-instance-quality-gate":_t,"pretool/bash/agent-browser-safety":bt,"pretool/write-edit/file-guard":wt,"pretool/write-edit/file-lock-check":It,"pretool/write-edit/multi-instance-lock":Ct,"pretool/Write/architecture-change-detector":Dt,"pretool/Write/code-quality-gate":Et,"pretool/Write/docstring-enforcer":Tt,"pretool/Write/security-pattern-validator":At,"pretool/mcp/context7-tracker":Ot,"pretool/mcp/memory-fabric-init":Gt,"pretool/mcp/memory-validator":Mt,"pretool/mcp/sequential-thinking-auto":Wt,"pretool/input-mod/write-headers":Bt,"pretool/skill/skill-tracker":Vt};function zs(t){return zt[t]}function Ks(){return Object.keys(zt)}export{Zn as createGuard,Gn as escapeRegex,ee as extractIssueNumber,v as getCurrentBranch,zn as getDefaultBranch,Fn as getField,D as getGitStatus,zs as getHook,y as getLogDir,En as getPluginRoot,m as getProjectDir,Un as getRepoRoot,w as getSessionId,tr as guardBash,_ as guardCodeFiles,j as guardFileExtension,or as guardGitCommand,nr as guardMultiInstance,er as guardNontrivialBash,z as guardPathPattern,Qn as guardPythonFiles,C as guardSkipInternal,Xn as guardTestFiles,K as guardTool,Yn as guardTypescriptFiles,J as guardWriteEdit,Vn as hasUncommittedChanges,zt as hooks,In as isBashInput,vn as isEditInput,qn as isGitRepo,P as isProtectedBranch,Pn as isReadInput,Cn as isWriteInput,Ks as listHooks,u as logHook,a as logPermissionFeedback,I as normalizeCommand,d as outputAllowWithContext,An as outputBlock,g as outputDeny,On as outputError,Ln as outputPromptContext,Tn as outputSilentAllow,s as outputSilentSuccess,H as outputWarning,f as outputWithContext,Nn as readHookInput,b as runGuards,V as validateBranchName};
//# sourceMappingURL=pretool.mjs.map
