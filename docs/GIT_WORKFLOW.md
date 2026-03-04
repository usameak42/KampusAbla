# Git Branching Strategy

## Overview

This project follows a **GitFlow-inspired** branching strategy to maintain code quality, enable parallel development, and ensure stable releases.

## Branch Structure

### Permanent Branches

#### `main` (Production)
- **Purpose**: Production-ready code only
- **Protected**: Yes (requires PR approval)
- **Deployment**: Automatically deploys to production
- **Merge From**: `develop` (via release branches) or `hotfix/*` branches
- **Never commit directly to this branch**

#### `develop` (Integration)
- **Purpose**: Integration branch for features
- **Protected**: Yes (requires PR review)
- **Deployment**: Automatically deploys to staging
- **Merge From**: `feature/*`, `bugfix/*` branches
- **Base for**: All new feature development

### Temporary Branches

#### `feature/*` (New Features)
- **Format**: `feature/task-description`
- **Examples**: 
  - `feature/user-authentication`
  - `feature/sitter-verification`
  - `feature/live-location-tracking`
- **Created From**: `develop`
- **Merged Into**: `develop`
- **Lifecycle**: Deleted after merge

#### `bugfix/*` (Bug Fixes)
- **Format**: `bugfix/issue-description`
- **Examples**:
  - `bugfix/login-error`
  - `bugfix/payment-calculation`
- **Created From**: `develop`
- **Merged Into**: `develop`
- **Lifecycle**: Deleted after merge

#### `hotfix/*` (Production Fixes)
- **Format**: `hotfix/critical-issue`
- **Examples**:
  - `hotfix/payment-gateway-crash`
  - `hotfix/security-vulnerability`
- **Created From**: `main`
- **Merged Into**: Both `main` AND `develop`
- **Lifecycle**: Deleted after merge
- **Use Only For**: Critical production issues

#### `release/*` (Release Preparation)
- **Format**: `release/vX.X.X`
- **Examples**: `release/v1.0.0`, `release/v1.1.0`
- **Created From**: `develop`
- **Merged Into**: Both `main` AND `develop`
- **Purpose**: Final testing, version bump, release notes
- **Lifecycle**: Deleted after merge

## Workflow

### Starting New Feature

```bash
# Update develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Work on your feature
git add .
git commit -m "feat: descriptive commit message"

# Push to remote
git push origin feature/your-feature-name

# Create Pull Request on GitHub/GitLab targeting develop
```

### Completing a Feature

1. **Push your changes** to the feature branch
2. **Create Pull Request** from `feature/*` → `develop`
3. **Code Review**: At least one team member reviews
4. **Pass CI/CD**: All tests, linting, type-checking must pass
5. **Merge**: Squash and merge into `develop`
6. **Delete branch**: Feature branch is deleted

### Bug Fixes

Same process as features, but use `bugfix/*` prefix:

```bash
git checkout develop
git pull origin develop
git checkout -b bugfix/fix-description
# Make fixes
git push origin bugfix/fix-description
# Create PR to develop
```

### Hotfixes (Production Emergency)

```bash
# Create from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-issue

# Fix the issue
git add .
git commit -m "hotfix: fix critical issue"
git push origin hotfix/critical-issue

# Create PR to main (urgent review)
# After merge to main, ALSO create PR to develop to keep it in sync
```

### Release Process

```bash
# Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v1.0.0

# Update version in package.json
npm version 1.0.0

# Final testing, bug fixes only
git add .
git commit -m "chore: bump version to 1.0.0"
git push origin release/v1.0.0

# Create PR to main
# After merge, tag the release
git checkout main
git pull origin main
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Merge back to develop
git checkout develop
git merge main
git push origin develop
```

## Commit Message Convention

Follow **Conventional Commits** format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting (no logic change)
- `refactor`: Code restructuring (no behavior change)
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, tooling
- `perf`: Performance improvements

### Examples

```bash
feat(auth): add phone number OTP verification
fix(payment): correct platform fee calculation
docs(readme): update installation instructions
refactor(search): optimize sitter query performance
test(booking): add unit tests for cancellation policy
chore(deps): update React to v18.3.1
```

## Pull Request Guidelines

### PR Title Format

Use conventional commit format:
```
feat(search): add distance filter for sitters
fix(chat): prevent phone number sharing
```

### PR Description Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Feature
- [ ] Bug Fix
- [ ] Hotfix
- [ ] Documentation
- [ ] Refactor

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] No console.log or debug code
- [ ] Documentation updated (if needed)
```

## Branch Protection Rules

### `main` Branch
- Require pull request reviews (minimum 1)
- Require status checks to pass (CI/CD)
- Require branches to be up to date
- Do not allow force push
- Do not allow deletion

### `develop` Branch
- Require pull request reviews (minimum 1)
- Require status checks to pass
- Do not allow force push

## Best Practices

1. **Keep branches short-lived**: Merge features within 1-3 days
2. **Pull frequently**: Update from develop daily
3. **Small, focused PRs**: Easier to review and merge
4. **Descriptive branch names**: `feature/sitter-profile-page` not `feature/update`
5. **Test before PR**: Run `npm run type-check && npm run lint && npm test && npm run build`
6. **Clean commit history**: Use `git rebase` to clean up before PR
7. **Delete merged branches**: Keep repository clean

## Troubleshooting

### Merge Conflicts

```bash
# Update your branch from develop
git checkout feature/your-feature
git fetch origin
git rebase origin/develop

# Resolve conflicts
# After resolving, continue rebase
git rebase --continue

# Force push (only on feature branches)
git push origin feature/your-feature --force-with-lease
```

### Accidentally Committed to Wrong Branch

```bash
# Undo last commit but keep changes
git reset --soft HEAD~1

# Switch to correct branch
git checkout correct-branch

# Commit changes
git add .
git commit -m "your message"
```

## Resources

- [GitFlow Workflow](https://nvie.com/posts/a-successful-git-branching-model/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
