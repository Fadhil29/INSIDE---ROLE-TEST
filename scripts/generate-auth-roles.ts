import { chromium, Page } from '@playwright/test';
import 'dotenv/config';
import fs from 'fs';
import { ROLES, authFile, roleSwitcher, activeRole, DASHBOARD_URL } from './roles';

const only = process.argv[2]; // opsional: npm run auth -- auditor
const targets = only ? ROLES.filter((r) => r.slug === only) : ROLES;
if (only && targets.length === 0) {
  throw new Error(`slug "${only}" tidak ada. pilihan: ${ROLES.map((r) => r.slug).join(', ')}`);
}

async function loginAsSuperAdmin(page: Page) {
  await page.goto('https://inside.satuvisidigital.com/login');
  await page.waitForLoadState('networkidle');
  await page.getByRole('link', { name: 'Familia Single Sign On' }).click();
  await page.getByRole('textbox', { name: 'Enter your username' }).fill(process.env.FAMILIA_USERNAME_SUPERADMIN!);
  await page.getByRole('textbox', { name: 'Enter your password' }).fill(process.env.FAMILIA_PASSWORD_SUPERADMIN!);
  await page.getByRole('button', { name: 'Logo Familia Familia Single' }).click();
  await page.waitForURL(/familia-sim\.injourneyairports\.id/, { timeout: 30000 });

  await page.goto('https://familia-sim.injourneyairports.id/u/choose-menu?appId=2ed8176a-8324-11f1-ab07-0242ac120002');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Tutup' }).click({ timeout: 5000 }).catch(() => {});
  await page.locator('div').filter({ hasText: 'Proceed to Inside You will be' }).nth(3).click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(4000);
}

async function main() {
  fs.mkdirSync('playwright/.auth', { recursive: true });
  const browser = await chromium.launch({ headless: !!process.env.CI, slowMo: process.env.CI ? 0 : 300 });

  // satu login baru per role -> tiap role punya session sendiri
  for (const role of targets) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAsSuperAdmin(page);

    const switcher = roleSwitcher(page);
    const value = await switcher.locator(`option[title="${role.name}"]`).getAttribute('value');
    if (!value) throw new Error(`option role "${role.name}" tidak ada di dropdown`);
    await Promise.all([
      page.waitForEvent('framenavigated', (f) => f === page.mainFrame()),
      switcher.selectOption(value),
    ]);
    await page.waitForLoadState('networkidle');
    await page.goto(DASHBOARD_URL); // pastikan role tersimpan di server, bukan cuma di halaman ini
    await page.waitForLoadState('networkidle');

    const now = await activeRole(page);
    if (now !== role.name) throw new Error(`switch gagal: target "${role.name}", aktif "${now}"`);

    await context.storageState({ path: authFile(role.slug) });
    console.log(`OK ${role.name} -> ${authFile(role.slug)}`);
    await context.close();
  }

  // cek isolasi: semua session dibuka bareng, role masing-masing harus tetap
  const existing = ROLES.filter((r) => fs.existsSync(authFile(r.slug)));
  const checks = await Promise.all(
    existing.map(async (role) => {
      const context = await browser.newContext({ storageState: authFile(role.slug) });
      const page = await context.newPage();
      await page.goto(DASHBOARD_URL);
      await page.waitForLoadState('networkidle');
      const now = await activeRole(page).catch(() => '(select tidak ketemu / session invalid)');
      await context.close();
      return { role: role.name, aktif: now, ok: now === role.name };
    }),
  );
  console.table(checks);
  if (checks.some((c) => !c.ok)) {
    console.log('WARNING: role bocor / session invalid. Kalau bocor antar session, set workers: 1 di playwright.config.ts');
    process.exitCode = 1;
  }

  await browser.close();
}

main();
