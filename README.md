
# perl-versions

Github action for your matrix to generate list of perls since given.

## Parameters

### since-perl

Required parameter.

For list of available perl versions check
[docker-perl-tester](https://github.com/Perl/docker-perl-tester#using-docker-images-for-your-projects)

Returns perl versions since this (including).

When unknown version is provided, returns empty list.

### with-devel

Default: `false`

When set to `true`, returned list will also include current `devel` version of Perl,
if available.

## Usage

```yaml
jobs:
  perl-versions:
    runs-on: ubuntu-latest
    name: List perl versions
    outputs:
      perl-versions: ${{ steps.action.outputs.perl-versions }}
    steps:
      - name: Perl versions action step
        id: action
        uses: perl-actions/perl-versions@v1
        with:
          since-perl: v5.20

  test:
    needs:
      - perl-versions
    strategy:
      matrix:
        perl-versions: ${{ fromJson (needs.perl-versions.outputs.perl-versions) }}

```

# Reusable workflow

There is also reusable workflow simplifying call of this action.

## Inputs

### since-perl

Forwarded to action.

## Outputs

### perl-version

String containing JSON array with list of Perl versions.

## Usage

```yaml
jobs:
  perl-versions:
    uses: perl-actions/perl-versions@v1
    with:
      since-perl: 5.14

  test:
    needs:
      - perl-versions
    strategy:
      matrix:
        perl-versions: ${{ fromJson (needs.perl-versions.outputs.perl-versions) }}
```
