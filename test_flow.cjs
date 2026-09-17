const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173');
  
  await page.waitForSelector('.app-header');
  console.log('App loaded');
  
  const fakeHTML = '<div class="Nv2PK"><a class="hfpxzc" aria-label="Fake Lead 1" href="https://maps.google.com/fake1"></a><span class="ZkP5I" aria-label="4.5 stars"></span><span class="UY7F9">(10)</span><div class="W4Efsd">Fake Category</div><div class="W4Efsd">+123456789</div><a class="lcr4fd" href="http://fake1.com">Website</a></div>';
  
  await page.waitForSelector('.paste-input');
  await page.evaluate((html) => {
    const pasteInput = document.querySelector('.paste-input');
    pasteInput.innerHTML = html;
    pasteInput.dispatchEvent(new Event('input', { bubbles: true }));
  }, fakeHTML);
  
  await page.click('.paste-zone button');
  console.log('Pasted and parsed leads');
  
  await page.waitForSelector('table tbody tr');
  console.log('Lead appeared in table');
  
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.view-tab'));
    const mapTab = tabs.find(t => t.textContent.includes('Coverage Map'));
    if(mapTab) mapTab.click();
  });
  
  await page.waitForSelector('.coverage-map');
  
  try {
    await page.type('.add-niche-form input', 'TestNiche');
    await page.click('.add-niche-form button');
  } catch (e) {}
  
  try {
    await page.type('.add-country-form input', 'TestCountry');
    await page.click('.add-country-form button');
  } catch (e) {}
  
  try {
    await page.type('.add-city-form input', 'TestCity');
    await page.click('.add-city-form button');
  } catch (e) {}
  console.log('Added coverage data');
  
  await page.evaluate(() => {
    const cb = document.querySelector('.scan-checkbox');
    if(cb && !cb.checked) cb.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  await page.click('.open-list-btn');
  console.log('Clicked Open City List');
  
  await page.waitForSelector('.list-name');
  const listName = await page.$eval('.list-name', el => el.textContent);
  console.log('Current list name:', listName);
  
  await page.evaluate((html) => {
    const pasteInput = document.querySelector('.paste-input');
    pasteInput.innerHTML = html;
    pasteInput.dispatchEvent(new Event('input', { bubbles: true }));
  }, fakeHTML);
  await page.click('.paste-zone button');
  console.log('Pasted leads into city list');
  
  console.log('Waiting 3s for auto-save...');
  await new Promise(r => setTimeout(r, 3000));
  
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.view-tab'));
    const mapTab = tabs.find(t => t.textContent.includes('Coverage Map'));
    if(mapTab) mapTab.click();
  });
  
  await page.waitForSelector('.leads-count-badge');
  const count = await page.$eval('.leads-count-badge', el => el.textContent);
  console.log('Leads count in map:', count);
  
  await page.click('.open-list-btn');
  console.log('Clicked Open again');
  
  await new Promise(r => setTimeout(r, 2000));
  const trs = await page.$$('table tbody tr');
  console.log('Number of leads in table after reopening:', trs.length);
  
  await browser.close();
})();
