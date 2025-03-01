import 'jsr:@std/dotenv/load';
import { delay } from 'jsr:@std/async';
import AtprotoAPI from 'npm:@atproto/api';
import createBlueskyProps from './lib/createBlueskyProps.ts';
import createPDF from './lib/createPDF.ts';
import createSummary from './lib/createSummary.ts';
import createXProps from './lib/createXProps.ts';
import getItemList from './lib/getItemList.ts';
import getOgp from './lib/getOgp.ts';
import postBluesky from './lib/postBluesky.ts';
import postWebhook from './lib/postWebhook.ts';
import resizeImage from './lib/resizeImage.ts';

let cnt = 0, currentItem, itemList;
try {
  // rss feedから記事リストを取得
  itemList = await getItemList();
  console.log(JSON.stringify(itemList, null, 2));

  // 対象がなかったら終了
  if (!itemList.length) {
    console.log('not found feed item');
    Deno.exit(0);
  }

  // Blueskyにログイン
  const { BskyAgent } = AtprotoAPI;
  const service = 'https://bsky.social';
  const agent = new BskyAgent({ service });
  const identifier = Deno.env.get('BLUESKY_IDENTIFIER') || '';
  const password = Deno.env.get('BLUESKY_PASSWORD') || '';
  await agent.login({ identifier, password });

  // 取得した記事リストをループ処理
  for await (const item of itemList) {
    // 投稿回数をカウントし、3件以上投稿したら終了
    cnt++;
    if (cnt > 3) {
      console.log('post count over');
      break;
    }

    currentItem = item;

    // 最終実行時間を更新
    const timestamp = item.published ? new Date(item.published).toISOString() : new Date().toISOString();
    await Deno.writeTextFile('.timestamp', timestamp);

    const link = item.links[0].href || '';

    // URLからOGPの取得
    const og = await getOgp(link);

    const path = `${timestamp}.pdf`;

    // WebページをPDF化
    await createPDF(link, path);

    // Gemini APIで要約
    const summary = await createSummary(path);

    // 投稿記事のプロパティを作成
    const { bskyText } = await createBlueskyProps({
      agent,
      item: {
        ...item,
        summary,
      },
    });
    const { xText } = await createXProps({
      item: {
        ...item,
        summary,
      },
    });

    // 画像のリサイズ
    const { mimeType, resizedImage } = await (async () => {
      const ogImage = og.ogImage?.at(0);
      if (!ogImage) {
        console.log('ogp image not found');
        return {};
      }
      return await resizeImage(new URL(ogImage.url, link).href);
    })();

    // Blueskyに投稿
    await postBluesky({
      agent,
      rt: bskyText,
      title: (og.ogTitle || '').trim(),
      link,
      description: (og.ogDescription || '').trim(),
      mimeType,
      image: resizedImage,
    });

    // IFTTTを使ってXに投稿
    await postWebhook(xText);

    // 30秒待つ
    console.log('wait 30 seconds');
    await delay(1000 * 30);
  }

  // 終了
  Deno.exit(0);
} catch (e) {
  // エラーが発生した記事をリストの最後に追加して保存する
  if (currentItem && itemList) {
    await Deno.writeTextFile(
      '.itemList.json',
      JSON.stringify([...itemList.slice(cnt), {
        ...currentItem,
        published: itemList.at(-1)?.published || currentItem.published,
      }]),
    );
  }

  // エラーが発生したらログを出力して終了
  if (e instanceof Error) {
    console.error(e.stack);
  }

  Deno.exit(1);
}
