# Enforce Code Owner Review GitHub Action

This GitHub Action enforces code owner reviews on pull requests after getting approval from user, ensuring that all changes are reviewed by the designated code owners before merging.

## Features

- **Automatic Enforcement** : Automatically checks if code owners have reviewed the pull requests.
- **Customizable** : Easy to integrate and configure within your GitHub workflows.
- **IMPORTANT** : Your repo must have CODEOWNERS file, reference at [github codeowners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- **IMPORTANT AGAIN** : Your branch must using at least 2 approvals, and both from CODEOWNERS (team / member)

## Getting Started

To use this action in your workflow, follow these steps:

### 1. Create a Workflow (on your repo)

If you don't already have a workflow file, create one in your repository under `.github/workflows/`.
i.e, `.github/workflows/enforce-code-owner-review.yml`.

### 2. Configure the Workflow (on your repo)

Add the following content to your workflow file, adjusting the parameters as necessary:

```yaml
name: Approval Validation #set name as you need

on:
  pull_request_review:
    types: [submitted] #set option as you need
    branches: #set branches from here
      - main

jobs:
  approval-validation: 
    if: github.event.review.state == 'approved' && github.event.pull_request.base.ref == 'main' #set validation again here (types and branches)
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@master

      - name: Checkout other repo
        uses: actions/checkout@master
        with:
          repository: Admin7727/enforce-code-owner-review
          ref: main #set main branch as default
          path: approval-validation
      
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '20.x' #set version as you need

      - name: Install dependencies
        run: |
          cd approval-validation
          npm install

      - name: Running github action
        uses: ./approval-validation/.github/actions
        env:
          YOUR_REPO_TOKEN: ${{ secrets.YOUR_REPO_TOKEN }} #set your token here
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }} #this one is generated
          codeowners-path: '.github/CODEOWNERS' #set codeowners located
          required_approvals: 2 #set mininum approval
```

### 3. Configure the Branch Protection Rule (on github, open your repo)

a) Branch Name Pattern:
- Set the branch name pattern to main (or the name of the branch you want to protect).

b) Set Multiple approval whenever pull request into this branch
- Tick the box for **Require a pull request before merging**
- Tick the box for **Require approvals**
- Set **Required number of approvals before merging** with minimum 2.

c) Tick the box for **Require review from Code Owners**
- This ensures that at least one approval must come from a code owner. (default by github)
- So that we need this **enfoce-code-owner-review** for multiple codeowner must given approvals before merging.

d) Set additional status check before merging:
- Check the box for **Require status checks to pass before merging**.
- This ensures that all required status checks must pass before a pull request can be merged.

e) Set value of Status Checks:
- After enabling the requirement for status checks, you will see a list of available checks or you can input specific checks that must pass
- i.e, like your "**approval-validation**" (from yaml file) before allowing a merge.
- If you want to require another checks to pass, ensure you select all relevant checks.

f) Optional: Require branches to be up to date before merging:
- Enabling this will require the branch to be up-to-date with the base branch before merging, ensuring that the PR has the latest changes from the base branch.

g) Optional: Disable by-pass rule:
- Tick the box for **Do not allow bypassing the above settings**
- If you want to ensure that even administrators cannot bypass these rules.

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

To contribute:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.
