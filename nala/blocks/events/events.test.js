import { test, expect } from '@playwright/test';
import EventsPage from './events.page.js';
import eventsSpec from './events.spec.js';
import fs from 'fs';
import path from 'path';

let eventsPage;

const { features } = eventsSpec;

test.describe('Validate events block', () => {
  test.beforeEach(async ({ page, browserName, baseURL, context }) => {
    eventsPage = new EventsPage(page);
  });

  test(`${features[0].name},${features[0].tags}`, async ({ page }) => {
    const { data } = features[0];
    await test.step('Go to events page', async () => {
      await page.goto(`${features[0].path}`);
      await page.waitForLoadState('networkidle');
      await page.pause();
    });
  });
});