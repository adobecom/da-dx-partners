const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// ---------------------------------------------------------------------------
// CONFIG — adjust these for your environment
// ---------------------------------------------------------------------------
const CONFIG = {
  baseUrl: process.env.SITE_BASE_URL || 'https://main--da-dx-partners--adobecom.aem.live',
  owner: process.env.SITE_OWNER || 'adobecom',
  repository: process.env.SITE_REPOSITORY || 'da-dx-partners',
  branch: process.env.SITE_BRANCH || 'main',
  adminEndpoint: process.env.SITE_ADMIN_ENDPOINT || 'https://admin.hlx.page',
  pathPrefix: '/digitalexperience/',
  excludePrefixes: ['/digitalexperience/drafts/'],
  adminApiKey: process.env.SITE_ADMIN_API_KEY,
  contentApiKey: process.env.SITE_CONTENT_API_KEY,
};

// ---------------------------------------------------------------------------
// A real browser UA — many sites (WAF/bot protection) block or mis-handle
// requests from generic HTTP clients, especially HEAD requests.
// ---------------------------------------------------------------------------
const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

// ---------------------------------------------------------------------------
// Only attach the auth token when calling our own site's origin — never send
// it along with requests to third-party link targets found on the page.
// ---------------------------------------------------------------------------
function getAuthHeaders(url) {
  if (!CONFIG.contentApiKey) return { ...DEFAULT_HEADERS };
  try {
    if (new URL(url).origin !== new URL(CONFIG.baseUrl).origin) return { ...DEFAULT_HEADERS };
  } catch {
    return { ...DEFAULT_HEADERS };
  }
  return { ...DEFAULT_HEADERS, Authorization: `token ${CONFIG.contentApiKey}` };
}

// ---------------------------------------------------------------------------
// Native fetch has no default timeout — a single unresponsive link (hung
// connection, redirect loop, server that never answers HEAD/GET) would make
// the whole script appear to freeze on one page forever. Wrap every fetch
// with an AbortController-based timeout so a bad link just gets reported as
// broken instead of hanging indefinitely. Override with REQUEST_TIMEOUT_MS.
// ---------------------------------------------------------------------------
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS) || 15000;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Minimal standalone AEM Admin API client — inlined here instead of importing
// services/aem-admin/aem-admin.js so this script has no dependency on the
// runtime project (avoids pulling in node-fetch and @adobe/aio-sdk).
// ---------------------------------------------------------------------------
function getAdminAuthHeaders() {
  return { Authorization: `token ${CONFIG.adminApiKey}` };
}

async function startBulkStatusJob(paths) {
  const url = `${CONFIG.adminEndpoint}/status/${CONFIG.owner}/${CONFIG.repository}/${CONFIG.branch}/*`;
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
    body: JSON.stringify({ paths, select: ['live'] }),
  });
  if (!res.ok) throw new Error(`Bulk status job failed to start (${res.status})`);
  return res.json();
}

async function getJobStatusDetails(topic, jobName) {
  const url = `${CONFIG.adminEndpoint}/job/${CONFIG.owner}/${CONFIG.repository}/${CONFIG.branch}/${topic}/${jobName}/details`;
  const res = await fetchWithTimeout(url, { headers: getAdminAuthHeaders() });
  if (!res.ok) throw new Error(`Failed to read job status details (${res.status})`);
  return res.json();
}

