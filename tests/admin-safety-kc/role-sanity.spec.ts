import { test, expect } from '@playwright/test';
import { roleSwitcher, DASHBOARD_URL } from '../../scripts/roles';

test('role aktif = Admin Safety KC', async ({ page }) => {
  await page.goto(DASHBOARD_URL);
  await expect(roleSwitcher(page).locator('option:checked')).toHaveAttribute('title', 'Admin Safety KC');
});
