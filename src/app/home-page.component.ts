import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-home-page',
  standalone: true,
  template: `
    <header class="site-header">
      <div class="page-container site-header__inner">
        <a class="brand" href="#inicio" aria-label="Wayly, ir al inicio">
          <span class="brand__mark" aria-hidden="true">w</span>
          <span>wayly</span>
        </a>
        <span class="badge site-header__note">Ideas para tu tiempo libre</span>
      </div>
    </header>

    <main id="inicio">
      <section class="hero page-container" aria-labelledby="hero-title">
        <div class="hero__copy">
          <p class="eyebrow"><span aria-hidden="true"></span> TU TIEMPO. TU LUGAR. TU PLAN.</p>
          <h1 id="hero-title">Haz que tu tiempo libre <span>cuente.</span></h1>
          <p class="hero__description">
            Encuentra ideas para disfrutar de donde estás, según el tiempo que tienes
            y lo que te apetece hacer.
          </p>
          <a class="button hero__action" href="#como-funciona">
            Descubre Wayly
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
              <path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </a>
          <p class="hero__note">Una forma más sencilla de decidir qué hacer.</p>
        </div>

        <div class="hero-art" aria-hidden="true">
          <div class="hero-art__sun"></div>
          <div class="hero-art__orbit hero-art__orbit--outer"></div>
          <div class="hero-art__orbit hero-art__orbit--inner"></div>
          <div class="hero-art__path"></div>
          <span class="hero-art__dot hero-art__dot--one"></span>
          <span class="hero-art__dot hero-art__dot--two"></span>
          <span class="hero-art__dot hero-art__dot--three"></span>
          <div class="hero-art__card hero-art__card--time">
            <span class="hero-art__icon hero-art__icon--time">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="8.25" stroke="currentColor" stroke-width="1.7" />
                <path d="M12 7.5V12l3 1.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
              </svg>
            </span>
            <span><strong>Tu tiempo</strong><small>Un hueco en el día</small></span>
          </div>
          <div class="hero-art__card hero-art__card--place">
            <span class="hero-art__icon hero-art__icon--place">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M19 10.1c0 5.1-7 10.4-7 10.4S5 15.2 5 10.1a7 7 0 1 1 14 0Z" stroke="currentColor" stroke-width="1.7" />
                <circle cx="12" cy="10" r="2.2" stroke="currentColor" stroke-width="1.7" />
              </svg>
            </span>
            <span><strong>Tu lugar</strong><small>Cerca de ti</small></span>
          </div>
          <div class="hero-art__card hero-art__card--mood">
            <span class="hero-art__icon hero-art__icon--mood">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 20s-7-4.1-7-9.3A3.7 3.7 0 0 1 12 8.4a3.7 3.7 0 0 1 7 2.3C19 15.9 12 20 12 20Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
              </svg>
            </span>
            <span><strong>Lo que te gusta</strong><small>A tu manera</small></span>
          </div>
          <span class="hero-art__spark hero-art__spark--one">✳</span>
          <span class="hero-art__spark hero-art__spark--two">✳</span>
        </div>
      </section>

      <section id="como-funciona" class="intro-section" aria-labelledby="intro-title">
        <div class="page-container">
          <div class="section-heading">
            <span class="badge badge--accent">MENOS BUSCAR, MÁS DISFRUTAR</span>
            <h2 id="intro-title">Tu plan empieza contigo.</h2>
            <p>Wayly quiere convertir unas pocas pistas en una idea que encaje con tu día.</p>
          </div>

          <div class="idea-grid">
            <article class="surface-card idea-card">
              <span class="idea-card__number" aria-hidden="true">01</span>
              <h3>El tiempo que tienes</h3>
              <p>Una pausa corta o una tarde entera: cada momento puede convertirse en un buen plan.</p>
            </article>
            <article class="surface-card idea-card">
              <span class="idea-card__number" aria-hidden="true">02</span>
              <h3>El lugar donde estás</h3>
              <p>Ideas pensadas para tu entorno, para que pasar de decidir a disfrutar sea más fácil.</p>
            </article>
            <article class="surface-card idea-card">
              <span class="idea-card__number" aria-hidden="true">03</span>
              <h3>Lo que te apetece</h3>
              <p>Tus preferencias ayudan a dar forma a una propuesta que se sienta más tuya.</p>
            </article>
          </div>
          <p class="intro-section__closing">Estamos preparando nuevas formas de aprovechar cada día.</p>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="page-container site-footer__inner">
        <a class="brand brand--footer" href="#inicio" aria-label="Wayly, volver al inicio">
          <span class="brand__mark" aria-hidden="true">w</span>
          <span>wayly</span>
        </a>
        <p>Tu tiempo. Tu lugar. Tu plan.</p>
      </div>
    </footer>
  `,
  styleUrl: './home-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {}
