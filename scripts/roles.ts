import type { Page } from '@playwright/test';

export const ROLES = [
  { name: 'General', slug: 'general' },
  { name: 'Admin Safety KC', slug: 'admin-safety-kc' },
  { name: 'Admin Safety Region', slug: 'admin-safety-region' },
  { name: 'Admin Safety Head Office', slug: 'admin-safety-head-office' },
  { name: 'Auditor', slug: 'auditor' },
  { name: 'Super Admin', slug: 'super-admin' },
] as const;

export const authFile = (slug: string) => `playwright/.auth/${slug}.json`;

export const DASHBOARD_URL = 'https://inside.satuvisidigital.com/dashboard_main';

// <select> role di sidebar: onchange -> window.location.href = /change_role/<hash>
export const roleSwitcher = (page: Page) =>
  page.locator('select:has(option[value^="/change_role/"])');

export const activeRole = async (page: Page) =>
  (await roleSwitcher(page).locator('option:checked').getAttribute('title')) ?? '';
