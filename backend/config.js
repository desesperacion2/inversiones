import puppeteer from 'puppeteer';

export const PUPPETEER_CONFIG = {
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--single-process',
    '--disable-gpu'
  ],
  headless: 'new',
  defaultViewport: null,
  timeout: 120000
};

export async function createBrowser() {
  return puppeteer.launch(PUPPETEER_CONFIG);
}

