import { type FeedEntry } from 'jsr:@mikaelporttila/rss';
import defaultsGraphemer from 'npm:graphemer';

const Graphemer = defaultsGraphemer.default;
const splitter = new Graphemer();

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
    const { host, pathname } = new URL(link);
    const key = splitter.splitGraphemes(`${host}${pathname}`).slice(0, 19).join('') + '...';
    let text = `${key}\n${title}`;

    if (summary) {
      text = `${text}\n\n${summary}`;
    }

    const rt = new RichText({ text });
    await rt.detectFacets(agent);
    rt.facets = [
      {
        index: {
          byteStart: 0,
          byteEnd: splitter.countGraphemes(key),
        },
        features: [
          {
            $type: 'app.bsky.richtext.facet#link',
            uri: link,
          },
        ],
      },
      ...(rt.facets || []),
    ];
    return rt;
  })();

  console.log('Success createBlueskyProps');
  return { bskyText };
};
