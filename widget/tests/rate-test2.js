const p=require('puppeteer');
const fs=require('fs');
const b64=fs.readFileSync('../dist/url.txt','utf8').trim();
(async()=>{
  const b=await p.launch();
  const page=await b.newPage();
  await page.goto(b64,{waitUntil:'networkidle2'});
  await page.type('#n','msg rate limit check');
  await page.click('#s');
  await new Promise(r=>setTimeout(r,3500));
  const msgs=await page.$$eval('.m-a .t', els=>els.map(e=>e.textContent));
  console.log('AI Replies:');
  msgs.forEach((m,i) => console.log(`[${i}] ${m}`));
  await b.close();
})();
