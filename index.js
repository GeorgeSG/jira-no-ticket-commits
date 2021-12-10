const core = require('@actions/core');
const Action = require('./action');

const ALLOWED_PROJECT_KEYS = ['COL'];

/**
 * Parse the Github Workflow Input.
 */
function parseInput() {
  const message = core.getInput('commitMessage').split('\n')[0];
  const description = core.getInput('commitMessage').split('\n').slice(1).join('\n');
  const sha = core.getInput('commitSha');

  return {
    apiUrl: core.getInput('apiUrl'),
    apiEmail: core.getInput('apiEmail'),
    apiToken: core.getInput('apiToken'),
    issueType: core.getInput('issueType'),
    commit: { message, description, sha },
  };
}

/**
 * Main task function.
 */
async function exec() {
  const { apiUrl, apiEmail,apiToken, issueType, commit } = parseInput();
  const { message, description, sha } = commit;

  console.log('Starting workflow with commit message:', message);

  const expectedKey = message.split('_TICKET: ')[0];

  if (!ALLOWED_PROJECT_KEYS.includes(expectedKey)) {
    const error = `Project key ${expectedKey} unrecognized or unsupported`;

    console.error(error);
    core.setOutput(error);
    return;
  }

  try {
    const action = new Action(
      {
        projectKey: expectedKey,
        summary: message,
        description,
        sha,
        issueType,
      },
      {
        baseUrl: apiUrl,
        apiEmail,
        apiToken,
      }
    );

    const result = await action.execute();
    core.setOutput('New issue key', result.issue.key);
  } catch (error) {
    core.setFailed(error.message);
  }
}

exec();
