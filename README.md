
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
        uses: perl-actions/perl-versions@v1
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
        uses: perl-actions/perl-versions@v1
        with:
          since-perl: latest
          with-devel: true
```

### All versions from a specific release

```yaml
      - id: action
        uses: perl-actions/perl-versions@v1
        with:
          since-perl: 5.20
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
        uses: perl-actions/perl-versions@v1
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
