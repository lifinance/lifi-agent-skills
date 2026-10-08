# Provenance and distribution

## Canonical source

| Field | Meaning today |
| --- | --- |
| Source | `https://github.com/lifinance/lifi-agent-skills` |
| Current skills | `skills/lifi/SKILL.md`, `skills/lifi-stablecoin-swap/SKILL.md` and their `references/` files |
| Version | Full repository Git commit; no independent skill version, tag, or release is defined |
| Last verified | Record the check time and exact commit in a review or CI run; not a static claim in skill frontmatter |
| API surface documented | Core/Composer at `https://li.quest/v1`, Earn at `https://earn.li.fi/v1`, Intents at `https://order.li.fi` |
| API compatibility | Not certified by the local source check. API URLs are documentation targets, not a supported-version guarantee |

The existing `SKILL.md` frontmatter fields are `name` (the directory name) and `description` (the skill's purpose). No `version`, signature, or runtime-verification field is added without a release policy. Review the skill and references before allowing an agent to execute transactions; installing instructions does not itself provide a wallet, execution permissions, or a safety guarantee.

To review a reproducible snapshot, use a full commit obtained from the canonical repository (replace `COMMIT` with that value):

```bash
git clone https://github.com/lifinance/lifi-agent-skills.git
cd lifi-agent-skills
git checkout --detach COMMIT
git rev-parse HEAD
node scripts/check-source.mjs --commit "$(git rev-parse HEAD)"
```

Only the `skills/` directory and references at that commit are the reviewed source. The quick installation command in the README is not a pinned installation contract: check the installer and installed files separately. A Git commit and file hashes identify content; they do not establish signer identity or attest that API calls were tested.

## Distribution map

| Entry | Relationship | Target state |
| --- | --- | --- |
| This repository | Canonical company-owned source | Official docs and installation examples point here |
| Official agent documentation | Company-owned entry point | Names both current skills and links to this source/version policy |
| skills.sh | Third-party discovery index | Current entries should resolve to this repository; historical `li-fi-api` / `li-fi-sdk` entries are superseded by `lifi`, not additional current skills |
| `lifinance/clawhub-skill` | Separate company-owned legacy source, not this repository | Needs a separate maintainer decision to retire or align; do not treat it as an equivalent current distribution |
| ClawHub `rhlsthrm/lifi-crosschain` | Personal namespace; company ownership is not established | Not an official installation source; ownership/content alignment needs separate authorization |
| Playbooks `openclaw/skills/lifi-crosschain` | Third-party mirror, not this repository | Not an official installation source; availability and content may change |

This policy does not change, publish, delete, or transfer any third-party entry. Directory listings may lag repository renames. Match the source repository, commit, skill name, and complete file contents rather than trusting a listing title or installation count.

## Local consistency and metadata

Run `node scripts/check-source.mjs --commit FULL_COMMIT`. The dependency-free check validates the current skill set, frontmatter names/descriptions, local Markdown reference links, and canonical README installation source. It writes a JSON catalog to stdout containing:

- `source`: canonical repository URL;
- `commit`: the supplied full Git commit (the caller must bind it to the checkout);
- `skills[].name`: validated frontmatter/directory name;
- `skills[].files[]`: repository-relative path and SHA-256 of each skill file, including references.

CI binds `commit` to the checked-out `github.sha` and uploads the generated catalog as a review artifact. It is not a release, registry publication, signature, or live API/registry test. For a dirty local checkout, hashes describe working files rather than necessarily the supplied commit; use a clean checkout for provenance comparisons.

If maintainers later define a release format, use this same source check/catalog at the approved release commit rather than hand-copying skill names or capability counts into registry metadata. Signing, release versioning, registry ownership and publication credentials remain separate decisions. External index comparisons should be read-only and performed separately; network availability must not block this local consistency check.
