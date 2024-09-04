const core = require('@actions/core');
const github = require('@actions/github');
let Octokit;

// Load dependencies dynamically
async function loadDependencies() {
  if (!Octokit) {
    const octokitModule = await import("@octokit/rest");
    Octokit = octokitModule.Octokit; // Ensure Octokit is globally available
  }
}

// Fetch team members from a GitHub organization team
async function getTeamMembers(octokit, org, team_slug) {
  try {
    const { data: teamMembers } = await octokit.teams.listMembersInOrg({
      org,
      team_slug,
    });
    return teamMembers.map(member => member.login);
  } catch (err) {
    core.setFailed(`Failed to fetch team members for ${team_slug}: ${err.message}`);
    return []; // Return an empty array on failure
  }
}

// Retrieve CODEOWNERS content from a repository
async function getCodeOwnersContent(octokit, owner, repo, codeOwnerPath) {
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: codeOwnerPath,
    });
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    if (content.trim() !== '') {
      return content; // Return the content as soon as it's found
    }
  } catch (err) {
    core.setFailed('CODEOWNERS file not found.');
    return null; // Return null if not found after checking all locations
  }
}

// List code owner approvals for a pull request
async function listCodeOwnerApprovals(octokit, owner, repo, pull_number, codeOwnersContent) {
  const { data: reviews } = await octokit.pulls.listReviews({
    owner,
    repo,
    pull_number,
  });

  // Process CODEOWNERS file content (team or individual users)
  const lines = codeOwnersContent.split('\n').filter(line => !line.startsWith('#') && line.trim() !== '');
  let codeOwners = [];
  for (const line of lines) {
    const parts = line.split(/\s+/).slice(1);
    for (const part of parts) {
      if (part.startsWith('@') && part.includes('/')) { // team
        const [org, team_slug] = part.slice(1).split('/');
        const teamMembers = await getTeamMembers(octokit, org, team_slug);
        codeOwners = codeOwners.concat(teamMembers);
      } else {
        codeOwners.push(part.replace('@', '')); // user
      }
    }
  }

  // Filter approved reviews and match with code owners
  const approvedUsers = reviews.filter(review => review.state === 'APPROVED').map(review => review.user.login);
  const matchedApprovals = approvedUsers.filter(username => codeOwners.includes(username)).length;

  // Log approval details
  console.log("=====================================");
  console.log("Code owners list : ", codeOwners);
  console.log("Approved given by : ", approvedUsers);
  console.log("=====================================");

  return matchedApprovals; // Return the count of matched approvals
}

async function main() {
  try {
    await loadDependencies();
    const this_octokit = new Octokit({ auth: process.env.AOSB2C_TOKEN }); //set YOUR_REPO_TOKEN here
    const this_codeOwnerPath = core.getInput('codeowners_path'); //params from workflow file
    const this_requiredApprovals = core.getInput('required_approvals'); //params from workflow file

    if (!this_codeOwnerPath) {
      throw new Error("CODEOWNERS file path not provided.");
    }

    if (!this_requiredApprovals) {
      throw new Error("Required approvals count not provided.");
    }

    const { owner, repo } = github.context.repo;
    const pull_number = github.context.issue.number;

    // Fetch CODEOWNERS content using the custom path
    const codeOwnersContent = await getCodeOwnersContent(this_octokit, owner, repo, this_codeOwnerPath);
    if (!codeOwnersContent) return; // Exit if CODEOWNERS content not found

    // Check for approvals from code owners
    const approvals = await listCodeOwnerApprovals(this_octokit, owner, repo, pull_number, codeOwnersContent);

    if (approvals < this_requiredApprovals) {
    core.setFailed("Need more approvals from code owner.");
    } else {
    console.log("Approved by code owners.");
    }
    
  } catch (err) {
    console.error(err);
    core.setFailed(err.message);
  }
}

main();