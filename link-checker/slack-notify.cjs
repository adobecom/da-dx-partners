const fs = require('fs');
const path = require('path');

const SLACK_API = 'https://slack.com/api';
const THREAD_TS_FILE = path.join(__dirname, 'thread_ts.txt');
const REPORT_FILE = path.join(__dirname, 'report.txt');

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

async function slackApiForm(method, params) {
  const res = await fetch(`${SLACK_API}/${method}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requireEnv('SLACK_BOT_TOKEN')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
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

async function uploadSnippet(channel, threadTs, content, title) {
  const { upload_url: uploadUrl, file_id: fileId } = await slackApiForm('files.getUploadURLExternal', {
    filename: 'report.txt',
    length: String(Buffer.byteLength(content)),
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
