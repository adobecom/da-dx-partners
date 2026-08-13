const DOCUMENT_GERMAN = {
  document_id: '5633fc1b-9376-49e7-ac3f-a721328a0d42',
  document_name: 'DE-yukon-doc-distributor-china-education.pdf',
  document_url: 'https://example.com/mock-yukon-source.pdf',
  title: 'DE-yukon-doc-distributor-china-education.pdf',
};

const DOCUMENT_PARTNER_GUIDE = {
  document_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  document_name: 'Adobe-Partner-Program-Overview.pdf',
  document_url: 'https://example.com/mock-partner-guide.pdf',
  title: 'Adobe-Partner-Program-Overview.pdf',
};

const DOCUMENT_FAQ = {
  document_id: 'f0e1d2c3-b4a5-6978-90ab-cdef12345678',
  document_name: 'Partner-Portal-FAQ-Short.pdf',
  document_url: 'https://example.com/mock-partner-faq.pdf',
  title: 'Partner-Portal-FAQ-Short.pdf',
};

/** @param {{ signal?: AbortSignal }} [opts] */
export function createMockYukonMultiSourceResponse(opts = {}) {
  const { signal } = opts;
  const encoder = new TextEncoder();

  const row = (partial) => JSON.stringify([partial]);

  const bodyText = [
    row({
      generated_text: '',
      source: {},
    }),
    row({ generated_text: 'German is the official and predominantly spoken language in Germany.', source: {} }),
    row({
      generated_text: '. [^1] It',
      source: { 1: DOCUMENT_GERMAN },
    }),
    row({ generated_text: ' It is also the most widely spoken first language in the European Union.', source: {} }),
    row({
      generated_text: ' [^2]',
      source: { 2: DOCUMENT_GERMAN },
    }),
    row({ generated_text: '\n\nFor partners, the program outlines benefits and requirements in detail.', source: {} }),
    row({
      generated_text: '. [^3]',
      source: { 3: DOCUMENT_PARTNER_GUIDE },
    }),
    row({ generated_text: ' Related onboarding steps are summarized in the same guide.', source: {} }),
    row({
      generated_text: ' [^4]',
      source: { 4: DOCUMENT_PARTNER_GUIDE },
    }),
    row({ generated_text: '\n\nFor quick answers, see the FAQ', source: {} }),
    row({
      generated_text: ' [^5]',
      source: { 5: DOCUMENT_FAQ },
    }),
    row({ generated_text: ' That covers the essentials.', source: {} }),
  ].join('\n');

  const body = new ReadableStream({
    start(controller) {
      if (signal?.aborted) {
        controller.error(new DOMException('Aborted', 'AbortError'));
        return;
      }
      controller.enqueue(encoder.encode(`${bodyText}\n`));
      controller.close();
    },
    cancel() {
      /* consumer cancelled */
    },
  });

  return {
    ok: true,
    status: 200,
    body,
  };
}
