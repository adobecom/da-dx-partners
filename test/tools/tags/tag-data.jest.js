import {
  getNodeAtSegments,
  getTags,
  getRootTags,
} from '../../../eds/tools/tags/tag-data.js';

describe('tag-data.js', () => {
  describe('getNodeAtSegments', () => {
    test('returns the tree itself when no segments are given', () => {
      const tree = { foo: 'bar' };
      expect(getNodeAtSegments(tree, [])).toBe(tree);
    });

    test('walks nested segments', () => {
      const tree = { a: { b: { c: 'value' } } };
      expect(getNodeAtSegments(tree, ['a', 'b', 'c'])).toBe('value');
    });

    test('returns null for a missing path', () => {
      const tree = { a: { b: {} } };
      expect(getNodeAtSegments(tree, ['a', 'x'])).toBeNull();
    });
  });

  describe('getTags', () => {
    test('returns root-level tag entries for an empty path', async () => {
      const tags = await getTags('');
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(0);

      const entry = tags.find((t) => t.name === 'content-type');
      expect(entry).toBeDefined();
      expect(entry.path).toBe('/content-type');
      expect(entry.activeTag).toBe('caas');
      expect(entry.title).toBeTruthy();
      expect(entry.details['jcr:primaryType']).toBe('cq:Tag');
    });

    test('returns nested tag entries for a known path', async () => {
      const tags = await getTags('content-type');
      expect(Array.isArray(tags)).toBe(true);
      tags.forEach((tag) => {
        expect(tag.activeTag).toBe('caas/content-type');
        expect(tag.path.startsWith('content-type/')).toBe(true);
      });
    });

    test('returns null when the path does not exist', async () => {
      const tags = await getTags('does-not-exist');
      expect(tags).toBeNull();
    });
  });

  describe('getRootTags', () => {
    test('resolves to the same result as getTags("")', async () => {
      const rootTags = await getRootTags();
      const expected = await getTags('');
      expect(rootTags).toEqual(expected);
    });
  });
});
