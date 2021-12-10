# no-ticket-commits-jira

Github action that creates JIRA tickets when a commit starting with NO_TICKET is pushed to a branch.

## Configure
Update the `ALLOWED_PROJECT_KEYS` array in `index.js`.

## Build

- Use node `v12`
- `npm i`
- `npm build`.

## Use as a private action
- Copy the `dist` file and the `action.yml` in the repo where the workflow should run.
- Define a workflow.

Example:
```yaml
on: [push]

jobs:
  no-ticket-commits-jira-job:
    runs-on: ubuntu-latest
    name: Create JIRA issue for NO_TICKET Commits
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: no_ticket_create_jira_isssue
        uses: ./.github/actions/jira # Uses an action in the root directory
        id: jira
        with:
          apiUrl: https://georgi-test.atlassian.net/
          apiEmail: ${{ secrets.ATLASSIAN_EMAIL }} # setup in Github Secrets
          apiToken: ${{ secrets.ATLASSIAN_TOKEN }} # Setup in Github Secrets
          issueType: Task  ## issueType Name. Should be available in all supported projects.
          commitMessage: ${{ github.event.head_commit.message }}
          commitSha: ${{ github.event.head_commit.sha }}
```
