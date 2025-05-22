const core = require('@actions/core');
const github = require('@actions/github');

/**
 * Get the previous release tag from GitHub
 * @param {Object} octokit - GitHub API client
 * @param {Object} context - GitHub context
 * @returns {Promise<string>} Previous release tag or "0.0.0" if none exists
 */
async function getPreviousTag(octokit, context) {
  try {
    const { data: releases } = await octokit.rest.repos.listReleases({
      owner: context.repo.owner,
      repo: context.repo.repo,
      per_page: 1,
      page: 1
    });

    if (releases.length === 0) {
      await core.summary.addRaw('ℹ️ **No previous releases found.** This will be the first release.\n\n');
      return '0.0.0';
    }

    const previousTag = releases[0].tag_name;
    await core.summary.addRaw(`🏷️ **Previous release tag:** \`${previousTag}\`\n\n`);
    return previousTag;
  } catch (error) {
    core.setFailed(`Failed to get previous releases: ${error.message}`);
    throw error;
  }
}

/**
 * Calculate the new version based on CalVer format
 * @param {string} previousTag - Previous release tag
 * @returns {Promise<string>} New release tag
 */
async function calculateNewVersion(previousTag) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11

  const nextYearMonth = `${currentYear}.${currentMonth}`;

  // Parse previous tag
  const tagParts = previousTag.split('.');
  const previousYear = parseInt(tagParts[0]) || 0;
  const previousMonth = parseInt(tagParts[1]) || 0;
  const previousPatch = parseInt(tagParts[2]) || 0;

  // Add version components table to summary
  let nextPatch;
  let nextPatchIcon;
  if (`${previousYear}.${previousMonth}` === nextYearMonth) {
    nextPatch = previousPatch + 1;
    nextPatchIcon = '🔼';
  } else {
    nextPatch = 0;
    nextPatchIcon = '🔄';
  }

  const releaseTag = `${nextYearMonth}.${nextPatch}`;
  await core.summary.addRaw(`🚀 **New release tag:** \`${releaseTag}\`\n\n`);

  await core.summary.addRaw('### Version Components\n\n');
  await core.summary.addTable([
    [
      { data: 'Component', header: true },
      { data: 'Previous Value', header: true },
      { data: 'New Value', header: true }
    ],
    ['Year', previousYear.toString(), currentYear.toString()],
    ['Month', previousMonth.toString(), currentMonth.toString()],
    ['Patch', previousPatch.toString(), nextPatch.toString() + ' ' + nextPatchIcon]
  ]);

  return releaseTag;
}

/**
 * Create a new GitHub release
 * @param {Object} octokit - GitHub API client
 * @param {Object} context - GitHub context
 * @param {string} releaseTag - Release tag to create
 * @param {boolean} isDraft - Whether to create as draft
 * @returns {Promise<string>} Release URL
 */
async function createRelease(octokit, context, releaseTag, isDraft) {
  await core.summary.addRaw('## 🔄 Release Process\n\n');
  await core.summary.addRaw('⏳ Creating release...\n\n');

  try {
    const { data: release } = await octokit.rest.repos.createRelease({
      owner: context.repo.owner,
      repo: context.repo.repo,
      tag_name: releaseTag,
      name: releaseTag,
      draft: isDraft,
      generate_release_notes: true
    });

    const releaseUrl = release.html_url;
    await core.summary.addRaw('✅ **Release created successfully!**\n\n');
    await core.summary.addRaw(`📎 **Release URL:** [${releaseUrl}](${releaseUrl})\n\n`);

    return releaseUrl;
  } catch (error) {
    core.setFailed(`Failed to create release: ${error.message}`);
    throw error;
  }
}

/**
 * Add dry run summary
 * @param {string} releaseTag - The tag that would be created
 */
async function addDryRunSummary(releaseTag) {
  await core.summary.addRaw('## 🔍 Dry Run Mode\n\n');
  await core.summary.addRaw('⚠️ **This was a dry run. No release was created.**\n\n');
  await core.summary.addRaw(`If this was a real run, version \`${releaseTag}\` would have been created.\n\n`);
  await core.summary.addRaw('To create an actual release, run with `dry-run` set to `false`.\n\n');
  await core.summary.addRaw('✅ **Dry run completed successfully**\n\n');
}

/**
 * Add outputs summary
 * @param {string} releaseTag - Release tag
 * @param {string} previousTag - Previous tag
 * @param {string} releaseUrl - Release URL (empty if dry run)
 * @param {boolean} isDryRun - Whether this was a dry run
 */
async function addOutputsSummary(releaseTag, previousTag, releaseUrl, isDryRun) {
  await core.summary.addRaw('## 📤 Action Outputs\n\n');

  const outputsTable = [
    [
      { data: 'Output', header: true },
      { data: 'Value', header: true }
    ],
    ['release-tag', `\`${releaseTag}\``],
    ['previous-tag', `\`${previousTag}\``]
  ];

  if (!isDryRun && releaseUrl) {
    outputsTable.push(['release-url', `[${releaseUrl}](${releaseUrl})`]);
  }

  await core.summary.addTable(outputsTable);
}

/**
 * Main function
 */
async function run() {
  try {
    // Initialize summary
    await core.summary.addRaw('# 📅 CalVer Release Process\n\n');
    await core.summary.addRaw('## 📋 Release Information\n\n');

    // Get inputs
    const githubToken = core.getInput('github-token', { required: true });
    const isDryRun = core.getBooleanInput('dry-run');
    const isDraft = core.getBooleanInput('draft');

    // Initialize GitHub client
    const octokit = github.getOctokit(githubToken);
    const context = github.context;

    // Get previous tag
    const previousTag = await getPreviousTag(octokit, context);
    core.setOutput('previous-tag', previousTag);

    // Calculate new version
    const releaseTag = await calculateNewVersion(previousTag);
    core.setOutput('release-tag', releaseTag);

    let releaseUrl = '';

    if (isDryRun) {
      await addDryRunSummary(releaseTag);
    } else {
      releaseUrl = await createRelease(octokit, context, releaseTag, isDraft);
      core.setOutput('release-url', releaseUrl);
    }

    // Add outputs summary
    await addOutputsSummary(releaseTag, previousTag, releaseUrl, isDryRun);

    // Write the summary
    await core.summary.write();

    core.info(`Successfully ${isDryRun ? 'simulated' : 'created'} release ${releaseTag}`);
  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
  }
}

// Run the action
if (require.main === module) {
  run();
}

module.exports = { run };
