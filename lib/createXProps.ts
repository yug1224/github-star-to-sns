import { FeedEntry } from 'https://deno.land/x/rss@0.6.0/src/types/mod.ts';

// deno-lint-ignore require-await
export default async ({ item }: { item: FeedEntry }) => {
  const title: string = (item.title?.value || '').trim();
  const link: string = item.links[0].href || '';

  // X用のテキストを作成
  const xText = (() => {
    return `${link}\n${title}`;
  })();

  console.log('success createXProps');
  return { xText };
};
