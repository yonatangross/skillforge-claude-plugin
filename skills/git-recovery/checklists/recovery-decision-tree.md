# Git Recovery Decision Tree

Quick reference for recovering from common Git mistakes.

## What Happened?

### Committed to Wrong Branch

```
Did you push the commit?
│
├─ NO → Cherry-pick + Reset
│   git log -1  # Note commit SHA
│   git reset --hard HEAD~1
│   git checkout correct-branch
│   git cherry-pick <sha>
│
└─ YES → Cherry-pick + Revert
    git checkout correct-branch
    git cherry-pick <sha>
    git push origin correct-branch
    git checkout wrong-branch
    git revert <sha>
    git push origin wrong-branch
```

### Need to Undo Last Commit

```
What do you want to keep?
│
├─ Keep changes STAGED
│   git reset --soft HEAD~1
│
├─ Keep changes UNSTAGED
│   git reset HEAD~1
│
├─ Discard everything
│   git reset --hard HEAD~1
│
└─ Already pushed (shared branch)
    git revert HEAD
    git push
```

### Lost Commits (After Reset/Rebase)

```
When did you lose them?
│
├─ Just now
│   git reflog  # Find the commit
│   git reset --hard HEAD@{N}  # N = position before loss
│
├─ Hours ago
│   git reflog --since="3 hours ago"
│   git cherry-pick <sha>  # Or reset --hard
│
└─ Days ago (within 90 days)
    git reflog --all
    git fsck --unreachable | grep commit
```

### Deleted a Branch

```
Was it pushed to remote?
│
├─ YES → Restore from remote
│   git fetch origin
│   git checkout -b branch-name origin/branch-name
│
└─ NO → Use reflog
    git reflog | grep "checkout: moving from branch-name"
    git checkout -b branch-name <sha>
```

### Bad Merge

```
Was the merge pushed?
│
├─ NO → Reset
│   git reset --hard HEAD~1
│
└─ YES → Revert
    git revert -m 1 <merge-commit-sha>
    # -m 1 keeps your branch's history
    git push
```

### Rebase Gone Wrong

```
Are you still in the middle of rebase?
│
├─ YES → Abort
│   git rebase --abort
│
└─ NO (already completed)
    git reflog | grep "rebase: start"
    # Find HEAD@{N} before rebase started
    git reset --hard HEAD@{N}

    # If pushed, need force-push (feature branch only!)
    git push --force-with-lease
```

### Accidentally Staged Wrong Files

```
git reset HEAD <file>       # Unstage specific file
git reset HEAD              # Unstage all files
# Changes remain in working directory
```

### Accidentally Modified Wrong File

```
Was the file committed?
│
├─ NO → Discard changes
│   git checkout -- <file>   # Or: git restore <file>
│
└─ YES → Reset to previous version
    git checkout HEAD~1 -- <file>
    # Or restore from specific commit
    git checkout <commit-sha> -- <file>
```

### Dropped a Stash

```
Was it recent?
│
├─ YES (within ~2 weeks)
│   git fsck --unreachable | grep commit
│   # Look for "WIP on" or stash content
│   git show <sha>
│   git stash apply <sha>
│
└─ NO (might be garbage collected)
    # May be lost permanently
    # Check if any reflog entries remain
    git reflog | grep stash
```

## Emergency Commands

```bash
# DON'T PANIC - Check reflog first
git reflog

# See all recent HEAD movements
git reflog --all

# Find unreachable commits
git fsck --unreachable | grep commit

# Recover specific commit
git cherry-pick <sha>

# Go back in time
git reset --hard HEAD@{N}

# Create backup before risky operation
git branch backup-branch
```

## Prevention Checklist

- [ ] Always work on feature branches
- [ ] Commit early and often
- [ ] Review before push: `git log --oneline -5`
- [ ] Use `--force-with-lease` instead of `--force`
- [ ] Create backup branch before risky operations
- [ ] Never rewrite history on shared branches

## Key Commands Reference

| Command | Effect | Recoverable? |
|---------|--------|--------------|
| `git reset --soft HEAD~1` | Undo commit, keep staged | Yes |
| `git reset HEAD~1` | Undo commit, keep unstaged | Yes |
| `git reset --hard HEAD~1` | Undo commit, discard all | Yes (via reflog) |
| `git revert HEAD` | New commit undoing changes | Yes |
| `git checkout -- file` | Discard file changes | NO |
| `git clean -fd` | Delete untracked files | NO |
| `git push --force` | Overwrite remote | DANGER |

## Reflog Survival Guide

The reflog tracks all HEAD movements for ~90 days:

```bash
# View reflog
git reflog

# Format:
# abc1234 HEAD@{0}: commit: Message
# def5678 HEAD@{1}: checkout: moving from main to feature
# ghi9012 HEAD@{2}: reset: moving to HEAD~1

# Use HEAD@{N} in any command
git show HEAD@{3}
git reset --hard HEAD@{5}
git cherry-pick HEAD@{2}

# Branch-specific reflog
git reflog show feature-branch
```
