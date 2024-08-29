# Enforce Code Owner Review GitHub Action

This GitHub Action enforces code owner reviews on pull requests, ensuring that all changes are reviewed by the designated code owners before merging.

## Features

- **Automatic Enforcement**: Automatically checks if code owners have reviewed the pull requests.
- **Customizable**: Easy to integrate and configure within your GitHub workflows.

## Getting Started

To use this action in your workflow, follow these steps:

### 1. Create a Workflow

If you don't already have a workflow file, create one in your repository under `.github/workflows/`, for example, `.github/workflows/code-owner-review.yml`.

### 2. Configure the Workflow

Add the following content to your workflow file, adjusting the parameters as necessary:

```yaml
name: Enforce Code Owner Review

on: [pull_request]

jobs:
  code-owner-review:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Enforce Code Owner Review
      uses: Admin7727/enforce-code-owner-review@v1
      with:
        repo-token: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

The action supports the following inputs:

- `repo-token`: **Required**. The GitHub token used to post comments and review statuses. Use `${{ secrets.GITHUB_TOKEN }}` to access the token provided by GitHub Actions.

## Example Usage

Here's a complete example of how to use this action in a workflow:

```yaml
name: Code Owner Review Enforcement

on: [pull_request]

jobs:
  enforce-review:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Enforce Review
      uses: Admin7727/enforce-code-owner-review@v1
      with:
        repo-token: ${{ secrets.GITHUB_TOKEN }}
```

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