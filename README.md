# Enforce Code Owner Review GitHub Action

This GitHub Action enforces code owner reviews on pull requests, ensuring that all changes are reviewed by the designated code owners before merging.

## Features

- **Automatic Enforcement**: Automatically checks if code owners have reviewed the pull requests.
- **Customizable**: Easy to integrate and configure within your GitHub workflows.

## Getting Started

To use this action in your workflow, follow these steps:

### 1. Create a Workflow

If you don't already have a workflow file, create one in your repository under `.github/workflows/`, for example, `.github/workflows/enforce-code-owner-review.yml`.

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
          node-version: '20.x'

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

## Inputs

The action supports the following inputs:

- `github-token`: **Required**. The GitHub token used to post comments and review statuses. Use `${{ secrets.GITHUB_TOKEN }}` to access the token provided by GitHub Actions.


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
