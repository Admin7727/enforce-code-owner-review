# Enforce Code Owner Review GitHub Action

This GitHub Action ensures that pull requests are reviewed by designated code owners before merging, enhancing the security and integrity of your codebase.

There are several key features :

- **Automated Checks**: Verifies that code owners have reviewed pull requests.
- **Flexibility**: Easily integrates with your GitHub workflows, allowing for customization.
- **Prerequisites**: Requires a CODEOWNERS file in the repository. For more information, visit [GitHub's documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners).
- **Approval Requirement**: Your branch must receive a minimum of 2 approvals from CODEOWNERS.

And here is list of setup guide :
1. [Workflows Creation](https://github.com/Admin7727/enforce-code-owner-review/blob/main/README.md#1-workflows-creation)
2. [Configure the Workflow](https://github.com/Admin7727/enforce-code-owner-review/blob/main/README.md#2-configure-the-workflow)
3. [Configure the CODEOWNERS file](https://github.com/Admin7727/enforce-code-owner-review/blob/main/README.md#3-configure-the-codeowners-file)
4. [Branch Protection Rules](https://github.com/Admin7727/enforce-code-owner-review/blob/main/README.md#4-configure-the-codeowners-file)

==

### 1. Workflows Creation
Create a workflow file in your root directory `.github/workflows/`, e.g., `.github/workflows/enforce-code-owner-review.yml`, if it doesn't already exist.

==

### 2. Configure the Workflow
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
          codeowners_path: '.github/CODEOWNERS' #set codeowners located
          required_approvals: 2 #set at least 2 or more for approvals 
```

==

### 3. Configure the CODEOWNERS file
Ensure your CODEOWNERS file follows one of the formats below, adjusting for your specific needs:
```md
# Global ownership rules
* @organization_name/code_owner_team
```
or

```md
# Global ownership rules
* @first_user @second_user
```
These examples are intended solely for **Global Ownership Rules**. If you already have another format, please reconsider or modify them further to ensure they align with your format.

==

### 4. Branch Protection Rules (on GitHub, open your repository)
Configure branch protection in your GitHub repository settings:
- **Branch Name Pattern**:
  - Specify the branch to protect, typically `main`.
- **Pull Request Requirements**:
  - Enable **Require a pull request before merging**.
  - Enable **Require approvals**, setting the minimum number of approvals to 2.
  - Enable **Require review from Code Owners**
- **Status Checks**:
  - Enable **Require status checks to pass before merging**.
  - Specify necessary status checks, such as `approval-validation`.
- **Additional Options**:
  - Consider requiring branches to be up to date before merging.
  - Optionally, disable the ability to bypass these settings, even for administrators.

==

## Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

To contribute:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

==

## License
Distributed under the MIT License. See `LICENSE` for more information.
