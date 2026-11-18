import { inject, Injectable } from '@angular/core';
import { PlaceDetails, PlaceSummary } from '../../core/application/ports/place-details';
import { Place } from '../../core/domain/models/place';
import { Language } from '../../core/i18n/i18n.types';
import { FETCH, fetchJson } from '../http/fetch-json';

const TIMEOUT_MS = 8000;
const WIKI_LANGUAGE = /^[a-z]{2,3}(?:-[a-z]{2,8})?$/;
const WIKIDATA_ID = /^Q\d+$/;

interface WikidataResponse {
  readonly entities?: Readonly<
    Record<string, { readonly sitelinks?: Readonly<Record<string, { readonly title?: string }>> }>
  >;
}

interface WikipediaSummary {
  readonly type?: string;
  readonly title?: string;
  readonly extract?: string;
  readonly thumbnail?: { readonly source?: string };
  readonly content_urls?: { readonly desktop?: { readonly page?: string } };
}

interface ArticleRef {
  readonly language: string;
  readonly title: string;
}

/** Parses the OpenStreetMap `wikipedia` tag, for example `es:Catedral de Sevilla`. */
export function parseWikipediaTag(tag: string | undefined): ArticleRef | null {
  const match = tag?.match(/^([a-z-]+):(.+)$/i);
  if (!match || !WIKI_LANGUAGE.test(match[1].toLowerCase())) {
    return null;
  }
  return { language: match[1].toLowerCase(), title: match[2].trim() };
}

/** Only images from Wikimedia's upload server are allowed by the CSP. */
function safeImage(url: string | undefined): string | undefined {
  if (!url) {
    return undefined;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'upload.wikimedia.org' ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
}

@Injectable()
export class WikipediaDetails extends PlaceDetails {
  private readonly fetchFn = inject(FETCH);
  private readonly cache = new Map<string, Promise<PlaceSummary | null>>();

  summary(place: Place, language: Language, signal?: AbortSignal): Promise<PlaceSummary | null> {
    if (!place.wikidata && !place.wikipedia) {
      return Promise.resolve(null);
    }
    const key = `${place.id}:${language}`;
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }
    const pending = this.load(place, language, signal).catch(() => null);
    this.cache.set(key, pending);
    return pending;
  }

  private async load(place: Place, language: Language, signal?: AbortSignal): Promise<PlaceSummary | null> {
    const article = (await this.articleInLanguage(place, language, signal)) ?? parseWikipediaTag(place.wikipedia);
    if (!article) {
      return null;
    }
    const title = encodeURIComponent(article.title.replace(/ /g, '_'));
    const summary = await fetchJson<WikipediaSummary>(
      this.fetchFn,
      `https://${article.language}.wikipedia.org/api/rest_v1/page/summary/${title}`,
      { timeoutMs: TIMEOUT_MS, signal },
    );
    if (summary.type === 'disambiguation' || !summary.extract || !summary.content_urls?.desktop?.page) {
      return null;
    }
    return {
      title: summary.title ?? article.title,
      extract: summary.extract,
      imageUrl: safeImage(summary.thumbnail?.source),
      articleUrl: summary.content_urls.desktop.page,
      language: article.language,
    };
  }

  /** Uses Wikidata to find the article in the user's language, if it exists. */
  private async articleInLanguage(
    place: Place,
    language: Language,
    signal?: AbortSignal,
  ): Promise<ArticleRef | null> {
    if (!place.wikidata || !WIKIDATA_ID.test(place.wikidata)) {
      return null;
    }
    const tagged = parseWikipediaTag(place.wikipedia);
    if (tagged?.language === language) {
      return tagged;
    }
    const params = new URLSearchParams({
      action: 'wbgetentities',
      ids: place.wikidata,
      props: 'sitelinks',
      sitefilter: `${language}wiki`,
      format: 'json',
      origin: '*',
    });
    const response = await fetchJson<WikidataResponse>(
      this.fetchFn,
      `https://www.wikidata.org/w/api.php?${params}`,
      { timeoutMs: TIMEOUT_MS, signal },
    );
    const title = response.entities?.[place.wikidata]?.sitelinks?.[`${language}wiki`]?.title;
    return title ? { language, title } : null;
  }
}
