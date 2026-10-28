# Contributing

Thanks for helping make these guides better. The most useful contributions, in order:

1. **Errata.** A wrong claim, a confusing sentence, a stale fact. Open an
   [erratum issue](../../issues/new?template=erratum.yml) and quote the sentence. A source helps.
2. **"Doesn't reproduce" reports.** A notebook cell that errors or prints something different from
   the guide. Open a [reproducibility issue](../../issues/new?template=does-not-reproduce.yml)
   and paste the setup cell's output.
3. **Code fixes** to the tooling (`tools/`, `book/`, the site) as pull requests.

## How the guide text is edited

The guides are written and reviewed in a separate authoring workspace. Every guide goes through
a series of editorial reviews (accuracy, code, consistency of notation across the series, and
more) before it's published here. `tools/sync_from_authoring.py` then copies it into this
repository.

So a pull request that changes `content/` is a proposal. The maintainer applies accepted
changes in the authoring workspace, where they're checked against the rest of the series, and
syncs them back. You'll be credited in the changelog either way.

## Ground rules for code changes

- **Never edit `code/notebooks/*.ipynb` by hand.** They're generated from `content/`. Change
  the generator (`tools/build_notebooks.py`) or the guide instead.
- **Never type an output by hand.** Outputs come from running the code
  (`tools/verify_notebooks.py --write`).
- **Don't bump numpy, torch or tiktoken** without re-running every guide. The printed numbers
  depend on them.
- Before opening a PR:

  ```bash
  pip install -r tools/requirements.txt
  python tools/build_notebooks.py --check
  python tools/verify_notebooks.py
  npm ci && npm run build && npm run pdf
  ```

## For maintainers: releasing guides

1. In the authoring workspace, check that the guide has finished the pipeline
   (`reviews/<slug>/summary.md`).
2. Here, move the guide from `unreleased` to its part in `release.json`.
3. Run `python3 tools/sync_from_authoring.py ../llm-guides`. It refuses to sync a guide whose
   code doesn't pass in the authoring workspace.
4. Run `python tools/build_notebooks.py && python tools/verify_notebooks.py --write`.
5. Update the guide table in `README.md`, the guide dropdown in
   `.github/ISSUE_TEMPLATE/erratum.yml`, and `CHANGELOG.md`. Bump `version` in `release.json`
   and `package.json`.
6. Tag `vX.Y.Z`. CI builds the PDF and attaches it to the release.

## Code of conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Be kind, and assume good
faith.