async function awaitJob(topic, jobName) {
  const url = `${CONFIG.adminEndpoint}/job/${CONFIG.owner}/${CONFIG.repository}/${CONFIG.branch}/${topic}/${jobName}`;
  for (let attempts = 0; attempts < 120; attempts++) {
    const res = await fetchWithTimeout(url, { headers: getAdminAuthHeaders() });
    if (!res.ok) throw new Error(`Failed to read job status (${res.status})`);
    const { state } = await res.json();
    if (state === 'stopped') return;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error('Polling exceeded maximum attempts.');
}

// ---------------------------------------------------------------------------
// Step 1: fetch all live pages via the AEM Admin bulk status job
//
// Same mechanism as actions/search/dx/search-index-sync/index.js: start a
// bulk status job for '/*' selecting only 'live' resources, poll until it
// finishes, then read the resulting resource list from job status details.
// ---------------------------------------------------------------------------
async function fetchLivePages() {
  if (!CONFIG.adminApiKey) {
    throw new Error('SITE_ADMIN_API_KEY is required to discover live pages via the AEM Admin bulk status job.');
  }

  const startBulkStatusJobData = await startBulkStatusJob(['/*']);

  const { topic, name: jobName } = startBulkStatusJobData.job ?? {};
  if (!topic || !jobName) {
    throw new Error('Problem reading bulk status job topic and name.');
  }

  await awaitJob(topic, jobName);
  const jobStatusDetailsData = await getJobStatusDetails(topic, jobName);

  if (!jobStatusDetailsData.data?.resources) {
    throw new Error('Problem reading bulk status job resources.');
  }

  return jobStatusDetailsData.data.resources
    .filter((resource) => resource.publishLastModified && resource.path)
    .map((resource) => resource.path);
}

// ---------------------------------------------------------------------------
// Step 2: filter to /digitalexperience/, excluding /drafts/
// ---------------------------------------------------------------------------
function filterPages(paths) {
  return paths.filter((path) => {
    if (!path.startsWith(CONFIG.pathPrefix)) return false;
    if (CONFIG.excludePrefixes.some((prefix) => path.startsWith(prefix))) return false;
    return true;
  });
}

function toFullUrl(path, base = CONFIG.baseUrl) {
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path, base).toString();
}

// Links pointing into these paths are intentionally not verified (e.g. search/member-only routes).
const skipLinkPrefixes = ['/digitalexperience/s/','/s/', '/digitalexperience/m/', '/digitalexperience/preview/', '/digitalexperience/training/'];

// These platforms redirect anonymous/bot requests to a login wall that itself returns
// non-2xx (e.g. Facebook profile URLs 302 -> /login/?next=... which 400s for non-browser
// clients), so unauthenticated automated requests can never verify them — skip instead of
// producing false-positive "broken link" reports.
const loginWalledHosts = ['facebook.com', 'www.facebook.com', 'instagram.com', 'www.instagram.com', 'linkedin.com', 'www.linkedin.com', 'x.com', 'twitter.com'];

function shouldSkipLink(href) {
  try {
    const url = new URL(href, CONFIG.baseUrl);
    if (loginWalledHosts.includes(url.hostname)) return true;
    return skipLinkPrefixes.some((prefix) => url.pathname.startsWith(prefix));
  } catch {
    return false;
  }
}

function getPathname(href) {
  try {
    return new URL(href, CONFIG.baseUrl).pathname;
  } catch {
    return null;
  }
}

