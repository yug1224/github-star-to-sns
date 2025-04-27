import { type FeedEntry } from 'jsr:@mikaelporttila/rss';

// deno-lint-ignore require-await
export default async ({ item }: { item: FeedEntry & { summary: string } }) => {
  const title: string = (item.title?.value || '').trim();
  const link: string = item.links[0].href || '';
  const summary = item.summary;

  // X用のテキストを作成
  const xText = (() => {
    return summary ? `${summary}\n\n${title}\n${link}` : `${title}\n${link}`;
  })();

  console.log('Success createXProps');
  return { xText };
};
