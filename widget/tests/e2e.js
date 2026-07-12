const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const urlFile = fs.readFileSync(path.join(__dirname, '..', 'dist', 'url.txt'), 'utf8').trim();
const payload = urlFile.split('#')[1];
const TARGET_URL = urlFile;

(async () => {
  console.log('Target URL:', TARGET_URL);
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Test 1: Real message test
  console.log('\\n[1] REAL MESSAGE TEST');
  await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });
  await page.waitForSelector('#n');
  await page.type('#n', 'Hello proxy!');
  await page.click('#s');
  
  let initialAiMessages = await page.$$('.m-a');
  await page.waitForFunction((initialCount) => {
    return document.querySelectorAll('.m-a').length > initialCount;
  }, { timeout: 10000 }, initialAiMessages.length);
  
  const aiMessages = await page.$$('.m-a .t');
  const lastAiMessage = await page.evaluate(el => el.textContent, aiMessages[aiMessages.length - 1]);
  console.log('Reply received:', lastAiMessage);

  // Test 2: Rate limit test
  console.log('\\n[2] RATE LIMIT TEST');
  // We need to send 10 more messages rapidly (since limit is 10/hr/IP)
  for(let i=0; i<10; i++) {
    await page.type('#n', 'Spam ' + i);
    await page.click('#s');
    // Wait for reply
    initialAiMessages = await page.$$('.m-a');
    await page.waitForFunction((initialCount) => {
      return document.querySelectorAll('.m-a').length > initialCount;
    }, { timeout: 15000 }, initialAiMessages.length);
    
    const currMessages = await page.$$('.m-a .t');
    const msg = await page.evaluate(el => el.textContent, currMessages[currMessages.length - 1]);
    console.log(`Msg ${i+2} reply: ${msg}`);
  }
  
  await browser.close();
})();
