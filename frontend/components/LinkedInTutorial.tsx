'use client';

import { useEffect, useMemo, useState } from 'react';
import step1Image from '../app/assets/ss1.png';
import step2Image from '../app/assets/ss2.png';
import step3Image from '../app/assets/ss3.png';
import step4Image from '../app/assets/ss4.png';
import step5Image from '../app/assets/ss5.png';
import step6Image from '../app/assets/ss6.png';

const steps = [
  {
    label: 'Step 1',
    title: 'Open your LinkedIn profile',
    image: step1Image,
    instructions: [
      'Go to your LinkedIn profile page.',
      'Scroll down until the Analytics section is visible.',
      'Keep this tab open because the export flow starts from your profile analytics.'
    ]
  },
  {
    label: 'Step 2',
    title: 'Open all analytics',
    image: step2Image,
    instructions: [
      'Find the Analytics card on your profile.',
      'Click Show all to open the full analytics view.',
      'This is where LinkedIn exposes content performance data.'
    ]
  },
  {
    label: 'Step 3',
    title: 'Choose content analytics',
    image: step3Image,
    instructions: [
      'On the analytics page, use the left navigation.',
      'Select Content analytics.',
      'Confirm you are viewing the Posts analytics tab.'
    ]
  },
  {
    label: 'Step 4',
    title: 'Open the date filter',
    image: step4Image,
    instructions: [
      'Click the date range filter near the top of the analytics page.',
      'LinkedIn may show Past 7 days by default.',
      'You need the widest range before exporting.'
    ]
  },
  {
    label: 'Step 5',
    title: 'Select past 365 days',
    image: step5Image,
    instructions: [
      'Choose Past 365 days from the date options.',
      'Click Show results.',
      'Wait for the chart and discovery numbers to refresh.'
    ]
  },
  {
    label: 'Step 6',
    title: 'Export the CSV file',
    image: step6Image,
    instructions: [
      'Click Export in the top-right corner.',
      'Save the CSV file from LinkedIn.',
      'Return to PostBloom and upload that CSV on the analytics import page.'
    ]
  }
];

export function LinkedInTutorial() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeStep = steps[activeIndex];
  const progress = useMemo(() => `${Math.round(((activeIndex + 1) / steps.length) * 100)}%`, [activeIndex]);

  useEffect(() => {
    document.body.className = 'app-body tutorial-guide-body';
    document.body.dataset.page = 'linkedin-tutorial';

    return () => {
      document.body.classList.remove('tutorial-guide-body');
    };
  }, []);

  function goNext() {
    if (activeIndex === steps.length - 1) {
      localStorage.setItem('postbloomTutorialDone', 'true');
      window.location.href = '/app/analyze';
      return;
    }

    setActiveIndex((index) => Math.min(steps.length - 1, index + 1));
  }

  return (
    <main className="tutorial-guide-shell">
      <header className="tutorial-guide-top">
        <a className="app-logo" href="/" aria-label="PostBloom home" />
        <a className="btn btn-secondary" href="/app/import">Skip to Import</a>
      </header>

      <section className="tutorial-guide-hero">
        <div>
          <div className="page-kicker">LinkedIn analytics export</div>
          <h1>Prepare your LinkedIn CSV for PostBloom.</h1>
        </div>
        <div className="tutorial-guide-progress" aria-label={`Tutorial progress ${progress}`}>
          <span style={{ width: progress }} />
        </div>
      </section>

      <section className="tutorial-guide-card glass">
        <figure className="tutorial-guide-media">
          <img src={activeStep.image.src} alt={`${activeStep.label}: ${activeStep.title}`} />
        </figure>

        <aside className="tutorial-guide-panel">
          <div className="tutorial-guide-step">{activeStep.label} of {steps.length}</div>
          <h2>{activeStep.title}</h2>
          <ol>
            {activeStep.instructions.map((instruction) => (
              <li key={instruction}>{instruction}</li>
            ))}
          </ol>

          <div className="tutorial-guide-actions">
            <button
              className="btn btn-secondary"
              type="button"
              disabled={activeIndex === 0}
              onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
            >
              Back
            </button>
            <button className="btn btn-primary" type="button" onClick={goNext}>
              {activeIndex === steps.length - 1 ? 'Continue to Import' : 'Next Step'}
            </button>
          </div>
        </aside>
      </section>

      <nav className="tutorial-guide-steps" aria-label="Tutorial steps">
        {steps.map((step, index) => (
          <button
            className={index === activeIndex ? 'active' : ''}
            key={step.label}
            type="button"
            onClick={() => setActiveIndex(index)}
          >
            <span>{step.label}</span>
            {step.title}
          </button>
        ))}
      </nav>
    </main>
  );
}
