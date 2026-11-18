import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MessageKey } from '../../core/i18n/i18n.types';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

interface AboutStep {
  readonly number: string;
  readonly title: MessageKey;
  readonly body: MessageKey;
}

@Component({
  selector: 'app-about-page',
  imports: [RouterLink, TranslatePipe],
  template: `
    <article class="about page-container">
      <header class="about__hero">
        <p class="eyebrow">{{ 'about.eyebrow' | t }}</p>
        <h1>{{ 'about.title' | t }}</h1>
        <p class="about__intro">{{ 'about.intro' | t }}</p>
      </header>

      <section aria-labelledby="about-steps">
        <h2 id="about-steps">{{ 'about.stepsTitle' | t }}</h2>
        <ol class="about__steps">
          @for (step of steps; track step.number) {
            <li class="surface-card">
              <span class="about__step-number" aria-hidden="true">{{ step.number }}</span>
              <h3>{{ step.title | t }}</h3>
              <p>{{ step.body | t }}</p>
            </li>
          }
        </ol>
      </section>

      <div class="about__grid">
        <section class="surface-card" aria-labelledby="about-data">
          <h2 id="about-data">{{ 'about.dataTitle' | t }}</h2>
          <p>{{ 'about.dataBody' | t }}</p>
          <h3>{{ 'about.estimatesTitle' | t }}</h3>
          <p>{{ 'about.estimatesBody' | t }}</p>
        </section>

        <section class="surface-card" aria-labelledby="about-privacy">
          <h2 id="about-privacy">{{ 'about.privacyTitle' | t }}</h2>
          <ul class="about__list">
            @for (item of privacyItems; track item) {
              <li>{{ item | t }}</li>
            }
          </ul>
          <h3>{{ 'about.servicesTitle' | t }}</h3>
          <p>{{ 'about.servicesBody' | t }}</p>
        </section>
      </div>

      <p class="about__cta">
        <a class="button" routerLink="/">{{ 'about.cta' | t }}</a>
      </p>
    </article>
  `,
  styles: `
    .about {
      padding-block: var(--space-7);
    }

    .about__hero {
      max-width: 46rem;
      margin-bottom: var(--space-7);
    }

    h1 {
      margin: var(--space-2) 0 var(--space-4);
      font-size: clamp(2rem, 5vw, 3.25rem);
      letter-spacing: -0.04em;
      line-height: var(--line-height-heading);
    }

    h2 {
      margin: 0 0 var(--space-4);
      font-size: var(--font-size-xl);
      letter-spacing: -0.02em;
    }

    h3 {
      margin: var(--space-5) 0 var(--space-2);
      font-size: var(--font-size-md);
    }

    p,
    li {
      color: var(--color-text-muted);
    }

    .about__intro {
      font-size: var(--font-size-lg);
    }

    .about__steps {
      display: grid;
      gap: var(--space-4);
      margin: 0 0 var(--space-6);
      padding: 0;
      list-style: none;
    }

    .about__steps li {
      padding: var(--space-5);
    }

    .about__steps h3 {
      margin-top: var(--space-3);
      color: var(--color-text);
    }

    .about__steps p {
      margin: 0;
    }

    .about__step-number {
      display: grid;
      width: 2.25rem;
      height: 2.25rem;
      place-items: center;
      border-radius: var(--radius-pill);
      background: var(--color-brand-soft);
      color: var(--color-brand);
      font-weight: 800;
    }

    .about__grid {
      display: grid;
      gap: var(--space-4);
    }

    .about__grid section {
      padding: var(--space-6);
    }

    .about__list {
      display: grid;
      gap: var(--space-2);
      margin: 0;
      padding-left: 1.2rem;
    }

    .about__cta {
      margin-top: var(--space-6);
    }

    @media (min-width: 48rem) {
      .about__steps {
        grid-template-columns: repeat(3, 1fr);
      }

      .about__grid {
        grid-template-columns: 1fr 1fr;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPageComponent {
  readonly steps: readonly AboutStep[] = [
    { number: '1', title: 'about.steps.where.title', body: 'about.steps.where.body' },
    { number: '2', title: 'about.steps.what.title', body: 'about.steps.what.body' },
    { number: '3', title: 'about.steps.plan.title', body: 'about.steps.plan.body' },
  ];

  readonly privacyItems: readonly MessageKey[] = [
    'about.privacyItems.account',
    'about.privacyItems.location',
    'about.privacyItems.storage',
    'about.privacyItems.tracking',
  ];
}
