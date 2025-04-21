# Calendar Versioning Release Action

A GitHub Action that creates new releases using Calendar Versioning (CalVer) with the format `YYYY.MM.PATCH`.

## Features

- Automatically generates the next version number based on the date
- Increments patch number if a release already exists for the current month
- Supports dry run mode for testing
- Generates [release notes](https://github.com/mirceanton/action-calver-release/releases/tag/2025.4.1) automatically
- Emits useful [outputs](#outputs) for other downstream jobs
- Generates [job summaries](https://github.com/mirceanton/action-calver-release/actions/runs/14502744077)

## Example Usage

```yaml
---
name: Release

on:
  # Manually trigger a new release from the Actions tab
  workflow_dispatch:
    inputs:
      dry-run:
        description: Dry Run
        default: false
        required: false
        type: boolean
      draft:
        description: Draft Release
        default: false
        required: false
        type: boolean

  # Dry run on any PR to the main branch to make sure the workflow would run
  # successfully before merging
  pull_request:
    branches: ["main"]

  # Automatically create releases on every push to the main branch
  push:
    branches: ["main"]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
        with:
          token: "${{ secrets.GITHUB_TOKEN }}"

      - name: Create Release
        uses: mirceanton/action-calver-release@2025.4.1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          dry-run: ${{ (inputs.dry-run || github.event_name == 'pull_request') }}
          draft: ${{ inputs.draft }}

```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `github-token` | GitHub token with repository access | Yes | N/A |
| `dry-run` | Perform a dry run without creating an actual release | No | `false` |
| `draft` | Create release as a draft (unpublished). | No | `false` |

## Outputs

| Output | Description |
|--------|-------------|
| `release-tag` | The generated release tag (e.g., 2025.4.0) |
| `previous-tag` | The previous release tag that was used as reference |
| `release-url` | URL to the created GitHub release |

## How It Works

1. Retrieves the previous release tag using GitHub CLI
2. Extracts the year, month, and patch components from the previous tag
3. Compares with the current date to determine if a new month has started
4. Generates the new release tag:
   - For the same month: increments patch number by 1
   - For a new month: resets patch number to 0
5. Creates a GitHub release with the new tag and auto-generated notes
6. Provides the release URL and tag information as outputs

## Versioning

This action follows - obviously - [Calendar Versioning](https://calver.org/).

## License

MIT
