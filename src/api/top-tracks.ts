import type { VercelRequest, VercelResponse } from "@vercel/node";

import { html } from 'htm/preact';
import { render } from "preact-render-to-string";
import { Track } from "../components/Track.ts";
import { topTrack } from "../utils/spotify.ts";
import { toBase64 } from "../utils/encoding.ts";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const url = new URL(req.url, 'https://status.nmoo.dev/');
    const i = url.searchParams.get("i");

    const index = Number.parseInt(i ?? "", 10);
    const item = await topTrack({ index });

    if (!item) {
      return res.status(404).send(null);
    }

    // If `open` is present (any value, including empty), redirect if possible.
    if (url.searchParams.has("open")) {
      const location = item?.external_urls?.spotify;

      if (location) {
        return res.redirect(302, location);
      }

      return res.status(200).send(null);
    }

    const { name: track } = item;
    const { images = [] } = item.album ?? {};
    const cover = images[images.length - 1]?.url;

    let coverImg: string | undefined = undefined;
    if (cover) {
      const resp = await fetch(cover);
      const buff = await resp.arrayBuffer();
      coverImg = `data:image/jpeg;base64,${toBase64(buff)}`;
    }

    const artist = (item.artists ?? []).map(({ name }) => name).join(", ");

    const text = render(html`<${Track} index=${index} cover=${coverImg} artist=${artist} track=${track} />`);
    return res.status(200).send(text);
  }
