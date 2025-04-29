import { type FeedEntry } from 'jsr:@mikaelporttila/rss';

import AtprotoAPI, { AtpAgent } from 'npm:@atproto/api';
const { RichText } = AtprotoAPI;

export default async ({ agent, item }: {
  agent: AtpAgent;
  item: FeedEntry & { summary: string };
}) => {
  const title: string = (item.title?.value || '').trim();
  const link = item.links[0].href || '';
  const summary = item.summary;

  // Bluesky用のテキストを作成
  const bskyText = await (async () => {
    let text = `${title}\n${link}`;

    if (summary) {
      text = `${summary}\n\n${text}`;
    }

    const rt = new RichText({ text });
    await rt.detectFacets(agent);
    return rt;
  })();

  console.log('Success createBlueskyProps');
  return { bskyText };
};
