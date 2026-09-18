import { expect } from '@esm-bundle/chai';
import { getNodeAtSegments, getRootTags, getTags } from '../../../eds/tools/tags/tag-data.js';

describe('tag-data', () => {
  it('walks a tag tree by segments', () => {
    const tree = { product: { analytics: { title: 'Analytics' } } };

    expect(getNodeAtSegments(tree, ['product', 'analytics'])).to.deep.equal({ title: 'Analytics' });
    expect(getNodeAtSegments(tree, ['product', 'missing'])).to.equal(null);
    expect(getNodeAtSegments(null, ['product'])).to.equal(null);
  });

  it('returns child tags with caas paths and metadata', async () => {
    const tags = await getTags('content-type');

    expect(tags).to.be.an('array');
    expect(tags.length).to.be.greaterThan(0);
    expect(tags[0].path).to.match(/^content-type\//);
    expect(tags[0].activeTag).to.equal('caas/content-type');
    expect(tags[0].name).to.be.a('string');
    expect(tags[0].details['jcr:primaryType']).to.equal('cq:Tag');
  });

  it('normalizes slash-delimited paths and supports the root namespace', async () => {
    const tags = await getTags('/content-type/');
    const rootTags = await getRootTags();

    expect(tags).to.be.an('array');
    expect(tags[0].activeTag).to.equal('caas/content-type');
    expect(rootTags).to.be.an('array');
    expect(rootTags.length).to.be.greaterThan(0);
  });

  it('returns null and logs for an unknown path', async () => {
    const originalError = console.error;
    let message = '';
    console.error = (value) => { message = value; };

    const result = await getTags('does-not-exist');

    console.error = originalError;
    expect(result).to.equal(null);
    expect(message).to.contain('No tag node found at path "does-not-exist"');
  });
});