function normalizePath(pathname) {
  const clean = pathname.split(/[?#]/)[0];
  return clean.length > 1 ? clean.replace(/\/+$/, '') : clean;
}

// Skip links whose visible text is just an email address (e.g. example emails in docs, not real navigable links).
const EMAIL_TEXT_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Matches the class names eds/scripts/personalization.js uses to conditionally remove
// elements client-side (e.g. partner-personalization, partner-level, partner-not-*).
const PERSONALIZATION_CLASS_PATTERN = /^partner-|^personalization-hide$/;

function isPersonalizedContent($, el) {
  return $(el).parents().toArray().some((parent) => {
    const classes = ($(parent).attr('class') || '').split(/\s+/);
    return classes.some((cls) => PERSONALIZATION_CLASS_PATTERN.test(cls));
  });
}

// ---------------------------------------------------------------------------
// Step 3: fetch a page, check its status, then check every anchor on it
// ---------------------------------------------------------------------------
async function checkPage(pagePath, report, livePagePaths) {
  const pageUrl = toFullUrl(pagePath);
  let response;
  let html;

  try {
    response = await fetchWithTimeout(pageUrl, { headers: getAuthHeaders(pageUrl) });
    html = await response.text();
  } catch (err) {
    report.push({
      pageUrl,
      elementUrl: null,
      elementText: null,
      issue: `Failed to open page: ${err.message}`,
    });
    return;
  }

  if (!response.ok) {
    report.push({
      pageUrl,
      elementUrl: null,
      elementText: null,
      issue: `Page itself did not return OK (status ${response.status})`,
    });
    return; // page itself broken, no point checking its anchors
  }

  const $ = cheerio.load(html);
  const anchors = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    const text = $(el).text().trim();
    anchors.push({ href, text, personalized: isPersonalizedContent($, el) });
  });

  if (anchors.length === 0) {
    // Not a broken-link issue — some pages (error/confirmation screens) legitimately have no anchors.
    console.log(`   no anchors found on ${pageUrl}`);
    return;
  }

  for (const { href, text, personalized } of anchors) {
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:') || href.startsWith('#')) {
      continue;
    }
    if (shouldSkipLink(href)) {
      continue;
    }
    if (EMAIL_TEXT_PATTERN.test(text)) {
      continue;
    }

    const linkUrl = toFullUrl(href, pageUrl);
    console.log(`   checking link: ${linkUrl}`);

    const linkPath = getPathname(href);
    let ok;
    if (linkPath && linkPath.startsWith(CONFIG.pathPrefix)) {
      // Internal digitalexperience link — check against the AEM Admin live resources list instead of fetching it.
      ok = livePagePaths.has(normalizePath(linkPath));
    } else {
      ok = await checkLinkOk(linkUrl);
    }
    if (!ok) {
      report.push({
        pageUrl,
        elementUrl: linkUrl,
        elementText: text,
        issue: personalized ? 'Link is inside personalized content — may be hidden for some/all visitors client-side.' : undefined,
      });
    }
  }
}

async function attemptLinkCheck(url, headers) {
  try {
    let res = await fetchWithTimeout(url, { method: 'HEAD', headers });
    if (!res.ok) {
      // Some servers reject/mishandle HEAD (405, bot protection, etc.); fall back to GET
      res = await fetchWithTimeout(url, { method: 'GET', headers });
    }
    return res.ok;
  } catch {
    return false;
  }
}

async function checkLinkOk(url) {
  const headers = getAuthHeaders(url);
  if (await attemptLinkCheck(url, headers)) return true;
  // Retry once after a short delay — third-party sites often transiently rate-limit/block automated requests.
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return attemptLinkCheck(url, headers);
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------
function formatReport(title, report) {
  const lines = [`=== ${title}: ${report.length} issue(s) ===`];
  if (report.length === 0) {
    lines.push('No broken links found.');
  } else {
    for (const item of report) {
      lines.push(`Page URL:    ${item.pageUrl}`);
      lines.push(`Element URL: ${item.elementUrl ?? '(n/a)'}`);
      lines.push(`Element text: "${item.elementText ?? ''}"`);
      if (item.issue) lines.push(`Note: ${item.issue}`);
      lines.push('---');
    }
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function run() {
 
  const allPages = await fetchLivePages();
  const livePagePaths = new Set(allPages.map(normalizePath));
  const pages = filterPages(allPages);
  console.log(`Found ${pages.length} page(s) to check.`); 

  const report = [];
  for (let i = 0; i < pages.length; i++) {
    const path = pages[i];
    console.log(`[${i + 1}/${pages.length}] Checking ${path}`);
    await checkPage(path, report, livePagePaths);
  }

  const reportText = formatReport('Digital Experience pages', report);
  console.log(`\n${reportText}`);
  // Written for CircleCI to read and post to Slack (see slack-notify.cjs).
  fs.writeFileSync(path.join(__dirname, 'report.txt'), reportText);

  if (report.length > 0) {
    process.exitCode = 1; // useful if this runs in CI
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});