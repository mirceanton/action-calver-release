# Calendar Versioning Release Action

A GitHub Action that creates new releases using Calendar Versioning (CalVer) with the format `YYYY.MM.PATCH`.

## Features

- Automatically generates the next version number based on the date
- Increments patch number if a release already exists for the current month
- Supports dry run mode for testing
- Generates release notes automatically

## Usage

### Basic Usage

```yaml
name: Release

on:
  # Manually trigger "wet"/"dry" runs from the action tab
  workflow_dispatch:
    inputs:
      dry-run:
        description: Dry Run
        default: false
        required: false
        type: boolean

  # "Wet" run on any push to the main branch that changes a relevant file
  push:
    branches: ["main"]
    paths:
      - action.yml
      - .github/workflows/release.yaml

  # "Dry" run on any PR to the main branch that changes a relevant file
  pull_request:
    branches: ["main"]
    paths:
      - action.yml
      - .github/workflows/release.yaml

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
        with:
          token: "${{ secrets.GITHUB_TOKEN }}"

      - name: Create Release
        uses: mirceanton/action-calver-release@2025.4.0
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          dry-run: ${{ (inputs.dry-run || github.event_name == 'pull_request') }}

```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `github-token` | GitHub token with repository access | Yes | N/A |
| `dry-run` | Perform a dry run without creating an actual release | No | `false` |

## Versioning

This action follows - obviously - [Calendar Versioning](https://calver.org/).

## License

MIT
