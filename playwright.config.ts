import { defineConfig, devices } from '@playwright/test';
import { ROLES, authFile } from './scripts/roles';

export default defineConfig({
  testDir: './tests',
  timeout: 120000,
  retries: 0,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'https://inside.satuvisidigital.com/',
    trace: 'on-first-retry',
  },
  // satu project per role: tests/<slug>/*.spec.ts pakai session role itu
  projects: ROLES.map((r) => ({
    name: r.slug,
    testMatch: `**/tests/${r.slug}/**/*.spec.ts`,
    use: { ...devices['Desktop Chrome'], storageState: authFile(r.slug) },
  })),
});
