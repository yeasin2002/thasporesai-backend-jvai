# Lefthook Configuration

This project uses [Lefthook](https://github.com/evilmartians/lefthook) for Git hooks management, replacing the previous Husky + lint-staged setup.

## What is Lefthook?

Lefthook is a fast, cross-platform Git hooks manager written in Go. It's faster than Husky and has built-in support for running commands on staged files (like lint-staged).

## Configuration

The configuration is in `lefthook.yml` at the project root.

### Current Setup

Pre-commit hook runs three commands in parallel on staged files:

1. **Prettier** - Formats code and stages fixed files
2. **ESLint** - Lints and fixes issues, stages fixed files
3. **Oxlint** - Fast linting check (no auto-fix)

All commands only run on staged `.{js,mjs,cjs,jsx,ts,mts,cts,tsx,vue,astro,svelte}` files.

## Commands

### Manual Testing

Test the pre-commit hook without committing:

```bash
lefthook run pre-commit
```

### Installation

Lefthook is automatically installed via the `prepare` script when you run:

```bash
pnpm install
```

### Uninstall Hooks

To remove Git hooks:

```bash
lefthook uninstall
```

### Reinstall Hooks

To reinstall Git hooks:

```bash
lefthook install
```

## How It Works

1. When you commit files, Lefthook intercepts the commit
2. It identifies staged files matching the glob patterns
3. Runs prettier, eslint, and oxlint on those files in parallel
4. If prettier or eslint fix files, they're automatically staged (`stage_fixed: true`)
5. If any command fails, the commit is aborted

## Configuration Details

```yaml
pre-commit:
  parallel: true # Run commands in parallel for speed
  commands:
    prettier:
      glob: "*.{js,mjs,cjs,jsx,ts,mts,cts,tsx,vue,astro,svelte}"
      run: prettier --write {staged_files}
      stage_fixed: true # Auto-stage fixed files

    eslint:
      glob: "*.{js,mjs,cjs,jsx,ts,mts,cts,tsx,vue,astro,svelte}"
      run: eslint --fix {staged_files}
      stage_fixed: true # Auto-stage fixed files

    oxlint:
      glob: "*.{js,mjs,cjs,jsx,ts,mts,cts,tsx,vue,astro,svelte}"
      run: oxlint {staged_files}
```

## Key Features

- **Fast**: Written in Go, faster than Node.js-based alternatives
- **Cross-platform**: Works on Windows, macOS, and Linux
- **Parallel execution**: Runs commands simultaneously
- **Auto-staging**: Fixed files are automatically staged
- **Glob patterns**: Only runs on matching files
- **Skip empty**: Automatically skips when no files match

## Comparison with Previous Setup

### Before (Husky + lint-staged)

- Required two packages: `husky` + `lint-staged`
- Configuration split between `.husky/` folder and `.lintstagedrc`
- Node.js-based, slower execution
- Required separate `lint-staged` command

### After (Lefthook)

- Single package: `lefthook`
- Single configuration file: `lefthook.yml`
- Go-based, faster execution
- Built-in staged file handling

## Troubleshooting

### Hooks not running

Reinstall hooks:

```bash
lefthook install
```

### Reset hooks path

If you see "core.hooksPath is set" error:

```bash
git config --unset-all --local core.hooksPath
lefthook install
```

### Docker Build Issues

If you encounter "git: executable file not found" during Docker builds, the Dockerfile is already configured to skip the prepare script using `--ignore-scripts`. Git hooks aren't needed in production containers.

### Skip hooks temporarily

To skip pre-commit hooks for a single commit:

```bash
git commit --no-verify
```

Or use Lefthook's skip flag:

```bash
LEFTHOOK=0 git commit
```

## Additional Resources

- [Lefthook Documentation](https://github.com/evilmartians/lefthook/blob/master/docs/usage.md)
- [Configuration Reference](https://github.com/evilmartians/lefthook/blob/master/docs/configuration.md)
