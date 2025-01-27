import { abortable } from 'jsr:@std/async';
import { launch } from 'jsr:@astral/astral';
export default async (url: string, path: string) => {
  const retry = async (retryCount = 0) => {
    try {
      const c = new AbortController();
      // 10秒でタイムアウト
      const timer = setTimeout(() => {
        console.log('Timeout createPDF');
        return c.abort();
      }, 1000 * 10 * (retryCount + 1));

      await abortable(
        (async () => {
          const browser = await launch();
          const page = await browser.newPage();
          await page.goto(url, { waitUntil: 'load' });
          const pdf = await page.pdf({
            paperWidth: 33.1,
            paperHeight: 46.8,
          });
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
