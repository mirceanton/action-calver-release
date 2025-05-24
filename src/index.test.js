const { run } = require('./index');
const core = require('@actions/core');
const github = require('@actions/github');

// Mock the GitHub Actions toolkit
jest.mock('@actions/core');
jest.mock('@actions/github');

describe('CalVer Release Action', () => {
  let mockOctokit;
  let mockContext;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Mock GitHub context
    mockContext = {
      repo: {
        owner: 'test-owner',
        repo: 'test-repo'
      }
    };

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
    github.context = mockContext;

    // Mock core.summary
    core.summary = {
      addRaw: jest.fn().mockResolvedValue(undefined),
      addTable: jest.fn().mockResolvedValue(undefined),
      write: jest.fn().mockResolvedValue(undefined)
    };

    // Mock other core functions
    core.getInput = jest.fn();
    core.getBooleanInput = jest.fn();
    core.setOutput = jest.fn();
    core.setFailed = jest.fn();
    core.info = jest.fn();
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
        return false;
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
    expect(mockOctokit.rest.repos.createRelease).toHaveBeenCalled();
    expect(core.setOutput).toHaveBeenCalledWith('release-url', releaseUrl);
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
