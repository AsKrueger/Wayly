import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { I18nService } from './core/i18n/i18n.service';
import { Language, LANGUAGES } from './core/i18n/i18n.types';
import { TranslatePipe } from './core/i18n/translate.pipe';
import { ThemeService } from './core/theme/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly i18n = inject(I18nService);
  readonly theme = inject(ThemeService);
  readonly languages = LANGUAGES;
  readonly year = new Date().getFullYear();

  languageName(language: Language): string {
    return this.i18n.t(`nav.languageName.${language}`);
  }

  readonly themeLabel = computed(() =>
    this.i18n.t('nav.theme.button', {
      mode: this.i18n.t(`nav.theme.${this.theme.mode()}`),
    }),
  );
}
