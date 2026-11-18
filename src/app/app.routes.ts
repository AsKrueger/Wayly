import { Routes } from '@angular/router';
import { MessageKey } from './core/i18n/i18n.types';

const title = (key: MessageKey): string => key;

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/discover/discover-page.component').then((m) => m.DiscoverPageComponent),
    title: title('titles.home'),
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./features/about/about-page.component').then((m) => m.AboutPageComponent),
    title: title('titles.about'),
  },
  { path: '**', redirectTo: '' },
];
