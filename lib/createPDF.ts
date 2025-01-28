import { abortable } from 'jsr:@std/async';
import puppeteer from 'npm:puppeteer-core';
export default async (url: string, path: string) => {
  const retry = async (retryCount = 0) => {
    try {
      const c = new AbortController();
      // 10秒でタイムアウト
      const timer = setTimeout(() => {
        console.log('Timeout createPDF');
        return c.abort();
      }, 1000 * 60 * 5);

      await abortable(
        (async () => {
          const browser = await puppeteer.launch({ channel: 'chrome' });
          const page = await browser.newPage();
          page.setDefaultNavigationTimeout(1000 * 60 * 3);
          page.setDefaultTimeout(1000 * 60 * 3);
          await page.goto(url, { waitUntil: 'load' });
          // Webページの場合は、PDF化する
          const pdf = await page.pdf({ format: 'A0' });
          Deno.writeFileSync(path, pdf);
          await browser.close();
        })(),
        c.signal,
      );

      console.log('Success createPDF');
      clearTimeout(timer);
      return;
    } catch (e) {
      console.error(e);

      if (retryCount >= 5) {
        console.log('Failed createPDF');
        return;
      }

      // リトライ処理
      console.log(`Retry createPDF`);
      await retry(retryCount + 1);
      return;
    }
  };
  await retry();
  return;
};
