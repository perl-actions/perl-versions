
# perl-versions

Github action for your matrix to generate list of perls since given.

## Available versions

For list of available perl versions check
[docker-perl-tester](https://github.com/Perl/docker-perl-tester#using-docker-images-for-your-projects).

Both `since-perl` and `until-perl` accept version numbers in the following formats:

| Format | Example | Description |
|--------|---------|-------------|
| Numeric | `5.20` | Standard version number |
| V-prefixed | `v5.20` | Version with `v` prefix |
| Patch-level | `5.36.3` | Patch component is ignored — treated as `5.36` |
| `latest` | `latest` | Symbolic version — the newest stable Perl release |

## Parameters

### since-perl

Required parameter.

Returns perl versions since this (including).

When unknown version is provided, returns empty list.

### until-perl

Default: `latest`

Returns perl versions up to this version (including this version).
Can be combined with `since-perl` to get a specific range of versions.

### with-devel

Default: `false`

When set to `true`, returned list will also include current `devel` version of Perl,
if available.

### target

Default: `perl-tester`

Selects which platform target to use for generating the version list. Each target
corresponds to a different set of available Perl versions, reflecting what is
actually published for that platform.

Available targets:

| Target | Description | Versions |
|--------|-------------|----------|
| `perl` | Official [Perl Docker images](https://hub.docker.com/_/perl) | 5.8 — 5.42 + devel |
| `perl-tester` | [perl-tester Docker images](https://github.com/Perl/docker-perl-tester) with pre-installed testing tools | 5.8 — 5.42 + devel |
| `macos` | macOS native Perl builds | 5.8 — 5.42 + devel |
| `windows-strawberry` | [Strawberry Perl](https://strawberryperl.com/) for Windows | 5.14 — 5.40 |

Notes:
- `windows-strawberry` has a smaller version range and does **not** include `devel`.
- If an unknown target is provided, the action fails with an error listing the valid targets.

### single-out

Optional, no default.

Separates one version from the list into a dedicated `single-out` output. The
singled-out version is **excluded** from the main `perl-versions` output. Useful
for running one version as a "primary" job (e.g. coverage upload) while the rest
run in a matrix.

Accepted values: an exact version (e.g. `5.36`), `oldest`, `newest` / `latest`,
or `devel`.

## Usage

### Version range

```yaml
jobs:
  perl-versions:
    runs-on: ubuntu-latest
    name: List Perl versions
    outputs:
      perl-versions: ${{ steps.action.outputs.perl-versions }}
    steps:
      - id: action
        uses: perl-actions/perl-versions@v2
        with:
          since-perl: 5.20
          until-perl: 5.36
          with-devel: false

  ##
  ## Combining perl-versions with perl-tester
  ##
  test:
    needs:
      - perl-versions
    name: "Perl ${{ matrix.perl-version }}"
    strategy:
      fail-fast: false
      matrix:
        perl-version: ${{ fromJson (needs.perl-versions.outputs.perl-versions) }}
    container:
      image: perldocker/perl-tester:${{ matrix.perl-version }}
    steps:
      - uses: actions/checkout@v4
      - run: perl -V
      # adjust that section to fit your distribution
      - uses: perl-actions/ci-perl-tester-helpers/install-test-helper-deps@main
      - uses: perl-actions/ci-perl-tester-helpers/cpan-install-build-deps@main
      - uses: perl-actions/ci-perl-tester-helpers/build-dist@main
      - uses: perl-actions/ci-perl-tester-helpers/cpan-install-dist-deps@main
      - uses: perl-actions/ci-perl-tester-helpers/test-dist@main
        env:
          AUTHOR_TESTING: 1
```

### Latest stable only

Use the `latest` symbolic version with `since-perl` to get only the newest stable
Perl (and optionally devel):

```yaml
      - id: action
        uses: perl-actions/perl-versions@v2
        with:
          since-perl: latest
          with-devel: true
```

### All versions from a specific release

```yaml
      - id: action
        uses: perl-actions/perl-versions@v2
        with:
          since-perl: 5.20
```

### Patch-level versions

Patch-level version numbers (e.g. `5.8.1`, `5.36.3`) are automatically truncated
to their major.minor series. This means `since-perl: 5.8.1` is equivalent to
`since-perl: 5.8` — the patch component is stripped before filtering.

```yaml
      - id: action
        uses: perl-actions/perl-versions@v2
        with:
          since-perl: 5.8.1
          until-perl: 5.14
```

This returns `["5.8","5.10","5.12","5.14"]` — the `5.8` series is included
despite the `.1` patch suffix.

### Cross-platform targets

Use the `target` input to generate version lists for different platforms:

```yaml
  perl-versions:
    runs-on: ubuntu-latest
    outputs:
      perl-versions: ${{ steps.action.outputs.perl-versions }}
    steps:
      - id: action
        uses: perl-actions/perl-versions@v2
        with:
          since-perl: 5.20
          target: windows-strawberry
```

This returns only the versions available for Strawberry Perl (5.20 through 5.40).

To test across multiple platforms, use separate version steps per target:

```yaml
  strawberry-versions:
    runs-on: ubuntu-latest
    outputs:
      perl-versions: ${{ steps.action.outputs.perl-versions }}
    steps:
      - id: action
        uses: perl-actions/perl-versions@v2
        with:
          since-perl: 5.26
          target: windows-strawberry

  test-windows:
    needs: strawberry-versions
    runs-on: windows-latest
    strategy:
      matrix:
        perl-version: ${{ fromJson (needs.strawberry-versions.outputs.perl-versions) }}
    steps:
      - uses: actions/checkout@v4
      - uses: shogo82148/actions-setup-perl@v1
        with:
          perl-version: ${{ matrix.perl-version }}
      - run: perl -V
```

## Advanced Usages

### Altering the values

Here is an example to massage the Perl versions to append the string `-buster` to all `5.\d+` versions. (TIMTODY)

```yaml
  perl-versions:
    runs-on: ubuntu-latest
    name: List Perl versions
    outputs:
      perl-versions: ${{ steps.massage.outputs.perl-versions }}
    steps:
      - id: action
        uses: perl-actions/perl-versions@v2
        with:
          since-perl: 5.10
          with-devel: true
      - id: massage
        name: add buster
        run: |
          echo '${{ steps.action.outputs.perl-versions }}' > perl.versions
          perl -pi -e 's/"(\d\.\d+)"/"$1-buster"/g' perl.versions
          cat perl.versions
          echo "perl-versions=$(cat perl.versions)" >> $GITHUB_OUTPUT
```
