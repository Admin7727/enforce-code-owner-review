const core = require('@actions/core');
const github = require('@actions/github');
let Octokit;

async function loadDependencies() {
  if (!Octokit) {
    const octokitModule = await import("@octokit/rest");
    Octokit = octokitModule.Octokit;
  }
}

async function getTeamMembers(octokit, org, team_slug) {
  try {
    const { data: teamMembers } = await octokit.teams.listMembersInOrg({
      org,
      team_slug,
    });
    return teamMembers.map(member => member.login);
  } catch (error) {
    core.setFailed(`Failed to fetch team members for ${team_slug}: ${error.message}`);
    return [];
  }
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

  const lines = codeOwnersContent.split('\n').filter(line => !line.startsWith('#') && line.trim() !== '');
  let codeOwners = [];
  for (const line of lines) {
    const parts = line.split(/\s+/).slice(1);
    for (const part of parts) {
      if (part.startsWith('@') && part.includes('/')) { // Indicates a team
        const [org, team_slug] = part.slice(1).split('/');
        const teamMembers = await getTeamMembers(octokit, org, team_slug);
        codeOwners = codeOwners.concat(teamMembers);
      } else {
        codeOwners.push(part.replace('@', ''));
      }
    }
  }

  const approvedUsers = reviews.filter(review => review.state === 'APPROVED').map(review => review.user.login);
  const matchedApprovals = approvedUsers.filter(username => codeOwners.includes(username)).length;

  console.log("=====================================");
  console.log("Code owners list : ", codeOwners);
  console.log("Approved given by : ", approvedUsers);
  console.log("Matched approval : ", matchedApprovals);
  console.log("=====================================");

  return matchedApprovals;
}

async function main() {
  try {
    await loadDependencies();
    const this_octokit = new Octokit({ auth: process.env.AOSB2C_TOKEN });

    const { owner, repo } = github.context.repo;
    const pull_number = github.context.issue.number;

    // Assuming getCodeOwnersContent now fetches team members
    const teamMembers = await getCodeOwnersContent(this_octokit, owner, repo);
    if (!teamMembers) return;

    // Assuming listCodeOwnerApprovals now checks for approvals from team members
    const approvals = await listCodeOwnerApprovals(this_octokit, owner, repo, pull_number, teamMembers);

    if (approvals < 2) {
    core.setFailed("Not enough approvals from code owner team.");
    } else {
    console.log("Sufficient approvals from code owner team.");
    }
    
  } catch (err) {
    console.error(err);
    core.setFailed(err.message);
  }
}

main();