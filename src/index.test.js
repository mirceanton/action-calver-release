import { jest, describe, test, expect, beforeEach } from '@jest/globals';

// Mock the GitHub Actions toolkit before importing
jest.unstable_mockModule('@actions/core', () => ({
  getInput: jest.fn(),
  getBooleanInput: jest.fn(),
  setOutput: jest.fn(),
  setFailed: jest.fn(),
  info: jest.fn(),
  summary: {
    addRaw: jest.fn().mockResolvedValue(undefined),
    addTable: jest.fn().mockResolvedValue(undefined),
    write: jest.fn().mockResolvedValue(undefined)
  }
}));

jest.unstable_mockModule('@actions/github', () => ({
  getOctokit: jest.fn(),
  context: {
    repo: {
      owner: 'test-owner',
      repo: 'test-repo'
    }
  }
}));

// Import modules after mocking
const core = await import('@actions/core');
const github = await import('@actions/github');
const { run } = await import('./index.js');

describe('CalVer Release Action', () => {
  let mockOctokit;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Mock Octokit
    mockOctokit = {
      rest: {
        repos: {
          listReleases: jest.fn(),
          createRelease: jest.fn()
        }
      }
    };

    // Mock GitHub modules
    github.getOctokit.mockReturnValue(mockOctokit);

    // Reset summary mocks
    core.summary.addRaw.mockResolvedValue(undefined);
    core.summary.addTable.mockResolvedValue(undefined);
    core.summary.write.mockResolvedValue(undefined);
  });

  test('should handle first release (no previous releases)', async () => {
    // Setup
    core.getInput.mockImplementation((name) => {
      switch (name) {
        case 'github-token':
          return 'test-token';
        default:
          return '';
      }
    });
    core.getBooleanInput.mockImplementation((name) => {
      switch (name) {
        case 'dry-run':
          return true;
        case 'draft':
          return false;
        default:
          return false;
      }
    });

    mockOctokit.rest.repos.listReleases.mockResolvedValue({
      data: []
    });

    // Execute
    await run();

    // Verify
    expect(core.setOutput).toHaveBeenCalledWith('previous-tag', '0.0.0');
    expect(core.setOutput).toHaveBeenCalledWith('release-tag', expect.stringMatching(/^\d{4}\.\d{1,2}\.0$/));
    expect(core.summary.write).toHaveBeenCalled();
  });

  test('should increment patch for same month release', async () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const previousTag = `${currentYear}.${currentMonth}.5`;

    // Setup
    core.getInput.mockImplementation((name) => {
      switch (name) {
        case 'github-token':
          return 'test-token';
        default:
          return '';
      }
    });
    core.getBooleanInput.mockImplementation((name) => {
      switch (name) {
        case 'dry-run':
          return true;
        case 'draft':
          return false;
        default:
          return false;
      }
    });

    mockOctokit.rest.repos.listReleases.mockResolvedValue({
      data: [{ tag_name: previousTag }]
    });

    // Execute
    await run();

    // Verify
    expect(core.setOutput).toHaveBeenCalledWith('previous-tag', previousTag);
    expect(core.setOutput).toHaveBeenCalledWith('release-tag', `${currentYear}.${currentMonth}.6`);
  });

  test('should reset patch for new month release', async () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const previousTag = `${previousYear}.${previousMonth}.5`;

    // Setup
    core.getInput.mockImplementation((name) => {
      switch (name) {
        case 'github-token':
          return 'test-token';
        default:
          return '';
      }
    });
    core.getBooleanInput.mockImplementation((name) => {
      switch (name) {
        case 'dry-run':
          return true;
        case 'draft':
          return false;
        default:
          return false;
      }
    });

    mockOctokit.rest.repos.listReleases.mockResolvedValue({
      data: [{ tag_name: previousTag }]
    });

    // Execute
    await run();

    // Verify
    expect(core.setOutput).toHaveBeenCalledWith('previous-tag', previousTag);
    expect(core.setOutput).toHaveBeenCalledWith('release-tag', `${currentYear}.${currentMonth}.0`);
  });

  test('should create actual release when not in dry-run mode', async () => {
    const releaseUrl = 'https://github.com/test-owner/test-repo/releases/tag/2025.1.0';

    // Setup
    core.getInput.mockImplementation((name) => {
      switch (name) {
        case 'github-token':
          return 'test-token';
        default:
          return '';
      }
    });
    core.getBooleanInput.mockImplementation((name) => {
      switch (name) {
        case 'dry-run':
          return false;
        case 'draft':
          return false; // Explicitly set draft to false
        default:
          return false;
      }
    });

    mockOctokit.rest.repos.listReleases.mockResolvedValue({
      data: []
    });

    mockOctokit.rest.repos.createRelease.mockResolvedValue({
      data: { html_url: releaseUrl }
    });

    // Execute
    await run();

    // Verify
    expect(mockOctokit.rest.repos.createRelease).toHaveBeenCalledWith(
      expect.objectContaining({
        draft: false
      })
    );
    expect(core.setOutput).toHaveBeenCalledWith('release-url', releaseUrl);
  });

  test('should create a draft release when draft mode is enabled', async () => {
    const releaseUrl = 'https://github.com/test-owner/test-repo/releases/tag/2025.1.0';

    // Setup
    core.getInput.mockImplementation((name) => {
      switch (name) {
        case 'github-token':
          return 'test-token';
        default:
          return '';
      }
    });
    core.getBooleanInput.mockImplementation((name) => {
      switch (name) {
        case 'dry-run':
          return false;
        case 'draft':
          return true;
        default:
          return false;
      }
    });

    mockOctokit.rest.repos.listReleases.mockResolvedValue({
      data: []
    });

    mockOctokit.rest.repos.createRelease.mockResolvedValue({
      data: { html_url: releaseUrl }
    });

    // Execute
    await run();

    // Verify
    expect(mockOctokit.rest.repos.createRelease).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: 'test-owner',
        repo: 'test-repo',
        draft: true
      })
    );
    expect(core.setOutput).toHaveBeenCalledWith('release-url', releaseUrl);
    expect(core.info).toHaveBeenCalledWith(expect.stringContaining('created'));
  });

  test('should handle API errors gracefully', async () => {
    // Setup
    core.getInput.mockImplementation((name) => {
      switch (name) {
        case 'github-token':
          return 'test-token';
        default:
          return '';
      }
    });
    core.getBooleanInput.mockReturnValue(false);

    mockOctokit.rest.repos.listReleases.mockRejectedValue(new Error('API Error'));

    // Execute
    await run();

    // Verify
    expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('API Error'));
  });
});
