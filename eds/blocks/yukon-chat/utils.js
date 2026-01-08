import MarkdownIt from '../../libs/deps/markdown-it-wrapper.js';

let md = null;
async function initMarkdownIt() {
  if (!md) {
    md = new MarkdownIt({
      html: false,
      breaks: true,
      linkify: true,
    });
  }
  return md;
}

function removeCitations(text) {
  // Remove inline citation markers like [1], [2], [^1], [^2], (1), (2)
  let cleaned = text.replace(/\[\^?\d+\]/g, '');
  cleaned = cleaned.replace(/\(\d+\)/g, '');

  // Remove Citations/References section and everything after
  const lines = cleaned.split('\n');
  let cutoffIndex = -1;
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const plainLine = line
      .replace(/\*\*/g, '')
      .replace(/__/g, '')
      .replace(/\*/g, '')
      .replace(/_/g, '')
      .trim();

    if (/^#{0,6}\s*(citations?|references?):?\s*$/i.test(plainLine)) {
      cutoffIndex = i;
      break;
    }
  }

  if (cutoffIndex !== -1) {
    return lines.slice(0, cutoffIndex).join('\n').trim();
  }

  return cleaned;
}

export async function parseMarkdown(markdown) {
  if (!markdown) return '';
  const markdownParser = await initMarkdownIt();
  const cleanedMarkdown = removeCitations(markdown);
  return markdownParser.render(cleanedMarkdown);
}

export function extractAuthoredConfigs(configs, elementChildren) {
  const rows = Array.from(elementChildren);
  rows.forEach((row) => {
    const divs = row.querySelectorAll('div');
    if (divs.length < 2) return;

    const key = divs[0].textContent.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const value = divs[1].textContent.trim();

    configs[key] = value;
  });
}
