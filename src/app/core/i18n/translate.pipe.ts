import { inject, Pipe, PipeTransform } from '@angular/core';
import { I18nService } from './i18n.service';
import { MessageKey, MessageParams } from './i18n.types';

/**
 * `{{ 'nav.home' | t }}`. Impure so that a language change re-renders the
 * text; the lookup is a cheap property walk.
 */
@Pipe({ name: 't', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: MessageKey, params?: MessageParams): string {
    return this.i18n.t(key, params);
  }
}
