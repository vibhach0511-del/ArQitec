import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const REPO_OWNER = 'vibhach0511-del';
const REPO_NAME = 'ArQitec';
const BRANCH = 'main';

async function githubRequest(path, method = 'GET', body = null, token) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`GitHub API error ${res.status}: ${data.message}`);
  return data;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('github');

    const body = await req.json();
    const { files, commitMessage = 'Update UI source files from ArQitec app' } = body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return Response.json({ error: 'No files provided' }, { status: 400 });
    }

    // Get latest commit SHA on branch
    const branchData = await githubRequest(
      `/repos/${REPO_OWNER}/${REPO_NAME}/git/ref/heads/${BRANCH}`,
      'GET', null, accessToken
    );
    const latestCommitSha = branchData.object.sha;

    // Get the base tree SHA
    const commitData = await githubRequest(
      `/repos/${REPO_OWNER}/${REPO_NAME}/git/commits/${latestCommitSha}`,
      'GET', null, accessToken
    );
    const baseTreeSha = commitData.tree.sha;

    // Create blobs for each file
    const treeItems = [];
    for (const file of files) {
      const blob = await githubRequest(
        `/repos/${REPO_OWNER}/${REPO_NAME}/git/blobs`,
        'POST',
        { content: btoa(unescape(encodeURIComponent(file.content))), encoding: 'base64' },
        accessToken
      );
      treeItems.push({
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: blob.sha,
      });
    }

    // Create a new tree
    const newTree = await githubRequest(
      `/repos/${REPO_OWNER}/${REPO_NAME}/git/trees`,
      'POST',
      { base_tree: baseTreeSha, tree: treeItems },
      accessToken
    );

    // Create the commit
    const newCommit = await githubRequest(
      `/repos/${REPO_OWNER}/${REPO_NAME}/git/commits`,
      'POST',
      {
        message: commitMessage,
        tree: newTree.sha,
        parents: [latestCommitSha],
      },
      accessToken
    );

    // Update the branch ref
    await githubRequest(
      `/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/${BRANCH}`,
      'PATCH',
      { sha: newCommit.sha },
      accessToken
    );

    return Response.json({
      success: true,
      commitSha: newCommit.sha,
      commitUrl: `https://github.com/${REPO_OWNER}/${REPO_NAME}/commit/${newCommit.sha}`,
      filesCommitted: files.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});