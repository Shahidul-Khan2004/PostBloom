function percentileRank(values, value) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const below = sorted.filter((v) => v < value).length;
  const equal = sorted.filter((v) => v === value).length;
  return ((below + equal * 0.5) / sorted.length) * 100;
}

function recommendationLabel(score) {
  if (score >= 80) {
    return "High-performing vs your imported LinkedIn posts — strong cross-platform expansion candidate";
  }
  if (score >= 60) {
    return "Above your median — good expansion candidate";
  }
  if (score >= 40) {
    return "Moderate performer in this import";
  }
  return "Lower relative performance — optional expansion";
}

/**
 * Score posts relative to the imported cohort only.
 * @param {Array<{ impressions?: number|null, engagements?: number|null, publishDate?: Date|string|null }>} posts
 * @param {{ periodEnd?: Date|string|null }} options
 */
export function scoreOpportunities(posts, options = {}) {
  const periodEnd = options.periodEnd ? new Date(options.periodEnd) : new Date();

  const impressions = posts.map((p) => Number(p.impressions ?? 0));
  const engagements = posts.map((p) =>
    p.engagements != null ? Number(p.engagements) : null
  );

  const rates = posts.map((p, i) => {
    const imp = impressions[i];
    const eng = engagements[i];
    if (imp > 0 && eng != null) return (eng / imp) * 100;
    return null;
  });

  const recencyDays = posts.map((p) => {
    if (!p.publishDate) return 365;
    const d = new Date(p.publishDate);
    return Math.max(0, (periodEnd - d) / (1000 * 60 * 60 * 24));
  });
  const maxRecency = Math.max(...recencyDays, 1);

  const scored = posts.map((post, i) => {
    const imp = impressions[i];
    const eng = engagements[i];
    const hasEng = eng != null;

    const impPct = percentileRank(impressions, imp);
    const engPct = hasEng ? percentileRank(
      engagements.filter((e) => e != null),
      eng
    ) : impPct;

    const ratePct =
      rates[i] != null
        ? percentileRank(
            rates.filter((r) => r != null),
            rates[i]
          )
        : 0;

    const recencyPct = ((maxRecency - recencyDays[i]) / maxRecency) * 100;

    let score;
    let weights;
    let notes;

    if (hasEng) {
      weights = { imp: 0.4, eng: 0.35, rate: 0.15, recency: 0.1 };
      score =
        weights.imp * impPct +
        weights.eng * engPct +
        weights.rate * ratePct +
        weights.recency * recencyPct;
      notes = "Full metrics available";
    } else {
      weights = { imp: 0.55, eng: 0, rate: 0.15, recency: 0.1 };
      score =
        weights.imp * impPct +
        weights.rate * ratePct +
        weights.recency * recencyPct;
      notes = "Engagements missing — weights redistributed to impressions";
    }

    const rounded = Math.round(score * 100) / 100;

    return {
      ...post,
      score: rounded,
      scoreBreakdown: {
        impPct: Math.round(impPct * 100) / 100,
        engPct: Math.round(engPct * 100) / 100,
        ratePct: Math.round(ratePct * 100) / 100,
        recencyPct: Math.round(recencyPct * 100) / 100,
        weights,
        notes,
      },
      recommendationLabel: recommendationLabel(rounded),
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s, index) => ({ ...s, rank: index + 1 }));
}
