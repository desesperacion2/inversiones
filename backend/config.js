import puppeteer from 'puppeteer';

export const PUPPETEER_CONFIG = process.env.PUPPETEER_EXECUTABLE_PATH
  ? {
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process'
      ],
    }
  : {
      headless: "new",
    };

export async function createBrowser() {
  return process.env.PUPPETEER_EXECUTABLE_PATH
    ? puppeteer.launch(PUPPETEER_CONFIG)
    : puppeteer.launch();
}

