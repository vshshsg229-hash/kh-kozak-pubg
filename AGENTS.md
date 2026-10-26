# KH么Kozak — AI Team Rules

## Project goal
Maintain and improve the existing KH么Kozak project without replacing it with a smaller demo or removing existing features.

## Single source of truth
- The GitHub repository `vshshsg229-hash/kh-kozak-pubg` is the shared source of truth.
- Before editing, inspect the current files, recent commits, and relevant workflows.
- Do not assume that another AI's chat history is available. Read the repository and issue/PR notes instead.
- If work is incomplete, record what changed, what remains, and how it was checked in the related issue or pull request.

## Preserve existing functionality
- Do not delete, hide, stub out, or rewrite existing features just to simplify the code.
- Preserve the existing music library, profile, avatars, mini-games, game modes, statistics, navigation, and mobile/tablet layouts wherever they exist.
- If a change may affect an existing feature, identify the impact before editing and test that feature afterward.
- Prefer small, focused changes over a full rewrite.
- Do not change branding, visual direction, or user-facing text beyond the scope of the task.

## Safe collaboration
- Work on a separate branch for each task; do not push experimental work directly to `main`.
- Open a pull request with a clear summary, files changed, tests performed, and known limitations.
- Do not merge a pull request or publish a risky change without the owner's approval.
- Avoid overlapping edits to the same files. If another contributor has changed a file, fetch the latest version and reconcile instead of overwriting it.
- Keep commits focused and use descriptive commit messages.

## Quality checks
- Inspect the existing `.github/workflows/` before adding or changing automation; reuse current checks where possible.
- Run the relevant available checks and report exact results. Never claim a test passed unless it was actually run.
- For UI changes, check small mobile screens as well as tablet/desktop when possible.
- For deployment changes, verify the repository's current GitHub Pages/build setup before changing it.
- If a check cannot run in the available environment, state that clearly and provide a manual verification step.

## Security
- Never commit passwords, API keys, access tokens, private user data, or local secret files.
- Do not expose secrets in logs, screenshots, issues, or pull request descriptions.
- Use the least permissions needed for workflows. Do not add deployment permissions or third-party actions without explaining why.

## Required task handoff
For each completed task, report:
1. What changed and why.
2. Files touched.
3. Checks run and their actual results.
4. Any risks or remaining work.
5. The branch and pull request link, if created.
