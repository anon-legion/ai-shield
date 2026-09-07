# Contributing to AI Shield

Thanks for your interest in contributing. This project uses the **fork-and-branch** workflow.
Read this document in full before opening your first pull request.

## License agreement

AI Shield is licensed under the **GNU General Public License v3.0 or later**. By submitting a
contribution you agree that your work is licensed under the same terms. Do not submit code you
do not have the right to relicense, and do not add dependencies under GPL-incompatible terms.

## One-time setup

1. Fork `anon-legion/ai-shield` on GitHub.
2. Clone **your fork** and add the original repository as `upstream`:

   ```bash
   git clone git@github.com:<your-username>/ai-shield.git
   cd ai-shield
   git remote add upstream git@github.com:anon-legion/ai-shield.git
   ```

3. Install dependencies (this project uses **Bun**, not npm):

   ```bash
   bun install
   ```

   The `postinstall` script runs `wxt prepare`, which generates `.wxt/`. Nothing typechecks
   without it.

## Branch model

| Branch | Purpose |
| --- | --- |
| `main` | Released code. Maintainers only. |
| `dev` | Integration branch. **The only branch contributors open PRs against.** |
| `<type>/<name>` | Your work. |

`main` and `dev` in your fork are **mirrors of upstream**. Never commit to them directly, and
never open a PR against `main` — that branch is updated only by maintainers via a release PR
from `dev`.

## Staying in sync

Before starting any work, fast-forward your local `dev` to match upstream exactly:

```bash
git fetch upstream
git switch dev
git merge --ff-only upstream/dev
git push origin dev
```

Use `--ff-only`. It is what keeps "identical to upstream" true: if your branch has diverged,
the merge **fails loudly** instead of silently creating a merge commit. If it does fail, you
have local commits that do not belong on `dev` — move them to a feature branch, then reset:

```bash
git switch -c fix/my-stray-work        # rescue the commits first
git switch dev
git reset --hard upstream/dev
```

Repeat the same steps for `main` when you need it current.

## Branch naming

Branches are named `<type>/<short-kebab-name>`:

| Type | Use for |
| --- | --- |
| `feat` | New functionality |
| `fix` | Bug fixes |
| `chore` | Tooling, dependencies, maintenance |
| `docs` | Documentation only |
| `refactor` | Behaviour-preserving restructuring |
| `test` | Tests only |

Examples: `feat/filter-whitelist`, `fix/redaction-collision`, `chore/update-deps`.

Work produced with an AI agent takes an additional `agent/` prefix — see
[AI-assisted contributions](#ai-assisted-contributions):

```
agent/feat/redact-pdf
agent/test/update-unit-tests
```

## Workflow

1. **Branch from an up-to-date `dev`:**

   ```bash
   git switch dev
   git switch -c feat/my-change
   ```

2. **Do the work.** Commit in logical units with clear messages.

3. **Update your local `dev`, then rebase onto it.** Always rebase onto your local `dev`, not
   onto `upstream/dev` directly — which is why `dev` must be kept identical to upstream. If it
   has fallen behind, fast-forward it first ([Staying in sync](#staying-in-sync)):

   ```bash
   git fetch upstream
   git switch dev
   git merge --ff-only upstream/dev     # skip if already current
   git push origin dev                  # keep your fork's dev in step too
   ```

   Then rebase your feature branch onto it. Rebase — never merge `dev` into your branch:

   ```bash
   git switch feat/my-change
   git rebase dev
   ```

4. **Run the checks** (see below). Fix anything that fails.

5. **Push to your fork:**

   ```bash
   git push -u origin feat/my-change
   ```

   Rebasing rewrites history, so a branch you have already pushed will be rejected on the next
   push. Force it — with the lease:

   ```bash
   git push --force-with-lease origin feat/my-change
   ```

   Use `--force-with-lease`, never a bare `--force`. The lease aborts the push if the remote
   moved since you last fetched, so you cannot silently destroy someone else's work.

6. **Open a pull request** from your fork's branch to the **`dev`** branch of
   `anon-legion/ai-shield`. Fill in the PR template honestly.

## Before you push

Run these in order, from the repository root:

```bash
bunx biome check --write .              # lint + format + organize imports
bun run check                           # typecheck (svelte-check, NOT tsc)
bun run build                           # production build
bunx fallow audit --base dev            # dead code, complexity, duplication
```

CI runs the same checks on every PR and will block a merge if any of them fail. If you changed
entrypoints or `wxt.config.ts`, run `bunx wxt prepare` first.

Never run `biome` with `--write` in CI, and do not hand-edit the generated `.wxt/`, `.output/`,
or `public/icon/` directories.

## AI-assisted contributions

**Using AI agents to write code for this project is permitted and welcome.** The rules exist so
that every line merged has been understood by a human who can maintain it.

1. **All agent work happens on an `agent/` branch.** Prefix the normal convention with
   `agent/`, e.g. `agent/feat/redact-pdf`. The prefix stays on the branch through the PR so
   that reviewers can see how the code was produced.

2. **An agent must never open a pull request.** No `gh pr create`, no API call, no automation.
   A human opens every PR, manually.

3. **Open the PR only after you have reviewed and understood every AI-generated line.** Not
   skimmed, not "the tests pass" — understood, well enough to explain and to maintain it.
   Anything you cannot explain does not go in the PR.

4. **You are fully accountable for the code you submit**, regardless of what wrote it. "The
   agent did it" is not a defence in review.

5. **Credit the agent** with a trailer on AI-authored commits:

   ```
   Co-Authored-By: <agent name> <noreply@example.com>
   ```

A note on how this is enforced: it is not, technically. Your PR originates from your own fork,
and GitHub cannot tell who clicked the button. This policy rests on the attestation in the pull
request template, on the visible `agent/` branch prefix, and on maintainer review. It is an
honour-system rule, and we are stating that plainly rather than pretending otherwise. Submitting
unreviewed agent output is a straightforward way to have your future PRs treated with suspicion.

Project-specific rules that agents themselves must follow are in [AGENTS.md](AGENTS.md).

## Review and merge

- At least one maintainer approval is required.
- CI must be green.
- Feature branches are squash-merged into `dev`.
- Promotion from `dev` to `main` is done by maintainers via a release PR.

Be patient and be civil. Reviewers are volunteers.
