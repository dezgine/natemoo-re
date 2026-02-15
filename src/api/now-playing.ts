import type { VercelRequest, VercelResponse } from "@vercel/node";

import { html } from 'htm/preact';
import { render } from "preact-render-to-string";
import { Player } from "../components/NowPlaying.ts";
import { nowPlaying } from "../utils/spotify.ts";
import { toBase64 } from "../utils/encoding.ts";

const t0 = Date.now();
const mark = (m: string) => console.log(`${Date.now() - t0}ms ${m}`);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  mark("start");

  const {
    item = {} as any,
    is_playing: isPlaying = false,
    progress_ms: progress = 0,
  } = await nowPlaying();
  mark("nowPlaying done");

  const url = new URL(req.url, "https://status.nmoo.dev/");

  // If `open` param is present, attempt redirect
  if (url.searchParams.has("open")) {
    const location = item?.external_urls?.spotify;

    if (location) {
      return res.redirect(302, location);
    }

    return res.status(200).send(null);
  }
  const { duration_ms: duration, name: track } = item ?? {};
  const { images = [] } = item?.album ?? {};

  const cover = images[images.length - 1]?.url;

  let coverImg: string | undefined;
  if (cover) {
    mark("cover fetch");
    const buf = await fetch(cover).then(res => res.arrayBuffer());
    coverImg = `data:image/jpeg;base64,${toBase64(buf)}`;
    mark("cover done");
  }

  const artist = (item?.artists ?? [])
    .map(({ name }: { name: string }) => name)
    .join(", ");

  mark("render");
  console.log({ isPlaying, artist, track })
  const text = render(
    html`<${Player} ...${{
      cover: coverImg,
      artist,
      track,
      isPlaying,
      progress,
      duration
    }} />`
  );
  mark("render done");
  return res.status(200).send(text);
}
