export default {
    branches: ["main"],
    plugins: [
      [
        "@semantic-release/commit-analyzer",
        {
          preset: "angular",
          releaseRules: [
            { type: "refactor", release: "patch" },
            { type: "patch", release: "patch" },
            { type: "fix", release: "patch" },
            { type: "deps", release: "patch" },
          ],
          parserOpts: {
            noteKeywords: ["BREAKING CHANGE", "BREAKING CHANGES"],
          },
        },
      ],
      "@semantic-release/release-notes-generator",
      "@semantic-release/github",
    ],
  };