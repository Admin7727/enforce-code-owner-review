const core = require('@actions/core');
const github = require('@actions/github');
let Octokit;

async function loadDependencies() {
  const octokitModule = await import("@octokit/rest");
  Octokit = octokitModule.Octokit;
}

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

  const codeOwners = codeOwnersContent
    .split('\n')
    .filter(line => !line.startsWith('#') && line.trim() !== '')
    .flatMap(line => line.split(/\s+/).slice(1))
    .map(owner => owner.replace('@', ''));

  const approvedReviews = reviews.filter(review => review.state === 'APPROVED');
  const codeOwnerApprovals = approvedReviews.filter(review => codeOwners.includes(review.user.login));

  return codeOwnerApprovals.length;
}

async function main() {
  try {
    await loadDependencies();
    const octokit = new Octokit({ auth: process.env.AOSB2C_TOKEN });

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
  } catch (err) {
    console.error(err);
    core.setFailed(err.message);
  }
}

main();