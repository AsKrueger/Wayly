import { effect, inject, Injectable, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { I18nService } from './i18n.service';
import { MessageKey } from './i18n.types';

/**
 * Route `title` values are message keys. The document title follows both the
 * route and the selected language.
 */
@Injectable()
export class TranslatedTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly i18n = inject(I18nService);
  private readonly titleKey = signal<MessageKey | null>(null);

  constructor() {
    super();
    effect(() => {
      const key = this.titleKey();
      const name = this.i18n.t('app.name');
      this.title.setTitle(key ? `${this.i18n.t(key)} · ${name}` : name);
    });
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.titleKey.set((this.buildTitle(snapshot) as MessageKey | undefined) ?? null);
  }
}
