const fetch = require('node-fetch');

module.exports = class {
  constructor(baseUrl, email, token) {
    this.baseUrl = baseUrl;
    this.token = token;
    this.email = email;
  }

  /**
   * Search for existing projects and issue types - to use the metadata when creating new issues.
   * See {@link https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-createmeta-get API Docs}
   */
  async getCreateMeta(query) {
    return this.fetch({ pathname: '/rest/api/3/issue/createmeta', query });
  }

  /**
   * Creaje new issue
   * See {@link https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-post API Docs}
   */
  async createIssue(body) {
    return this.fetch({ pathname: '/rest/api/3/issue' }, { method: 'POST', body });
  }

  async findIssueDoneTransition(issueId) {
    return this.fetch({ pathname: `/rest/api/3/issue/${issueId}/transitions`});
  }

  async transitionIssue(issueId, transitionId) {
    return this.fetch(
      { pathname: `/rest/api/3/issue/${issueId}/transitions`},
      { method: 'POST', body: { transition: { id: transitionId } } }
    );
  }

  async fetch({ pathname, query }, { method = 'GET', body, headers = {} } = {}) {
    const url = new URL(this.baseUrl);
    url.pathname = pathname;

    if (query) {
      url.search = new URLSearchParams(query);
    }

    if (headers['Content-Type'] === undefined) {
      headers['Content-Type'] = 'application/json';
    }

    if (headers['Authorization'] === undefined) {
      headers['Authorization'] = `Basic ${Buffer.from(`${this.email}:${this.token}`).toString(
        'base64'
      )}`;
    }

    if (body && headers['Content-Type'] === 'application/json') {
      body = JSON.stringify(body);
    }

    const request = {
      method,
      headers,
      body,
    };

    let response;

    try {
      console.log('');
      console.log('Calling API method:', url.href);

      response = await this.callApi(url.href, request);
    } catch (error) {
      console.error('API error', error);
      throw Object.assign(new Error('Jira API error'));
    }

    return response.body;
  }

  async callApi(url, request) {
    const response = await fetch(url, request);

    let result = {
      headers: response.headers,
      status: response.status,
      body: '',
    };

    result.body = await response.text();

    const isJSON = (response.headers.get('content-type') || '').includes('application/json');

    if (isJSON && result.body) {
      result.body = JSON.parse(result.body);
    }

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return result;
  }
};
