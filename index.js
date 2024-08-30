const core = require('@actions/core');
const github = require('@actions/github');
let Octokit;

async function loadDependencies() {
  const octokitModule = await import("@octokit/rest");
  Octokit = octokitModule.Octokit;
}

async function getCodeOwnersContent(octokit, owner, repo) {
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

async function listCodeOwnerApprovals(octokit, owner, repo, pull_number, codeOwnersContent) {
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

  const approvedUsers = reviews.filter(review => review.state === 'APPROVED').map(review => review.user.login);
  const matchedApprovals = approvedUsers.filter(username =>  codeOwners.includes(username)).length;

  // Log the list of code owners
  console.log("=====================================");
  console.log("Code Owners: \n", codeOwners);
  console.log("=====================================");
  console.log("Approved given by: \n", approvedUsers);
  console.log("=====================================");
  console.log("Matched Approval : \n", matchedApprovals);
  console.log("=====================================");

  return matchedApprovals;
}

async function main() {
  try {
    // console.log("=====================================");
    // console.log("AOSB2C_TOKEN:", process.env.AOSB2C_TOKEN);
    // console.log("APPROVAL_COUNT:", process.env.APPROVAL_COUNT);
    // console.log("=====================================");

    await loadDependencies();
    const this_octokit = new Octokit({ auth: process.env.AOSB2C_TOKEN });

    const { owner, repo } = github.context.repo;
    const pull_number = github.context.issue.number;

    const codeOwnersContent = await getCodeOwnersContent(this_octokit, owner, repo);
    if (!codeOwnersContent) return;

    const approvals = await listCodeOwnerApprovals(this_octokit, owner, repo, pull_number, codeOwnersContent);

    // if (process.env.APPROVAL_COUNT) {
      
    // } else {
    //   core.setFailed("Parameter 'APPROVAL_COUNT' is not set. Please check the workflow file.");
    // }

    if (approvals < 2) {
      core.setFailed("Not enough approvals from code owner.");
    } else {
      console.log("Sufficient approvals from code owner.");
    }
    
  } catch (err) {
    console.error(err);
    core.setFailed(err.message);
  }
}

main();