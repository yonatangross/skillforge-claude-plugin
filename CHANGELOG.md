# Changelog

All notable changes to the SkillForge Claude Code Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0 (2026-01-16)


### ⚠ BREAKING CHANGES

* **skills:** Skills moved from category-based to flat structure
* **structure:** Skill paths changed from nested to flat-category structure
* **hooks:** Plugin directory structure changed

### Features

* Add /skillforge:configure command and bundle system ([97250ad](https://github.com/yonatangross/skillforge-claude-plugin/commit/97250ad2bcb27697bdfe1aeb7692f9fa2772ebd4))
* Add 5 new skills and update .claude directory ([cf6ff11](https://github.com/yonatangross/skillforge-claude-plugin/commit/cf6ff11d95270c500c7a9ad17afcd448cf48ce89))
* Add 5 new skills and update .claude directory ([ae48573](https://github.com/yonatangross/skillforge-claude-plugin/commit/ae485739d78662849ae76cd426591aaa3ffa2cdc))
* Add 6 new retrieval/AI skills and enhance existing skills ([8284744](https://github.com/yonatangross/skillforge-claude-plugin/commit/82847446bec79ac6d2225289c7919ee26eb76ae8))
* Add 6 product thinking agents and pipeline workflow ([5a99396](https://github.com/yonatangross/skillforge-claude-plugin/commit/5a993967f859f54605643cebb08456d34572db59))
* Add 6 product thinking agents and pipeline workflow ([5c325b3](https://github.com/yonatangross/skillforge-claude-plugin/commit/5c325b36221d57eecf3097c645fcd7772b3ae5fd))
* Add 7 backend skills with complete subdirectories (v4.4.1) ([48d606e](https://github.com/yonatangross/skillforge-claude-plugin/commit/48d606e5e08a6dfa13930863b83c7541a626db25))
* Add agent lifecycle hooks for multi-Claude coordination ([eab2465](https://github.com/yonatangross/skillforge-claude-plugin/commit/eab2465b1db5544c2cff974026891a1dbb8cf9a7))
* Add CC 2.1.2 support and 138 new hook tests ([3e3cbb5](https://github.com/yonatangross/skillforge-claude-plugin/commit/3e3cbb5c8ccc4dbf216065e5a1091af1784540bc))
* Add colored ANSI output to all hook dispatchers ([a8d2cdc](https://github.com/yonatangross/skillforge-claude-plugin/commit/a8d2cdc747e636bfe7e790e54bc4f4c9461608c6))
* Add comprehensive CI/CD and cleanup AI slop (v4.6.1) ([6d72011](https://github.com/yonatangross/skillforge-claude-plugin/commit/6d720115368e8c70bf07bf66c16679145870df94))
* Add comprehensive security testing framework (v4.5.1) ([3d3e41a](https://github.com/yonatangross/skillforge-claude-plugin/commit/3d3e41abce06607e426829c7fc3f28206c6ad083))
* Add comprehensive skill, MCP, task hook tests ([9446fe5](https://github.com/yonatangross/skillforge-claude-plugin/commit/9446fe503b21d76714a37ebcdbca24a0be45fdc8))
* Add dispatchers for consolidated hook output ([7cf8747](https://github.com/yonatangross/skillforge-claude-plugin/commit/7cf874741b938cf96f96393daa8d679de1ab1af6))
* Add git/GitHub workflow skills and enforcement hooks ([d7f6378](https://github.com/yonatangross/skillforge-claude-plugin/commit/d7f6378ca9aefbbeadc56cb6629acadc9f9da931))
* Add git/GitHub workflow skills and enforcement hooks ([eaa9fef](https://github.com/yonatangross/skillforge-claude-plugin/commit/eaa9fefe60e649b818a436a4ec3f9891106ea9f2))
* Add marketplace plugin registry (v4.4.0) ([4fc3ed8](https://github.com/yonatangross/skillforge-claude-plugin/commit/4fc3ed8fce8c25c003f3a69d40fd67fcfff802f5))
* Add marketplace plugin registry for installable bundles ([33bfd83](https://github.com/yonatangross/skillforge-claude-plugin/commit/33bfd83d20fded90012cb792c3302e3aaef7c6c4))
* Add Motion animations and i18n date patterns (v4.4.0) ([2bd6f89](https://github.com/yonatangross/skillforge-claude-plugin/commit/2bd6f8939586de71a768a1f0b144d00edbf3fe18))
* Add Motion animations and i18n date patterns (v4.4.0) ([6435972](https://github.com/yonatangross/skillforge-claude-plugin/commit/64359721ebd53404369527132e1e60b649c5d571))
* Add multi-worktree coordination system (v4.6.0) ([8176619](https://github.com/yonatangross/skillforge-claude-plugin/commit/8176619d1968932397cc40f97926f222106c4e1d))
* Add testing framework improvements for 9/10 quality score ([9204380](https://github.com/yonatangross/skillforge-claude-plugin/commit/9204380c74485638a1b98aa2356fd9c6c11003b4))
* **analytics:** implement optional anonymous analytics ([#59](https://github.com/yonatangross/skillforge-claude-plugin/issues/59)) ([f12904f](https://github.com/yonatangross/skillforge-claude-plugin/commit/f12904f153e435c3af6a69b181fb999c768477f8))
* CC 2.1.4 full overhaul - version 4.7.0 ([#30](https://github.com/yonatangross/skillforge-claude-plugin/issues/30)) ([db3f9ad](https://github.com/yonatangross/skillforge-claude-plugin/commit/db3f9ad504b4edfcf0c8b05e11e907f6d8f05d78))
* **cc217:** implement CC 2.1.7 compatibility improvements ([#38](https://github.com/yonatangross/skillforge-claude-plugin/issues/38)) ([fb4f8c5](https://github.com/yonatangross/skillforge-claude-plugin/commit/fb4f8c5a07974d9e3e3886ff2c80956c0db51efd))
* comprehensive plugin improvements ([#60](https://github.com/yonatangross/skillforge-claude-plugin/issues/60), [#62](https://github.com/yonatangross/skillforge-claude-plugin/issues/62), [#63](https://github.com/yonatangross/skillforge-claude-plugin/issues/63), [#64](https://github.com/yonatangross/skillforge-claude-plugin/issues/64)) ([a0e2e20](https://github.com/yonatangross/skillforge-claude-plugin/commit/a0e2e205fa3376cebffd2615b9e2c4eef83be165))
* **feedback+memory:** implement Phase 1 core libraries and tests ([ca95e2b](https://github.com/yonatangross/skillforge-claude-plugin/commit/ca95e2bf6cb5c2b0f40ac1b30adeeb2af3eecee5))
* **feedback:** implement agent performance tracking ([#55](https://github.com/yonatangross/skillforge-claude-plugin/issues/55)) ([7e4584d](https://github.com/yonatangross/skillforge-claude-plugin/commit/7e4584ddaff81dda1a740c3c0590e238ca43495e))
* **feedback:** implement cross-project pattern sync ([#48](https://github.com/yonatangross/skillforge-claude-plugin/issues/48)) ([aa30070](https://github.com/yonatangross/skillforge-claude-plugin/commit/aa300705c5c545e7a52eb87743e4899e455f2dca))
* **feedback:** implement Phase 4 skill usage analytics ([#56](https://github.com/yonatangross/skillforge-claude-plugin/issues/56)) ([e248676](https://github.com/yonatangross/skillforge-claude-plugin/commit/e2486761a6c1e90a605434129f078cdb588c4b6d))
* **feedback:** implement satisfaction detection ([#57](https://github.com/yonatangross/skillforge-claude-plugin/issues/57)) ([d1bffbb](https://github.com/yonatangross/skillforge-claude-plugin/commit/d1bffbb73f2dcc20a3026e3dd7c141de15d17feb))
* **feedback:** implement skill evolution system ([#58](https://github.com/yonatangross/skillforge-claude-plugin/issues/58)) ([6ec8255](https://github.com/yonatangross/skillforge-claude-plugin/commit/6ec82559d478332f2aa10ab8e45427a29e5d749a))
* Initial release of SkillForge Claude Plugin v1.0.0 ([910e763](https://github.com/yonatangross/skillforge-claude-plugin/commit/910e7632b13623ddf35be037746f9bf56f2bd204))
* **mem0:** enhance mem0 integration with agent skills and new hooks ([1341757](https://github.com/yonatangross/skillforge-claude-plugin/commit/1341757d1dda00b665fa6de429010320dba2ad0b))
* **mem0:** implement decision sync with mem0 cloud ([#47](https://github.com/yonatangross/skillforge-claude-plugin/issues/47)) ([723b119](https://github.com/yonatangross/skillforge-claude-plugin/commit/723b1197af61524485fd3a4adc1bbcd8ed360808))
* **mem0:** implement Phase 2 agent memory hooks ([#44](https://github.com/yonatangross/skillforge-claude-plugin/issues/44), [#45](https://github.com/yonatangross/skillforge-claude-plugin/issues/45)) ([d2e87f6](https://github.com/yonatangross/skillforge-claude-plugin/commit/d2e87f661b55515874f352ada70ed652b3d8ca30))
* **mem0:** implement Phase 3 session memory hooks ([#46](https://github.com/yonatangross/skillforge-claude-plugin/issues/46), [#47](https://github.com/yonatangross/skillforge-claude-plugin/issues/47)) ([ee1e536](https://github.com/yonatangross/skillforge-claude-plugin/commit/ee1e53680340209fb964c05d9fbdb3ad8a03d568))
* Migrate 72 skills to slim Tier 1 format with 75% token reduction ([2ab19c0](https://github.com/yonatangross/skillforge-claude-plugin/commit/2ab19c08461420b628e86d47ba9c71c96652016f))
* Rename plugin to skf + silent hooks + version automation ([#25](https://github.com/yonatangross/skillforge-claude-plugin/issues/25)) ([aec0179](https://github.com/yonatangross/skillforge-claude-plugin/commit/aec0179a8dbe606ec9f11c15ebda14ee974f4cac))
* SkillForge v4.6.3 - New Retrieval Skills & Tier 3 References ([24a0d2f](https://github.com/yonatangross/skillforge-claude-plugin/commit/24a0d2f7666a83d6eff0cc89b789ba79d6ceb655))
* **skills:** CC 2.1.7 skills migration - flat structure ([46a25b2](https://github.com/yonatangross/skillforge-claude-plugin/commit/46a25b20fc866b4072436565ebb9e21b668484e3))
* Update .claude skills to PostgreSQL 18 ([cfd66ae](https://github.com/yonatangross/skillforge-claude-plugin/commit/cfd66ae90fd0f0305b679b09a29cc792fdbb4b51))
* Update .claude skills to PostgreSQL 18 ([d122e93](https://github.com/yonatangross/skillforge-claude-plugin/commit/d122e9311b4aca4e41e317749d031af00f9b7e6c))
* Update logo and sync .claude from skillforge ([46c6151](https://github.com/yonatangross/skillforge-claude-plugin/commit/46c6151e2429880055ab42be030e8ce7492f9982))
* Update plugin.json with new agents and hooks ([6707604](https://github.com/yonatangross/skillforge-claude-plugin/commit/67076041a82c7594b30d79a8a107deac16762dca))
* v4.4.0 - Frontend updates + 7 backend skills with full subdirectories ([3c1ac90](https://github.com/yonatangross/skillforge-claude-plugin/commit/3c1ac906b58b703462cbea168a8cde7094a3782d))
* v4.5.0 - Complete Claude Code 2.1.1 feature utilization ([f0288b5](https://github.com/yonatangross/skillforge-claude-plugin/commit/f0288b531d3d99e6488a3c5324a7d7d21d519e32))


### Bug Fixes

* **#68:** Add commands/ directory for autocomplete support ([#69](https://github.com/yonatangross/skillforge-claude-plugin/issues/69)) ([9221ee9](https://github.com/yonatangross/skillforge-claude-plugin/commit/9221ee93be7e9aa2256730bf41cc3fb68ec444b8))
* Add CC 2.1.1 spec compliance to all hook outputs ([4f7c783](https://github.com/yonatangross/skillforge-claude-plugin/commit/4f7c78364f50c2e754308f010b2a66e5d425efb4))
* Add required current_task field to session state template ([3433ea0](https://github.com/yonatangross/skillforge-claude-plugin/commit/3433ea04b3d2a0a10ece7fb25e9b0a56ebaec033))
* **agents:** correct model and context mode misconfigurations ([#39](https://github.com/yonatangross/skillforge-claude-plugin/issues/39)) ([07657da](https://github.com/yonatangross/skillforge-claude-plugin/commit/07657da87ceeae5e74a03111b77f004714fc9a99))
* Align marketplace.json with Claude Code schema ([#22](https://github.com/yonatangross/skillforge-claude-plugin/issues/22)) ([c61b530](https://github.com/yonatangross/skillforge-claude-plugin/commit/c61b530615f629f06954cc81ef141091a660445a))
* Align plugin.json with Claude Code schema ([#23](https://github.com/yonatangross/skillforge-claude-plugin/issues/23)) ([045717e](https://github.com/yonatangross/skillforge-claude-plugin/commit/045717ec2e47d1be817047081e7b226fd4261cc1))
* **ci:** comprehensive test coverage and CC 2.1.7 path fixes [v4.15.2] ([924e98e](https://github.com/yonatangross/skillforge-claude-plugin/commit/924e98e48a44e712dcb6ff1c866495ad402eead6))
* Complete skill validation and handoff system fixes ([2b830ee](https://github.com/yonatangross/skillforge-claude-plugin/commit/2b830ee32b180d653cbb95c9edd251196f70340e))
* Config system validation and test coverage ([e9213c7](https://github.com/yonatangross/skillforge-claude-plugin/commit/e9213c786e887edebd2798209b76cc90aa5cee16))
* Coordination hook JSON output + dynamic component counting ([#20](https://github.com/yonatangross/skillforge-claude-plugin/issues/20)) ([999939c](https://github.com/yonatangross/skillforge-claude-plugin/commit/999939c1684185536c2a16e8d6fc99f022dd5c97))
* Correct hooks count from 92 to 90 ([#18](https://github.com/yonatangross/skillforge-claude-plugin/issues/18)) ([17c7d65](https://github.com/yonatangross/skillforge-claude-plugin/commit/17c7d659a1db1b29f10698fcc074af0525613218))
* Correct security test filename in CI workflow ([ab9bfe3](https://github.com/yonatangross/skillforge-claude-plugin/commit/ab9bfe3020a829e88dc0fd5d4a2063254795887b))
* Full CC 2.1.1 and schema compliance validation ([f2c188e](https://github.com/yonatangross/skillforge-claude-plugin/commit/f2c188ec3b0bfdd4b1f2a385953d76dc5a16f632))
* **hooks:** CC 2.1.7 compliance - remove ANSI from JSON output ([8119495](https://github.com/yonatangross/skillforge-claude-plugin/commit/81194952ad60b158b921ac72e46dec6df74076cd))
* **hooks:** CC 2.1.7 compliance and comprehensive test suite ([78bded2](https://github.com/yonatangross/skillforge-claude-plugin/commit/78bded2e7426e7f1e56746324ca492422e275b61))
* **hooks:** update hooks to CC 2.1.7 output format ([1091895](https://github.com/yonatangross/skillforge-claude-plugin/commit/10918950fe5842d9d40697e9a37615f8a60ee702))
* Make all pretool hooks CC 2.1.2 compliant ([b72fd0d](https://github.com/yonatangross/skillforge-claude-plugin/commit/b72fd0dc3280dfec0069045b38108d0d693aca6d))
* Make hooks silent on success, only show errors/warnings ([#24](https://github.com/yonatangross/skillforge-claude-plugin/issues/24)) ([5c352e3](https://github.com/yonatangross/skillforge-claude-plugin/commit/5c352e3310e13a6f96edea8105fe96d2b443cb90))
* Marketplace schema compatibility + cleanup runtime artifacts ([#21](https://github.com/yonatangross/skillforge-claude-plugin/issues/21)) ([dbf16c0](https://github.com/yonatangross/skillforge-claude-plugin/commit/dbf16c0036f69e182c72b612d671dbf0a28c7762))
* **paths:** complete migration to flat skill structure ([8f12814](https://github.com/yonatangross/skillforge-claude-plugin/commit/8f1281487402ececafb2399f8c759e49c03243a9))
* Remove invalid 'engines' field from plugin manifest ([00221e4](https://github.com/yonatangross/skillforge-claude-plugin/commit/00221e42931cab9e40d370a1e7f6c9cb15cf5dea))
* Remove template literals from skills + enforce version/changelog in CI ([#27](https://github.com/yonatangross/skillforge-claude-plugin/issues/27)) ([05129a3](https://github.com/yonatangross/skillforge-claude-plugin/commit/05129a37f0ecdf484c1eed866f9a747341a39ed3))
* Resolve hook stdin caching and JSON field name issues ([c22cfca](https://github.com/yonatangross/skillforge-claude-plugin/commit/c22cfca747a1d6bd0848fb7159890856117dfefc))
* Resolve skill/subagent test failures and hook errors for v4.6.2 ([40646cf](https://github.com/yonatangross/skillforge-claude-plugin/commit/40646cfe7621f0f99f4e446d86f057b104f537ba))
* resolve startup hook errors and test failures ([#37](https://github.com/yonatangross/skillforge-claude-plugin/issues/37)) ([ba5112a](https://github.com/yonatangross/skillforge-claude-plugin/commit/ba5112a1d4de05765b05cf1925fa46498a88b7db))
* **structure:** move skills to root level per CC plugin standard ([16593a2](https://github.com/yonatangross/skillforge-claude-plugin/commit/16593a2761a73e6c77cfad1ad165055d1d808635))
* Sync marketplace.json version to 4.17.2 ([4e29f1b](https://github.com/yonatangross/skillforge-claude-plugin/commit/4e29f1b122d6df65b49765816efb6be23e81b9f1))
* Sync plugin.json with actual .claude structure ([57a0bd1](https://github.com/yonatangross/skillforge-claude-plugin/commit/57a0bd1c67f787f1cef9671eecc9b9b9d4245018))
* Sync plugin.json with actual .claude structure ([204d4f5](https://github.com/yonatangross/skillforge-claude-plugin/commit/204d4f558b795bac20bef02b7b6260f4c63163ee))
* **tests:** fix syntax error in test-agent-required-hooks.sh ([#65](https://github.com/yonatangross/skillforge-claude-plugin/issues/65)) ([fbfd5af](https://github.com/yonatangross/skillforge-claude-plugin/commit/fbfd5afa0449c81a6bc1d49881b6eeaf9f3fbb14))
* **tests:** resolve Feedback System Tests infrastructure issues ([d5f3899](https://github.com/yonatangross/skillforge-claude-plugin/commit/d5f3899400026b403910f0df7260393c88839653))
* **tests:** resolve pre-existing test failures ([aef5823](https://github.com/yonatangross/skillforge-claude-plugin/commit/aef5823070255aaa200b031793629d0e092a7881))
* Update all references from CC 2.1.1 to CC 2.1.2 ([cd98b1f](https://github.com/yonatangross/skillforge-claude-plugin/commit/cd98b1f17be7525db1444946d7cc44f42932ad9c))
* Update component counts to match actual v4.6.3 ([#17](https://github.com/yonatangross/skillforge-claude-plugin/issues/17)) ([49c64a9](https://github.com/yonatangross/skillforge-claude-plugin/commit/49c64a9dae4f7f8988791aded3dfb57d4b85c870))
* Update README naming and fix hooks count in about ([#26](https://github.com/yonatangross/skillforge-claude-plugin/issues/26)) ([02a020c](https://github.com/yonatangross/skillforge-claude-plugin/commit/02a020c864db36f87bf60e81b9d1f2aa577343bd))
* use ${CLAUDE_PLUGIN_ROOT} for plugin installation compatibility ([#34](https://github.com/yonatangross/skillforge-claude-plugin/issues/34)) ([d78ea55](https://github.com/yonatangross/skillforge-claude-plugin/commit/d78ea55742b373724e61eca3b94f3b30371f35a8))
* Version consistency and missing metadata (v4.4.1) ([500a1bd](https://github.com/yonatangross/skillforge-claude-plugin/commit/500a1bd3a76d0eed5b5069ef2aa4f9c43b46ed58))


### Performance Improvements

* **hooks:** optimize SessionStart and PromptSubmit latency ([09fb786](https://github.com/yonatangross/skillforge-claude-plugin/commit/09fb78631e09d011518f57e89ea9ee23eedab961))
* **hooks:** parallelize all major dispatchers for 2-3x faster execution ([d4097b5](https://github.com/yonatangross/skillforge-claude-plugin/commit/d4097b58c94a3f1f05847d03ea73f21007120229))


### Code Refactoring

* **hooks:** consolidate to 24 hooks + v4.11.0 ([#36](https://github.com/yonatangross/skillforge-claude-plugin/issues/36)) ([e844b4b](https://github.com/yonatangross/skillforge-claude-plugin/commit/e844b4b25d0da25b3cd635d5573690a05ec0a2d9))
* **structure:** CC 2.1.7 compliance - flatten skills, remove redundant context ([99bd80d](https://github.com/yonatangross/skillforge-claude-plugin/commit/99bd80d3228b9c21abc97064fccccf75e7bb0d25))

## [4.18.0] - 2026-01-16

### Added

- **6 Git/GitHub Workflow Skills**
  - `milestone-management`: gh api patterns for milestone CRUD (no native gh CLI support)
  - `atomic-commits`: Small, focused commits with `git add -p` and interactive staging
  - `branch-strategy`: GitHub Flow + feature flags for trunk-based development
  - `stacked-prs`: Multi-PR development for large features with rebase management
  - `release-management`: `gh release` + semantic versioning workflows
  - `git-recovery`: Reflog, undo patterns, safe recovery from mistakes

- **4 Git Enforcement Hooks** (CC 2.1.9 additionalContext)
  - `git-commit-message-validator.sh`: **BLOCKS** invalid conventional commits
  - `git-branch-naming-validator.sh`: **WARNS** on non-standard branch names
  - `git-atomic-commit-checker.sh`: **WARNS** on commits >10 files or >400 lines
  - `gh-issue-creation-guide.sh`: **INJECTS** checklist context before `gh issue create`

- **GitHub CLI Skill Enrichment**
  - `checklists/issue-creation-checklist.md`: Pre-creation verification workflow
  - `checklists/labeling-guide.md`: Label categories, validation, audit queries
  - `references/issue-templates.md`: Ready-to-use templates for bugs, features, tasks
  - `templates/issue-scripts.sh`: Automation with duplicate checks

- **CI Improvements**
  - `bin/ci-setup.sh`: Centralized CI environment setup script
  - Removes unreliable third-party repos (Microsoft, Azure CLI) before `apt-get update`
  - Cross-platform support (Ubuntu/macOS)

- **Tests**
  - `tests/unit/test-git-enforcement-hooks.sh`: 28 tests for all new hooks and skills

### Fixed

- **CI 403 Errors**: Removed unused Microsoft/Azure package repos that cause intermittent failures
- **Test 5 in test-context-deferral.sh**: Updated to check CLAUDE.md for CC version requirement (engines field was removed from plugin.json)

### Changed

- Skills count: 97 → 103 (added 6 git/GitHub skills)
- Hooks count: 105 → 109 (added 4 enforcement hooks)
- All CI jobs now use centralized `./bin/ci-setup.sh` instead of inline apt-get

---

## [4.17.2] - 2026-01-16

### Fixed

- **Commands Autocomplete**: Added `commands/` directory with 17 command files to enable autocomplete for `/skf:*` commands (#68)
  - Commands now appear in Claude Code autocomplete when typing `/skf:`
  - Each command file has YAML frontmatter (`description`, `allowed-tools`) and references corresponding skill

### Added

- **Test Coverage**: New `tests/commands/test-commands-structure.sh` validates commands directory structure
- **CI Integration**: Commands validation added to `run-all-tests.sh`

### Technical Details

- Claude Code has two systems for slash commands:
  1. `commands/` directory - Shows in autocomplete
  2. `skills/*/SKILL.md` with `user-invocable: true` - Works via Skill tool
- Previously only using skills system; now both systems are connected

---

## [4.17.1] - 2026-01-16

### Changed

- **README.md**: Updated "What's New" section to v4.17.0 with CC 2.1.9 features
- **Documentation**: Added user-invocable skills breakdown (17 commands, 80 internal)
- **Version Alignment**: All version references now consistently at 4.17.x

---


## [4.17.0] - 2026-01-16

### Added

**CC 2.1.3 User-Invocable Skills**
- Added `user-invocable: true` to 17 command skills (commit, review-pr, explore, implement, verify, configure, doctor, feedback, recall, remember, add-golden, skill-evolution, claude-hud, create-pr, fix-issue, brainstorming, worktree-coordination)
- Added `user-invocable: false` to 80 internal knowledge skills
- Only user-invocable skills appear in `/skf:*` slash command menu

**Test Coverage**
- New Test 10 in `tests/skills/structure/test-skill-md.sh`: validates user-invocable field presence and counts (17 commands, 80 internal)

### Changed

- Updated plugin.json description to clarify "97 skills (17 user-invocable commands, 80 internal knowledge)"
- Updated CLAUDE.md to reflect 17 user-invocable skills (was 12)
- Updated bin/validate-counts.sh comments for accuracy
- Version bumped: 4.16.0 → 4.17.0

---

## [4.16.0] - 2026-01-16

### Added

**CC 2.1.9 Integration**
- New helper functions in `hooks/_lib/common.sh`: `output_with_context()`, `output_allow_with_context()`, `output_allow_with_context_logged()`
- New session ID helpers: `get_session_state_dir()`, `get_session_temp_file()`, `ensure_session_temp_dir()`
- PreToolUse `additionalContext` support for injecting guidance before tool execution
- `plansDirectory` setting in `.claude/defaults/config.json`
- `auto:N` MCP thresholds in `.claude/templates/mcp-enabled.json` (context7:75, sequential-thinking:60, mem0:80, memory:70, playwright:50)

**Hook Updates with additionalContext**
- `git-branch-protection.sh` - Injects branch context before git commands
- `error-pattern-warner.sh` - Injects learned error patterns
- `context7-tracker.sh` - Injects cache state
- `architecture-change-detector.sh` - Injects affected patterns

### Changed

- Engine requirement updated to `>=2.1.9`
- Removed session ID fallback patterns (`:-default`, `:-unknown`) for CC 2.1.9 compliance
- Updated `test-context-system.sh` to set `CLAUDE_SESSION_ID` for hook testing
- Version bumped: 4.15.3 → 4.16.0

### Fixed

- Version consistency across marketplace.json, identity.json, plugin.json

---

## [4.15.3] - 2026-01-15

### Fixed

**CI/CD Test Compatibility**
- Fixed bash arithmetic `((VAR++))` exit issue with `set -e` across 30+ test files
- Added `|| true` to arithmetic operations that return 0 on first call
- Fixed coordination.sh paths in 4 hooks (missing `.claude/` prefix)
- Added cross-platform timeout wrapper for macOS compatibility (timeout/gtimeout/direct)
- Fixed file-lock-release.sh double JSON output (trap + exit race condition)

**Hook JSON Output**
- Added clean_exit helper pattern to prevent trap/output duplication
- Ensured all coordination hooks properly clear trap before normal exits

### Changed
- Updated test-hook-json-output.sh with run_with_timeout helper function

---

## [4.15.1] - 2026-01-15

### Added

**Enhanced Mem0 Integration**
- Added `remember` and `recall` skills to all 20 agents for automatic mem0 capability injection
- New hook: `hooks/stop/auto-remember-continuity.sh` - Prompts storing session context at session end
- New hook: `hooks/prompt/antipattern-detector.sh` - Suggests checking mem0 for known failures before implementing patterns
- New test file: `tests/unit/test-mem0-prompt-hooks.sh` - Tests for new mem0 hooks and agent skill integration

### Fixed

**Context Bloat**
- Reset session state from 774 lines to 13 lines (~500+ tokens saved per session)
- Cleaned accumulated handoff and verification-queue files

**Version Synchronization**
- Synced `identity.json` version to match `plugin.json` (both now 4.15.1)

**Documentation Accuracy**
- Fixed hook count in plugin description (103 → 81 actual registered hooks)

### Changed
- Bumped version to 4.15.1

---

## [4.11.1] - 2026-01-14

### Fixed

**Startup Hook Errors**
- Fixed CLAUDE_PROJECT_DIR unbound variable errors in 5 hooks by adding fallback to `$(pwd)`
- Affected hooks: `session-context-loader.sh`, `session-env-setup.sh`, `common.sh`, `auto-approve-project-writes.sh`, `git-branch-protection.sh`

**Test Suite Fixes**
- Fixed `test-skill-discovery.sh` unbound `skill_dir` variable
- Updated `test-agent-definitions.sh` to support CC 2.1.6 nested skills structure and YAML list parsing
- Updated `test-plugin-installation.sh` for CC 2.1.6 structure (directories instead of symlinks)

**Context & Skills**
- Added `$schema` field to `.claude/context/session/state.json`
- Fixed `claude-hud` skill: added "When to Use" section, converted capabilities to slim format (under 350 token budget)
- Synced version to 4.11.1 across all manifests

**Agent Configuration Issues (#39)**
- Changed `model: haiku` → `model: sonnet` for 4 agents requiring deeper reasoning:
  - `security-layer-auditor` (8-layer defense audit)
  - `security-auditor` (CVE analysis, OWASP validation)
  - `ux-researcher` (personas, journey mapping)
  - `rapid-ui-designer` (WCAG analysis, design specs)
- Added explicit `context:` mode to all 20 agents (was defaulting silently):
  - 17 agents: `context: fork` (complex operations)
  - 3 agents: `context: inherit` (lightweight utilities: requirements-translator, prioritization-analyst, market-intelligence)
- Added missing `handoff-preparer.sh` hook to 10 agents

### Added

**Agent & Skill CI Tests**
- New test suite: `tests/agents/`
  - `test-agent-model-selection.sh` - Validates appropriate model for task complexity
  - `test-agent-context-modes.sh` - Ensures explicit context declaration
  - `test-agent-required-hooks.sh` - Validates required Stop hooks
  - `test-agent-frontmatter.sh` - CC 2.1.6 compliance check
- New test suite: `tests/skills/`
  - `test-skill-structure.sh` - Validates Tier 1-4 files exist
  - `test-skill-context-modes.sh` - Validates appropriate context modes
  - `test-skill-references.sh` - Validates agent skill references
- Added `agent-skill-tests` job to CI workflow
- Updated CLAUDE.md with new test commands

### Changed
- Test results improved from 7 failing to 0 failing (26 tests pass)

---
## [4.11.0] - 2026-01-13

### Changed

**Hook Consolidation**
- Reduced from 44 to 24 registered hooks using dispatcher pattern (48% reduction)
- Created 3 new dispatchers: agent-dispatcher.sh, skill-dispatcher.sh, session-end-dispatcher.sh
- Fixed all 44 broken hook paths in hooks.json
- Synced plugin.json and hooks.json (both now have 24 registered hooks)

**MCP Updates**
- Added mem0 (cloud semantic memory) alongside Anthropic memory MCP
- Both can be enabled simultaneously for different use cases
- Updated MCP documentation in configure skill references

### Removed
- 9 unused hook files:
  - `pretool/mcp/*.sh` (3 files - MCP tracking not implemented)
  - `pretool/input-mod/bash-defaults.sh` (duplicate of bash-dispatcher)
  - `pretool/input-mod/path-normalizer.sh` (unused)
  - `lifecycle/context-loader.sh` (replaced by session-context-loader.sh)
  - `stop/llm-code-review.sh` (unused)
  - `pretool/Write/file-lock-check.sh` (duplicate)
  - `pretool/Edit/file-lock-check.sh` (duplicate)

---

## [4.8.0] - 2026-01-12

### Changed

**Plugin Architecture Standardization**
- Moved `skills/`, `agents/`, `hooks/` from `.claude/` to root level (official Anthropic standard)
- Removed root-level symlinks - directories are now actual content, not symlinks
- Updated all hook paths in `settings.json` from `/.claude/hooks/` to `/hooks/`
- SkillForge extensions (`context/`, `coordination/`, `settings.json`) remain in `.claude/`

**Path Updates**
- Updated 5 bin/ scripts to use root-level paths
- Updated all test files with new path structure
- Updated documentation (CLAUDE.md, README.md, CONTRIBUTING.md)

### New Structure

```
skillforge-claude-plugin/
├── skills/                  # 90 skills (moved from .claude/skills/)
├── agents/                  # 20 agents (moved from .claude/agents/)
├── hooks/                   # 96 hooks (moved from .claude/hooks/)
├── .claude/
│   ├── settings.json        # Hook configuration
│   ├── context/             # Context Protocol 2.0
│   └── coordination/        # Multi-worktree system
└── ...
```

---


## [4.7.4] - 2026-01-12
### Fixed

**Documentation**
- Fixed plugin installation commands in README.md and CLAUDE.md
  - Removed non-existent tier-specific install commands (`@skillforge/standard`, etc.)
  - Use correct plugin name: `/plugin install skf`
  - Direct users to `/skf:configure` for tier selection after installation

**Skill Version Consistency**
- brainstorming: Fixed version mismatch (1.0.0 → 2.0.0), corrected template path reference
- api-design-framework: Aligned version (1.0.0 → 1.1.0) with changelog
- e2e-testing: Aligned capabilities.json version (1.2.0 → 2.0.0) with SKILL.md
- webapp-testing: Aligned SKILL.md version (1.0.0 → 1.1.0), updated year tag to 2026
- github-cli: Bumped version (1.0.0 → 2.0.0) for upcoming feature additions
- unit-testing: Updated Jest API to Vitest (`jest.clearAllMocks` → `vi.clearAllMocks`)

**CI Workflow**
- Fixed hook path validation in plugin-validation.yml to handle `${CLAUDE_PLUGIN_ROOT}` pattern

---


## [4.7.3] - 2026-01-12

### Fixed

**Plugin Installation Compatibility**
- Fixed hooks not working when installed via `/plugin install` in other repositories
- Changed all hook paths in `settings.json` from `$CLAUDE_PROJECT_DIR` to `${CLAUDE_PLUGIN_ROOT}`
- Updated `common.sh` with `PLUGIN_ROOT` variable that handles both plugin and project-scoped modes
- Restored root-level symlinks (`skills`, `hooks`, `agents`) - **required for plugin discovery**
  - Note: v4.7.1 incorrectly removed these; they ARE needed for `/plugin install` to work
  - Project-scoped installation (copying `.claude/`) still works without symlinks

### Added

**Installation Validation Tests**
- `tests/integration/test-plugin-installation.sh` - Validates plugin structure:
  - Root-level symlinks exist and point to valid directories
  - `settings.json` uses `${CLAUDE_PLUGIN_ROOT}` (not `$CLAUDE_PROJECT_DIR`)
  - Skills are discoverable
  - Hooks are executable
  - Version consistency across manifest files

---

## [4.7.2] - 2026-01-12

**Version Alignment**
- Synchronized version to 4.7.2 across all files (plugin.json, .claude-plugin/, CLAUDE.md, README.md, identity.json)
- Corrected `.claude-plugin/` directory status - retained for Claude Code plugin compatibility
- Updated CC requirement references to 2.1.4 in doctor skill documentation

---

## [4.7.1] - 2026-01-12

### Removed

**Deprecated Files Cleanup**
- `plugin-metadata.json` - 97KB outdated duplicate file
- Root-level symlinks (`agents`, `commands`, `hooks`, `skills`) - canonical paths are inside `.claude/`

### Changed

**Documentation Updates**
- `CONTRIBUTING.md` - rewritten to reflect current architecture:
  - 4-tier progressive skill loading structure
  - CC 2.1.4+ hook JSON output requirements
  - Updated project structure and paths

## [4.7.0] - 2026-01-10

### Added

**Claude Code 2.1.3 Full Overhaul Release**

This release fully leverages Claude Code 2.1.3 features for a comprehensive upgrade.

**New Health Diagnostics Skill**
- `/skf:doctor` - Comprehensive health check command
- Permission rules analysis (unreachable rules detection - CC 2.1.3 feature)
- Hook health validation (executable permissions, dispatcher references)
- Schema compliance checks
- Coordination system integrity verification
- Context budget monitoring

**Quality Gate Hooks (10-Minute Timeout)**
- `full-test-suite.sh` - Runs complete test suite on conversation stop
- `security-scan-aggregator.sh` - Aggregates npm audit, pip-audit, semgrep results
- `llm-code-review.sh` - AI-powered code review for uncommitted changes
- All new hooks use 600,000ms timeout (CC 2.1.3 feature)

**Team Permission Profiles**
- `.claude/permissions/profiles/` - Shareable permission configurations
- `secure.json` - Minimal permissions for solo development
- `team.json` - Standard team permissions
- `enterprise.json` - Strict enterprise permissions
- `/skf:apply-permissions` - Apply profiles to settings.json

**Release Channel Documentation**
- `.claude/docs/release-channels.md` - Stable vs latest channel guidance
- CC version compatibility matrix
- Feature availability by version

### Changed

**Version Requirements**
- Claude Code requirement: `>=2.1.3` (was `>=2.1.2`)
- Plugin version: 4.7.0
- Engine specification added to plugin.json

**Agent Model Optimization**
- Added `model_preference` to all 20 agent definitions
- Complex reasoning agents (workflow-architect, backend-system-architect, system-design-reviewer): opus
- Balanced task agents: sonnet
- Fast routing agents: haiku
- CC 2.1.3 fixes sub-agent model selection

**Documentation Updates**
- README.md: Added CC 2.1.3+ compatibility badge
- CLAUDE.md: Updated version requirements
- Skill count: 79 (added doctor skill)
- Hook count: 93 (added quality gate hooks)

### Deprecated

**Commands Directory**
- 12 commands in `.claude/commands/` now have deprecation notices
- Commands continue to work for backwards compatibility
- Future versions will migrate to unified skills namespace

---

## [4.6.7] - 2026-01-09

### Changed

**MCP Integrations Now Opt-in**
- All MCPs disabled by default in `.mcp.json` (`"disabled": true`)
- Added Step 5 to `/skf:configure` for MCP selection
- Users explicitly choose which MCPs to enable via interactive wizard
- No surprise package downloads on plugin install

**Documentation Updates**
- Updated README MCP section to mark integrations as optional
- Updated CLAUDE.md MCP Integration line
- Added MCP step to README configuration wizard list

---

## [4.6.6] - 2026-01-09

**Skill Template Literal Bash Parsing**
- Fixed 13 SKILL.md files containing JavaScript template literals that caused bash parsing errors
- Replaced backtick template strings with string concatenation to prevent Claude Code Skill tool crashes
- Major refactor of `edge-computing-patterns` skill to reference-based architecture
- Affected skills: api-design-framework, edge-computing-patterns, github-cli, i18n-date-patterns,
  input-validation, llm-streaming, mcp-server-building, motion-animation-patterns,
  observability-monitoring, performance-optimization, react-server-components-framework,
  streaming-api-patterns, type-safety-validation

### Changed

**CI/CD Improvements**
- Enhanced `version-check.yml` to **block** PRs without version bump (was warn-only)
- Added CHANGELOG.md validation - PRs must include changelog entry for new version
- Updated `bump-version.sh` to auto-generate CHANGELOG template entry
- `bump-version.sh` now updates CLAUDE.md version references

---

## [4.6.5] - 2026-01-09

### Changed

**Plugin Namespace Rename**
- Renamed plugin from `skillforge-complete` to `skf` for shorter agent prefixes
- Agents now appear as `skf:debug-investigator` instead of `skillforge-complete:debug-investigator`

**Silent Hooks on Success**
- PreToolUse Task hooks now silent on success (no stderr output)
- Removed `info()` calls, replaced with `log_hook()` for file-only logging
- Warnings only shown for actual issues (context limits, unknown types)

**Improved Agent Discovery**
- Subagent validator now scans `.claude/agents/` directory for valid types
- Handles namespaced agent types (e.g., `skf:agent-name`)

- Updated author email to `yonatan2gross@gmail.com`
- Changed author from "SkillForge Team" to "Yonatan Gross"

---

## [4.6.4] - 2026-01-09

**Marketplace Schema Compatibility**
- Rewrote `.claude-plugin/marketplace.json` to match official Anthropic schema
- Changed `owner` from string to object format `{name, email}`
- Replaced custom `plugins[].skills` array with standard `source` field
- Removed unrecognized fields: `includes_agents`, `includes_commands`, `includes_hooks`
- Removed custom `features`, `installation`, `marketplace_status` sections
- Plugin now validates against `https://anthropic.com/claude-code/marketplace.schema.json`

### Changed

- Simplified marketplace.json to single plugin entry pointing to repo root
- Bundle/tier concept moved to internal plugin.json (not marketplace registry)

---

## [4.6.3] - 2026-01-09

### Added

**6 New Retrieval & AI Skills**
- `hyde-retrieval` - HyDE (Hypothetical Document Embeddings) for vocabulary mismatch resolution
- `query-decomposition` - Multi-concept query handling with parallel retrieval and RRF fusion
- `reranking-patterns` - Cross-encoder and LLM-based reranking for search precision
- `contextual-retrieval` - Anthropic's context-prepending technique for improved RAG
- `langgraph-functional` - New @entrypoint/@task decorator API for modern LangGraph workflows
- `mcp-server-building` - Building MCP servers for Claude extensibility

**Enhanced Existing Skills**
- `embeddings` - Added late chunking, batch API patterns, embedding cache, Matryoshka dimensions
- `rag-retrieval` - Added HyDE integration, agentic RAG, Self-RAG, Corrective RAG (CRAG) patterns

**Subagent Integration**
- `data-pipeline-engineer` agent now uses: hyde-retrieval, query-decomposition, reranking-patterns, contextual-retrieval
- `workflow-architect` agent now uses: langgraph-functional
- `backend-system-architect` agent now uses: mcp-server-building

### Changed

- Skills count increased from 72 to 78
- Updated agent markdown files with new skill references
- All new skills follow slim Tier 1/Tier 2 format with proper schema validation

- capabilities.json files now include required `$schema`, `description`, and `capabilities` fields
- SKILL.md files now include required "When to Use" sections

---

## [4.6.2] - 2026-01-09

### Added

**Claude Code 2.1.2 Support**
- `agent_type` field parsing in `startup-dispatcher.sh`
- Agent-aware context initialization in `session-context-loader.sh`
- Agent type logging to session state in `session-env-setup.sh`

**Comprehensive Hook Tests (138 new tests)**
- `test-lifecycle-hooks.sh` - 57 tests for 7 lifecycle hooks
- `test-file-lock-hooks.sh` - 31 tests for 6 file lock hooks
- `test-permission-posttool-hooks.sh` - 50 tests for 5 hooks (permissions, posttool, input-mod)

### Changed

- Claude Code requirement updated from `>=2.1.0` to `>=2.1.2`
- Migrated deprecated `shared-context.json` → Context 2.0 (`session/state.json`)

- Placeholder values (XXX KB) in `evidence-verification/SKILL.md` now show realistic sizes (245 KB, 18 KB)

---

## [4.6.1] - 2026-01-08

### Added

**Comprehensive CI/CD Pipeline**
- GitHub Actions workflow with 5-stage pipeline (lint → unit → security → integration → performance)
- Matrix testing on Ubuntu and macOS
- Zero tolerance policy for security test failures

**New Test Suites**
- `tests/ci/lint.sh` - Static analysis: JSON validity, shellcheck, schema validation
- `tests/e2e/test-progressive-loading.sh` - Skill discovery and loading validation
- `tests/e2e/test-agent-lifecycle.sh` - Agent spawning and handoff testing
- `tests/e2e/test-coordination-e2e.sh` - Multi-worktree coordination system tests
- `tests/performance/test-token-budget.sh` - Token budget analysis and recommendations
- `tests/security/test-unicode-attacks.sh` - Unicode/homoglyph/BIDI attack prevention
- `tests/security/test-symlink-attacks.sh` - Symlink and TOCTOU attack prevention

**Test Runner v3.0**
- `tests/run-all-tests.sh` updated with all new test categories
- 19 test suites, organized by layer (lint, unit, security, integration, e2e, performance)

### Changed

- Skills count increased from 68 to 72
- Portable shell scripts (macOS + Linux compatibility)

### Removed

**Cleanup of AI Slop Documentation**
- Removed `.claude/archive/` - deprecated systems and docs
- Removed `.claude/docs/` - AI-generated design documents
- Removed `.claude/context/patterns/` - redundant with skills
- Removed `.claude/workflows/` - orphaned markdown files
- Removed 16 redundant instruction files (kept only `context-initialization.md`)
- Removed root slop files: `SECURITY_TEST_INDEX.md`, `HOOK_SECURITY_AUDIT.md`, `SKILL.md`
- Removed `tests/COMPREHENSIVE-TEST-STRATEGY.md` - replaced by actual tests


## [4.5.0] - 2026-01-08

### Added

#### Claude Code 2.1.1 Full Feature Utilization

This release fully leverages Claude Code 2.1.1 capabilities, upgrading the plugin from 6.5/10 to 9.5/10 maturity.

**Engine Requirement**
- Plugin now requires Claude Code `>=2.1.0`

**SubagentStart Hooks** (NEW hook type)
- `subagent-resource-allocator.sh` - Pre-allocates context resources before subagent spawn
- `subagent-context-stager.sh` - Stages relevant context based on task type

**SubagentStop Hooks** (NEW hook type)
- `subagent-completion-tracker.sh` - Tracks subagent completion metrics
- `subagent-quality-gate.sh` - Validates subagent output quality
- `coverage-threshold-gate.sh` - Enforces test coverage thresholds

**Input Modification Hooks** (NEW hook capability)
- `path-normalizer.sh` - Normalizes file paths to absolute paths for Read/Write/Edit/Glob/Grep
- `bash-defaults.sh` - Adds default timeout and prevents dangerous bash commands
- `write-headers.sh` - Adds standard file headers to new files

**Hook Chain Orchestration**
- `chain-config.json` - Centralized configuration for hook sequences
- `chain-executor.sh` - Sequential execution with timeout/retry support
- 4 predefined chains: error_handling, security_validation, test_workflow, code_quality

**Agent-Level Hooks** (all 20 agents)
- `output-validator.sh` - Validates agent output quality and completeness
- `context-publisher.sh` - Publishes agent decisions to shared context
- `handoff-preparer.sh` - Prepares context for next agent in pipeline (10 pipeline agents)

**Skill-Level Hooks** (all 68 skills)
- Testing skills: `test-runner.sh`, `coverage-check.sh`
- Security skills: `security-summary.sh`, `redact-secrets.sh`
- Code review skills: `review-summary-generator.sh`
- Architecture skills: `design-decision-saver.sh`
- Database skills: `migration-validator.sh`
- LLM/AI skills: `eval-metrics-collector.sh`
- Evidence skills: `evidence-collector.sh`

**MCP Tool Annotations**
- Added metadata for 6 tool patterns with safety, cost, and category flags
- Wildcard permission syntax: `mcp__server__*` for bulk tool approval
- Auto-approve and require-confirmation lists
- Fallback configuration for context7 and sequential-thinking
- Notification settings with refresh intervals

**Model Fallback Chains**
- 15+ complex skills now have `model-alternatives` for resilience
- Primary: opus → Fallback: sonnet → Last resort: haiku

**Workflow Auto-Triggers** (all 5 workflows)
- Keyword detection with 0.8 confidence threshold
- Auto-launch capability for matching patterns
- Keywords for: frontend-2025-compliance, api-design-compliance, security-audit-workflow, data-pipeline-workflow, ai-integration-workflow

**Dependency Graph**
- 42 skill-to-agent mappings across 8 domains
- 8 agent pipeline sequences defined:
  - product-thinking: market-intelligence → product-strategist → prioritization-analyst
  - full-stack-feature: requirements → backend → database → frontend → test → review
  - security-audit: security-auditor → code-quality-reviewer
  - ai-integration: llm-integrator → workflow-architect → data-pipeline-engineer
  - database-feature: database-engineer → backend-system-architect
  - ui-feature: rapid-ui-designer → frontend-ui-developer
  - bug-investigation: debug-investigator → test-generator
  - system-review: backend-system-architect → metrics-architect

**Security Manifest**
- Required permissions: read_project, write_project, execute_bash, call_llm
- Denied operations: delete_outside_project, execute_system_commands, network_without_approval
- 11 sensitive file patterns protected (*.env, *.pem, *.key, *credentials*, etc.)

**Tool Restrictions** (8 security-critical skills)
- `security-scanning`: Read, Grep, Glob, Bash (controlled)
- `owasp-top-10`: Read, Grep, Glob (read-only)
- `input-validation`: Read, Grep, Glob, Write, Edit
- `defense-in-depth`: Read, Grep, Glob (read-only)
- `auth-patterns`: Read, Grep, Glob, Write, Edit, Bash (full)
- `golden-dataset-management`: Read, Grep, Glob, Bash
- `golden-dataset-validation`: Read, Grep, Glob (read-only)
- `evidence-verification`: Read, Grep, Glob, Bash

### Changed

- `plugin.json` version bumped to 4.5.0
- Engine requirement updated from `>=1.0.0` to `>=2.1.0`
- All workflows now have `auto_trigger` configuration
- All agents now have Stop hooks for validation and context publishing
- All skills now have PostToolUse and Stop event hooks

- Agent pipeline sequencing now properly chains 10 pipeline agents
- MCP tool permissions now use proper wildcard syntax
- Hook execution order guaranteed through chain orchestration

---

## [4.4.1] - 2026-01-08

#### Version Consistency
- Updated `plugin.json` version from 1.0.0 to 4.4.1
- Updated `marketplace.json` version from 1.0.0 to 4.4.1
- Renamed `motion-animation-patterns/skill.md` to `SKILL.md` for consistency with other skills

#### Missing Metadata
- Added `capabilities.json` for `motion-animation-patterns` skill
- Added `capabilities.json` for `langgraph-human-in-loop` skill

### Added

#### MCP Configuration
- Added `.mcp.json` for MCP project-scope server configuration (Claude Code 2025+ feature)
- Pre-configured servers: context7, sequential-thinking, memory, playwright

---

## [4.4.0] - 2026-01-06

### Added

#### New Skills
- `motion-animation-patterns` - Motion (Framer Motion) animations, page transitions, modal effects, stagger lists, RTL support
- `i18n-date-patterns` - Internationalization, date formatting with dayjs, useFormatting hook, ICU MessageFormat, Trans component

#### Enhanced Skills (expanded with capabilities.json, checklists, examples)
- `e2e-testing` - Full Playwright 1.57+ patterns with AI-assisted test generation
- `auth-patterns` - JWT, OAuth, session management, password security
- `llm-testing` - LLM application testing, mocking, async timeouts
- `embeddings` - Embedding models, chunking strategies, similarity search
- `function-calling` - Tool use patterns for OpenAI, Anthropic, Ollama
- `input-validation` - Zod v4, sanitization, injection prevention
- `msw-mocking` - Mock Service Worker patterns for React testing
- `vcr-http-recording` - VCR.py for Python HTTP recording
- `langgraph-checkpoints` - Fault-tolerant checkpointing and recovery
- `langgraph-state` - State management and persistence
- `langgraph-parallel` - Fan-out/fan-in parallel execution
- `langgraph-routing` - Semantic routing and conditional branching
- `langgraph-supervisor` - Supervisor-worker orchestration
- `langgraph-human-in-loop` - Human approval and intervention
- `llm-evaluation` - Quality scoring, LLM-as-judge patterns
- `llm-streaming` - Token streaming, SSE patterns
- `multi-agent-orchestration` - Agent coordination and synthesis
- `test-data-management` - Test fixtures and factories
- `performance-testing` - k6 and Locust load testing
- `cache-cost-tracking` - LLM cost tracking and optimization
- `llm-safety-patterns` - Safety checklists and context separation

### Changed

#### Agent Updates
- `frontend-ui-developer` - Added Motion animations, i18n date patterns, Tailwind @theme utilities
- `rapid-ui-designer` - Added animation specs with Motion presets
- `code-quality-reviewer` - Added i18n date pattern checking (v3.8.0)
- `design-system-starter` - Added animation-tokens to provides

#### Workflow Updates
- `frontend-2025-compliance` - Added Motion and i18n skills, updated checklist with skeleton pulse, AnimatePresence, i18n dates

#### Pattern Updates
- New `frontend-animation-patterns.md` context pattern

### Fixed
- Removed project-specific references, now uses generic "SkillForge Team" branding

---

## [1.0.0] - 2025-01-01

### Initial Release

The first public release of the SkillForge plugin for Claude Code, providing comprehensive AI-native development capabilities.

### Added

#### Skills (33 total)

**AI Development**
- `ai-native-development` - RAG pipelines, embeddings, vector databases, agentic workflows
- `langgraph-workflows` - Multi-agent workflows with LangGraph 1.0
- `llm-caching-patterns` - Multi-level caching strategies for LLM applications
- `llm-safety-patterns` - Secure LLM integration patterns
- `langfuse-observability` - LLM observability with self-hosted Langfuse
- `pgvector-search` - Production hybrid search with PGVector + BM25
- `golden-dataset-curation` - Quality criteria for golden dataset entries
- `golden-dataset-management` - Backup, restore, and validate golden datasets
- `golden-dataset-validation` - Validation rules and schema checks

**Backend Development**
- `api-design-framework` - REST, GraphQL, and gRPC API design patterns
- `database-schema-designer` - Database schema design for SQL and NoSQL
- `streaming-api-patterns` - Real-time data streaming with SSE and WebSockets
- `type-safety-validation` - End-to-end type safety with Zod, tRPC, Prisma

**Frontend Development**
- `react-server-components-framework` - React Server Components with Next.js 15
- `design-system-starter` - Design systems with tokens and accessibility
- `performance-optimization` - Full-stack performance analysis and optimization

**DevOps & Infrastructure**
- `devops-deployment` - CI/CD pipelines, containerization, Kubernetes
- `edge-computing-patterns` - Edge runtime deployment patterns
- `observability-monitoring` - Structured logging, metrics, distributed tracing

**Security**
- `security-checklist` - OWASP Top 10 mitigations and security audits
- `defense-in-depth` - Multi-layer security architecture for AI systems

**Architecture & Design**
- `architecture-decision-record` - ADR templates following Nygard format
- `system-design-interrogation` - Systematic questioning for system design
- `brainstorming` - Structured Socratic questioning for idea development

**Testing & Quality**
- `testing-strategy-builder` - Comprehensive testing strategies
- `code-review-playbook` - Structured review processes and checklists
- `webapp-testing` - Playwright testing with autonomous test agents

**Workflow & Tools**
- `github-cli` - GitHub CLI mastery for issues, PRs, and automation
- `ascii-visualizer` - ASCII art visualizations for architectures
- `browser-content-capture` - Capture content from JS-rendered pages

#### Commands (10 total)

- `/implement` - Full-power feature implementation with parallel subagents
- `/brainstorm` - Multi-perspective idea exploration
- `/explore` - Deep codebase exploration with specialized agents
- `/run-tests` - Comprehensive test execution with parallel analysis
- `/verify` - Feature verification with highest standards
- `/fix-issue` - Fix GitHub issues with parallel analysis
- `/review-pr` - Comprehensive PR review with code quality agents
- `/create-pr` - Create PR with validation and auto-generated description
- `/commit` - Smart commit with validation and auto-generated message
- `/add-golden` - Curate and add documents to golden dataset

#### Agents (14 total)

- `implementation-agent` - Feature implementation specialist
- `testing-agent` - Test creation and execution
- `review-agent` - Code review and quality analysis
- `security-agent` - Security vulnerability detection
- `performance-agent` - Performance optimization analysis
- `documentation-agent` - Documentation generation
- `refactoring-agent` - Code refactoring specialist
- `debugging-agent` - Bug investigation and resolution
- `architecture-agent` - System design and architecture
- `database-agent` - Database schema and query optimization
- `frontend-agent` - React and UI development
- `backend-agent` - API and service development
- `devops-agent` - CI/CD and infrastructure
- `observability-agent` - Logging, metrics, and tracing

### Security

- All hook scripts hardened with `set -euo pipefail`
- No use of `eval` or dynamic code execution
- No network calls in hooks
- All user input properly escaped and validated
- Common utilities extracted to `common.sh` for consistent security patterns

### Documentation

- Comprehensive README with installation and usage instructions
- CONTRIBUTING.md with guidelines for adding skills, commands, and agents
- MIT License for open source distribution
- This CHANGELOG for tracking version history

---

## Future Releases

Planned enhancements for future versions:

- Additional language-specific skills (Rust, Go, Python advanced patterns)
- Integration with more observability platforms
- Enhanced testing automation capabilities
- Community-contributed skills and agents

[1.0.0]: https://github.com/SkillForge/claude-plugin/releases/tag/v1.0.0
