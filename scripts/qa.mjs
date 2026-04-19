import { chromium } from 'playwright';

const URL = 'http://localhost:5174/?demo=1';

async function dragExact(page, sliderIndex, targetValue) {
  // pick sliderIndex'th VISIBLE slider
  const handles = await page.$$('input[type=range]');
  const visible = [];
  for (const h of handles) {
    const b = await h.boundingBox();
    if (b && b.width > 0 && b.height > 0) visible.push({ h, b });
  }
  const t = visible[sliderIndex];
  if (!t) return 'no target';

  const min = Number(await t.h.getAttribute('min'));
  const max = Number(await t.h.getAttribute('max'));
  const current = Number(await t.h.evaluate((el) => el.value));

  const thumbX = t.b.x + ((current - min) / (max - min)) * t.b.width;
  const thumbY = t.b.y + t.b.height / 2;
  const targetX = t.b.x + ((targetValue - min) / (max - min)) * t.b.width;

  await page.mouse.move(thumbX, thumbY);
  await page.mouse.down();
  await page.mouse.move(targetX, thumbY, { steps: 15 });
  await page.mouse.up();
  await page.waitForTimeout(150);
  return await t.h.evaluate((el) => el.value);
}

async function setViaKeyboard(page, sliderIndex, presses) {
  const handles = await page.$$('input[type=range]');
  const visible = [];
  for (const h of handles) {
    const b = await h.boundingBox();
    if (b && b.width > 0 && b.height > 0) visible.push({ h, b });
  }
  const t = visible[sliderIndex];
  if (!t) return 'no target';
  await t.h.focus();
  for (let i = 0; i < Math.abs(presses); i++) {
    await page.keyboard.press(presses > 0 ? 'ArrowRight' : 'ArrowLeft');
    await page.waitForTimeout(20);
  }
  return await t.h.evaluate((el) => el.value);
}

async function tallies(page) {
  return await page.evaluate(() => {
    const ts = [...document.querySelectorAll('[data-tally]')];
    return ts.map((el) => el.textContent?.trim());
  });
}

(async () => {
  const browser = await chromium.launch();

  // --- DESKTOP ---
  const deskCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const desk = await deskCtx.newPage();
  await desk.goto(URL);
  await desk.waitForFunction(() => document.querySelectorAll('input[type=range]').length > 0);
  await desk.waitForTimeout(400);

  console.log('keyboard +3 on slider[0] (weight cost of living):', await setViaKeyboard(desk, 0, 3));
  console.log('keyboard +7 on slider[2] (Charlotte Cost of Living score):', await setViaKeyboard(desk, 2, 7));
  console.log('keyboard +5 on slider[4] (Charlotte Career Opps score? / actually weight #2):', await setViaKeyboard(desk, 3, 5));
  console.log('drag slider[5] to 6:', await dragExact(desk, 5, 6));
  await desk.screenshot({ path: '/tmp/desk-after.png', fullPage: false });

  const tally = await desk.evaluate(() => {
    return [...document.querySelectorAll('.fraunces.tabular-nums')].map((el) => el.textContent?.trim());
  });
  console.log('top tally numbers:', tally);

  // fill every score + weight via JS so allScored becomes true
  await desk.evaluate(() => {
    const inputs = [...document.querySelectorAll('input[type=range]')].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    for (const el of inputs) {
      el.value = '7';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await desk.waitForTimeout(300);
  const doneBtnEnabled = await desk.locator('button:has-text("Done")').first().isEnabled();
  console.log('Done button enabled after scoring all:', doneBtnEnabled);
  await desk.locator('button:has-text("Done")').first().click();
  await desk.waitForTimeout(500);
  const inDebate = await desk.evaluate(() => !!document.querySelector('aside .fraunces, aside p'));
  console.log('drawer shows debate panel after Done:', inDebate);
  await desk.screenshot({ path: '/tmp/desk-debate.png', fullPage: false });

  // --- MOBILE ---
  const mobCtx = await browser.newContext({ viewport: { width: 393, height: 852 } });
  const mob = await mobCtx.newPage();
  await mob.goto(URL);
  await mob.waitForFunction(() => document.querySelectorAll('input[type=range]').length > 0);
  await mob.waitForTimeout(400);
  await mob.screenshot({ path: '/tmp/mob-initial.png', fullPage: false });

  // Click the Chat tab
  await mob.locator('nav[aria-label="Primary"] button:has-text("Chat")').click();
  await mob.waitForTimeout(300);
  await mob.screenshot({ path: '/tmp/mob-chat.png', fullPage: false });
  // Click Debate tab
  await mob.locator('nav[aria-label="Primary"] button:has-text("Debate")').click();
  await mob.waitForTimeout(300);
  await mob.screenshot({ path: '/tmp/mob-debate.png', fullPage: false });
  // Back to matrix
  await mob.locator('nav[aria-label="Primary"] button:has-text("Matrix")').click();
  await mob.waitForTimeout(300);
  await mob.screenshot({ path: '/tmp/mob-matrix.png', fullPage: false });

  await browser.close();
  console.log('done');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
