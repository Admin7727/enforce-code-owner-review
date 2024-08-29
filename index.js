const core = require('@actions/core');
const github = require('@actions/github');
const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function getCodeOwnersContent(owner, repo) {
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: '.github/CODEOWNERS',
    });
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return content;
  } catch (error) {
    core.setFailed(`Failed to fetch CODEOWNERS file: ${error.message}`);
    return null;
  }
}

async function listCodeOwnerApprovals(owner, repo, pull_number, codeOwnersContent) {
  const { data: reviews } = await octokit.pulls.listReviews({
    owner,
    repo,
    pull_number,
  });

  // Parse the CODEOWNERS content to extract users
  const codeOwners = codeOwnersContent
    .split('\n') // Split by new line
    .filter(line => !line.startsWith('#') && line.trim() !== '') // Filter out comments and empty lines
    .flatMap(line => line.split(/\s+/).slice(1)) // Split each line by whitespace and skip the first part (file pattern)
    .map(owner => owner.replace('@', '')); // Remove '@' from usernames

  const approvedReviews = reviews.filter(review => review.state === 'APPROVED');
  const codeOwnerApprovals = approvedReviews.filter(review => {
    // Check if the approver's login is in the list of code owners
    return codeOwners.includes(review.user.login);
  });

  return codeOwnerApprovals.length;
}

async function main() {
  const { owner, repo } = github.context.repo;
  const pull_number = github.context.issue.number;

  const codeOwnersContent = await getCodeOwnersContent(owner, repo);
  if (!codeOwnersContent) return;

  const approvalCount = await listCodeOwnerApprovals(owner, repo, pull_number, codeOwnersContent);

  if (approvalCount < 2) {
    core.setFailed("Not enough code owner approvals. Minimum 2 approvals required.");
  } else {
    console.log("Sufficient code owner approvals.");
  }
}

main().catch(err => {
  console.error(err);
  core.setFailed(err.message);
});