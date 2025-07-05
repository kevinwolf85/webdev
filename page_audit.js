const puppeteer = require('puppeteer');
const { OpenAI } = require('openai');

async function auditPage(url) {
  const start = Date.now();
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  const networkErrors = [];
  page.on('requestfailed', req => {
    networkErrors.push(`${req.url()} - ${req.failure()?.errorText}`);
  });

  await page.goto(url, {waitUntil: 'networkidle0'});
  const loadTime = Date.now() - start;
  await browser.close();

  return {consoleErrors, networkErrors, loadTime};
}

async function summarize(result) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return 'No OpenAI API key set';
  }
  const openai = new OpenAI({ apiKey });
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that summarizes web page audit results concisely.' },
        { role: 'user', content: `Console errors: ${result.consoleErrors.join('; ') || 'none'}\nNetwork errors: ${result.networkErrors.join('; ') || 'none'}\nLoad time: ${result.loadTime} ms` }
      ]
    });
    return completion.choices[0].message.content.trim();
  } catch (err) {
    return `Failed to summarize: ${err.message}`;
  }
}

const readline = require('readline');

async function promptUrl() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => {
    rl.question('Enter URL to audit: ', answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function run() {
  let url = process.argv[2];
  if (!url) {
    url = await promptUrl();
  }
  if (!url) {
    console.error('No URL provided. Usage: node page_audit.js <url>');
    process.exit(1);
  }
  try {
    const result = await auditPage(url);
    console.log('Console Errors:', result.consoleErrors);
    console.log('Network Errors:', result.networkErrors);
    console.log('Load Time (ms):', result.loadTime);
    const summary = await summarize(result);
    console.log('Summary:', summary);
  } catch (err) {
    console.error('Error auditing page:', err);
  }
}

run();
