# AGENTS.md

Agent Skills that teach AI coding agents to integrate [LI.FI](https://li.fi/)
(swaps, bridging, Composer, Earn, Intents) through its public REST APIs and
SDKs. Users install them with `npx skills add lifinance/lifi-agent-skills`.
This repository is the canonical source; there are no releases, the Git commit
is the version.

## Layout

- `skills/<name>/SKILL.md`: one skill per folder. YAML frontmatter with `name`
  (equal to the folder name) and `description`, then the instructions an agent
  loads when the skill triggers.
- `skills/<name>/references/`: longer material the skill links to and an agent
  reads only when needed.
  - `skills/lifi/references/REFERENCE.md`: full API reference behind `lifi`.
  - `skills/lifi-stablecoin-swap/references/quickstart.md`: runnable Next.js
    quickstart and full ABIs behind `lifi-stablecoin-swap`.
- `README.md`: install command and the public list of skills.

There is no code, build, test suite or CI. The deliverable is the Markdown.

## Editing a skill

- The `description` decides when an agent loads the skill. Keep its
  "USE THIS SKILL WHEN USER WANTS TO" list concrete, with example user
  phrasing, and update it whenever the skill's scope changes.
- Keep `SKILL.md` focused on the workflow and the calls an agent needs most;
  move long tables, full ABIs and exhaustive parameter lists into
  `references/` and link to the section with a relative link.
- Every endpoint, parameter, contract address and chain ID must match the
  public LI.FI docs at the time of writing. Check against the
  [API reference](https://docs.li.fi/api-reference/introduction) and the
  [OpenAPI spec](https://docs.li.fi/openapi.yaml) rather than memory.
- Code samples must run as written: real package names (`@lifi/sdk`,
  `@lifi/intent`, `viem`), amounts in the token's smallest unit, no
  placeholder that would execute a real transfer by accident.
- Never put API keys, private keys, integrator secrets or internal URLs in a
  skill. Samples read keys from environment variables.

## Adding a skill

1. Create `skills/<name>/SKILL.md` with `name: <name>` and a `description`
   in the frontmatter.
2. Add a `references/` folder only if the skill needs material beyond what
   fits in `SKILL.md`.
3. Add the skill to "Available Skills" in `README.md` with a short
   "Use when" line.

## Before opening a PR

- Frontmatter parses and `name` matches the folder.
- Every relative link in the changed files resolves to an existing file and
  heading.
- Every code fence has a language id.

## Deeper docs

- [LI.FI documentation](https://docs.li.fi/) and
  [docs for AI agents](https://docs.li.fi/agents/overview)
- [llms.txt](https://docs.li.fi/llms.txt)
