const Jira = require('./jira');

module.exports = class {
  constructor({ projectKey, summary, description, sha, issueType }, { baseUrl, apiEmail, apiToken }) {
    this.jira = new Jira(baseUrl, apiEmail, apiToken);

    this.issueType = issueType;
    this.projectKey = projectKey;
    this.summary = summary;
    this.sha = sha;
    this.description = description;
  }

  async execute() {
    const issue = await this.createIssue();
    this.markIssueAsDone(issue.key);

    return { issue: issue.key };
  }

  async createIssue() {
    const meta = await this.getMeta();
    if (meta === null) {
      return;
    }

    let providedFields = [
      {
        key: 'project',
        value: {
          id: meta.projectId,
        },
      },
      {
        key: 'issuetype',
        value: {
          id: meta.issueTypeId,
        },
      },
      {
        key: 'summary',
        value: this.summary,
      },
    ];

    if (this.description) {
      providedFields.push({
        key: 'description',
        value: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  text: `Implemented in ${this.sha}.\n\n${this.description.trim()}`,
                  type: 'text',
                },
              ],
            },
          ],
        },
      });
    }

    const payload = providedFields.reduce(
      (acc, field) => {
        acc.fields[field.key] = field.value;
        return acc;
      },
      { fields: {} }
    );

    console.log('');
    console.log('Attempting to create issue with:', payload);
    const issue = await this.jira.createIssue(payload);

    return issue;
  }

  /**
   * Attempts to find a "Done" transition for the given issue and apply it.
   */
  async markIssueAsDone(issueKey) {
    if (!issueKey) {
      return;
    }

    console.log('');
    console.log('Attempting to find issue Done transition');
    const transitions = await this.jira.findIssueDoneTransition(issueKey);

    if (!transitions) {
      return;
    }

    console.log('transitions', transitions);
    const transition = transitions.transitions.find((t) => t.name.toLowerCase() === 'done');

    if (!transition) {
      console.error(`Unable to find a "Done" transition for ${issueKey}`);
      return;
    }

    console.log('');
    console.log(`Transitioning ${issueKey} to Done`);
    await this.jira.transitionIssue(issueKey, transition.id);
  }

  /**
   * Attempts to return the projectId and issueTypeId by the provided projectKey and issueTypeName.
   * Returns null if either is not found.
   */
  async getMeta() {
    let projectId, issueTypeId;

    const { projects } = await this.jira.getCreateMeta({
      projectKeys: this.projectKey,
      issuetypeNames: this.issueType,
    });

    if (projects.length === 0) {
      console.error(`Project '${this.projectKey}' not found`);
      return null;
    } else {
      projectId = projects[0].id;
    }

    if (projects[0].issuetypes.length === 0) {
      console.error(`Issuetype '${this.issueType}' not found`);
      return null;
    } else {
      issueTypeId = projects[0].issuetypes[0].id;
    }

    return {
      projectId,
      issueTypeId,
    };
  }
};
