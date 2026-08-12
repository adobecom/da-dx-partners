// ---------------------------------------------------------------------------
// Posts CircleCI link-checker updates to Slack.
//
// Usage:
//   node slack-notify.cjs start   # posts the "job started" message, saves its ts
//   node slack-notify.cjs report  # replies in-thread with report.txt (or a
//                                  # snippet upload if the report is too long)
//
// Required env vars: SLACK_BOT_TOKEN, SLACK_CHANNEL_ID
// ---------------------------------------------------------------------------
const fs = require('fs');
const path = require('path');

const SLACK_API = 'https://slack.com/api';
const THREAD_TS_FILE = path.join(__dirname, 'thread_ts.txt');
const REPORT_FILE = path.join(__dirname, 'report.txt');
// Slack truncates a single mrkdwn text block around this length, so anything
// longer is uploaded as a snippet instead of posted as a plain message.
const MAX_MESSAGE_LENGTH = 3000;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

async function slackApi(method, body) {
  const res = await fetch(`${SLACK_API}/${method}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requireEnv('SLACK_BOT_TOKEN')}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Slack API ${method} failed: ${data.error}`);
  return data;
}

async function postStartMessage() {
  const channel = requireEnv('SLACK_CHANNEL_ID');
  const buildUrl = process.env.CIRCLE_BUILD_URL;
  const text = buildUrl
    ? `:hourglass_flowing_sand: Link checker started — <${buildUrl}|Open in CircleCI>`
    : ':hourglass_flowing_sand: Link checker started';

  const { ts } = await slackApi('chat.postMessage', { channel, text });
  fs.writeFileSync(THREAD_TS_FILE, ts);
  console.log(`Posted start message, thread_ts=${ts}`);
}

// ---------------------------------------------------------------------------
// files.upload was retired in March 2025; this is the current 3-step upload
// flow required to share a file into an existing thread.
// ---------------------------------------------------------------------------
async function uploadSnippet(channel, threadTs, content, title) {
  const { upload_url: uploadUrl, file_id: fileId } = await slackApi('files.getUploadURLExternal', {
    filename: 'report.txt',
    length: Buffer.byteLength(content),
  });

  const uploadRes = await fetch(uploadUrl, { method: 'POST', body: content });
  if (!uploadRes.ok) throw new Error(`File upload failed (${uploadRes.status})`);

  await slackApi('files.completeUploadExternal', {
    files: [{ id: fileId, title }],
    channel_id: channel,
    thread_ts: threadTs,
  });
}

async function postReport() {
  const channel = requireEnv('SLACK_CHANNEL_ID');
  const threadTs = fs.readFileSync(THREAD_TS_FILE, 'utf8').trim();
  const reportText = fs.readFileSync(REPORT_FILE, 'utf8');

  if (reportText.length <= MAX_MESSAGE_LENGTH) {
    await slackApi('chat.postMessage', {
      channel,
      thread_ts: threadTs,
      text: `\`\`\`${reportText}\`\`\``,
    });
    console.log('Posted report as a thread reply.');
    return;
  }

  await uploadSnippet(channel, threadTs, reportText, 'Link checker report');
  console.log('Report too long for a message — uploaded as a snippet in the thread.');
}

const mode = process.argv[2];
const run = mode === 'start' ? postStartMessage : mode === 'report' ? postReport : null;

if (!run) {
  console.error('Usage: node slack-notify.cjs <start|report>');
  process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
