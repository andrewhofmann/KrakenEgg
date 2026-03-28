# Contributing to KrakenEgg

Thank you for your interest in contributing to KrakenEgg! This document provides guidelines for contributing.

## Development Setup

1. Install prerequisites: Rust, Node.js (v18+), pnpm (v10+)
2. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/andrewhofmann/KrakenEgg.git
   cd KrakenEgg/krakenegg-app
   pnpm install
   ```
3. Start the dev server: `pnpm tauri dev`

## Branching Strategy

- `main` — stable releases, tagged with version numbers
- `develop` — integration branch
- `feature/*` — new features
- `fix/*` — bug fixes

## Before Submitting a PR

1. **Run ALL tests** — every single one must pass:
   ```bash
   pnpm test          # 499 TypeScript unit tests
   pnpm test:rust     # 109 Rust tests (cd src-tauri && cargo test --lib)
   pnpm test:e2e      # 461 Playwright E2E tests
   ```

2. **Runtime verification** — launch the app and verify it renders:
   ```bash
   pnpm tauri dev
   ```

3. **Write tests** for your changes (unit + integration)

4. **Use conventional commits**:
   - `feat:` — new feature
   - `fix:` — bug fix
   - `test:` — adding tests
   - `docs:` — documentation
   - `refactor:` — code refactoring
   - `chore:` — maintenance

## Code Style

- **TypeScript**: Follow existing patterns, use CSS variables for colors
- **Rust**: Run `cargo fmt` and `cargo clippy`
- **Components**: Use theme variables (`var(--ke-*)`) for all colors
- **Accessibility**: Add `aria-label`, `role`, and keyboard support

## Reporting Issues

Use GitHub Issues with these labels:
- `bug` — something is broken
- `enhancement` — feature request
- `documentation` — docs improvement
- `good first issue` — suitable for newcomers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
