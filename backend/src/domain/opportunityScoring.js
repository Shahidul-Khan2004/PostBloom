function percentileRank(values, value) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const below = sorted.filter((v) => v < value).length;
  const equal = sorted.filter((v) => v === value).length;
  return ((below + equal * 0.5) / sorted.length) * 100;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * @param {{ impressions?: number|null, engagements?: number|null, engagementRate?: number|null }} post
 */
export function classifyPostEvidence(post) {
  const { impressions, engagements, engagementRate } = post;
  if (
    impressions != null &&
    engagements != null &&
    engagementRate != null
  ) {
    return {
      evidenceType: "engagement_validated",
      scoreBasis: "full_metrics",
      confidence: "strong_evidence",
    };
  }
  if (
    impressions != null &&
    engagements === null &&
    engagementRate === null
  ) {
    return {
      evidenceType: "reach_only",
      scoreBasis: "reach_only",
      confidence: "limited_evidence",
    };
  }
  return {
    evidenceType: null,
    scoreBasis: null,
    confidence: null,
  };
}

function recencyPercentiles(posts, periodEnd) {
  const end = periodEnd ? new Date(periodEnd) : new Date();
  const recencyDays = posts.map((p) => {
    if (!p.publishDate) return 365;
    const d = new Date(p.publishDate);
    return Math.max(0, (end - d) / (1000 * 60 * 60 * 24));
  });
  const maxRecency = Math.max(...recencyDays, 1);
  return recencyDays.map((days) => ((maxRecency - days) / maxRecency) * 100);
}

function validatedLabelAndReasons(engPct, impPct, ratePct) {
  if (engPct >= 90 && impPct >= 90) {
    return {
      recommendationLabel: "Breakout reach opportunity",
      recommendationReasons: [
        "Top-tier reach among posts with measured engagement.",
        "Top-tier total recorded engagement.",
        "Strong candidate for broad cross-platform expansion.",
      ],
    };
  }
  if (ratePct >= 90) {
    return {
      recommendationLabel: "High response-rate opportunity",
      recommendationReasons: [
        "Audience response rate is in the top tier of measured posts.",
        "Strong candidate for adapting this idea into new formats.",
      ],
    };
  }
  if (impPct >= 70 && ratePct >= 60) {
    return {
      recommendationLabel: "Balanced expansion opportunity",
      recommendationReasons: [
        "Strong reach with above-average audience response among posts with measured engagement.",
      ],
    };
  }
  return {
    recommendationLabel: "Measured content opportunity",
    recommendationReasons: [
      "Engagement evidence is available for evaluation among posts with measured engagement.",
    ],
  };
}

const REACH_ONLY_REASONS = [
  "This post received measurable reach during the analytics reporting window.",
  "Engagement metrics were unavailable in the LinkedIn export.",
  "Review the source content before investing in cross-platform expansion.",
];

function scoreValidatedCohort(posts, periodEnd) {
  if (posts.length === 0) return [];

  const impressions = posts.map((p) => Number(p.impressions ?? 0));
  const engagements = posts.map((p) => Number(p.engagements ?? 0));
  const rates = posts.map((p, i) => {
    if (p.engagementRate != null && impressions[i] > 0) {
      return Number(p.engagementRate) * 100;
    }
    if (impressions[i] > 0) return (engagements[i] / impressions[i]) * 100;
    return 0;
  });
  const recencyPcts = recencyPercentiles(posts, periodEnd);

  const scored = posts.map((post, i) => {
    const impPct = percentileRank(impressions, impressions[i]);
    const engPct = percentileRank(engagements, engagements[i]);
    const ratePct = percentileRank(rates, rates[i]);
    const recencyPct = recencyPcts[i];

    const weights = { imp: 0.4, eng: 0.35, rate: 0.15, recency: 0.1 };
    const score = round2(
      weights.imp * impPct +
        weights.eng * engPct +
        weights.rate * ratePct +
        weights.recency * recencyPct
    );

    const { recommendationLabel, recommendationReasons } = validatedLabelAndReasons(
      engPct,
      impPct,
      ratePct
    );

    return {
      ...post,
      evidenceType: "engagement_validated",
      scoreBasis: "full_metrics",
      confidence: "strong_evidence",
      score,
      scoreBreakdown: {
        impPct: round2(impPct),
        engPct: round2(engPct),
        ratePct: round2(ratePct),
        recencyPct: round2(recencyPct),
        weights,
        notes: "Full metrics available",
      },
      recommendationLabel,
      recommendationReasons,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s, index) => ({
    ...s,
    rankWithinEvidenceType: index + 1,
  }));
}

function scoreReachOnlyCohort(posts, periodEnd) {
  if (posts.length === 0) return [];

  const impressions = posts.map((p) => Number(p.impressions ?? 0));
  const recencyPcts = recencyPercentiles(posts, periodEnd);

  const scored = posts.map((post, i) => {
    const impPct = percentileRank(impressions, impressions[i]);
    const recencyPct = recencyPcts[i];

    const weights = { impressions: 0.85, recency: 0.15 };
    const score = round2(weights.impressions * impPct + weights.recency * recencyPct);

    return {
      ...post,
      evidenceType: "reach_only",
      scoreBasis: "reach_only",
      confidence: "limited_evidence",
      score,
      scoreBreakdown: {
        notes: "Reach-only evaluation; engagement metrics unavailable.",
        impPct: round2(impPct),
        recencyPct: round2(recencyPct),
        weights,
        excludedMetrics: ["engagements", "engagementRate"],
      },
      recommendationLabel: "Reach-led signal",
      recommendationReasons: [...REACH_ONLY_REASONS],
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s, index) => ({
    ...s,
    rankWithinEvidenceType: index + 1,
  }));
}

/**
 * Score posts relative to the imported cohort, split by evidence tier.
 * @param {Array<{ impressions?: number|null, engagements?: number|null, engagementRate?: number|null, publishDate?: Date|string|null }>} posts
 * @param {{ periodEnd?: Date|string|null }} options
 */
export function scoreOpportunities(posts, options = {}) {
  const periodEnd = options.periodEnd ?? null;

  const validated = [];
  const reachOnly = [];
  const unscored = [];

  for (const post of posts) {
    const tier = classifyPostEvidence(post);
    if (tier.evidenceType === "engagement_validated") {
      validated.push(post);
    } else if (tier.evidenceType === "reach_only") {
      reachOnly.push(post);
    } else {
      unscored.push(post);
    }
  }

  const scoredValidated = scoreValidatedCohort(validated, periodEnd);
  const scoredReachOnly = scoreReachOnlyCohort(reachOnly, periodEnd);

  const offset = scoredValidated.length;
  const merged = [
    ...scoredValidated.map((s, i) => ({
      ...s,
      rank: i + 1,
    })),
    ...scoredReachOnly.map((s, i) => ({
      ...s,
      rank: offset + i + 1,
    })),
    ...unscored.map((post, i) => ({
      ...post,
      evidenceType: null,
      scoreBasis: null,
      confidence: null,
      score: null,
      scoreBreakdown: null,
      recommendationLabel: null,
      recommendationReasons: [],
      rankWithinEvidenceType: null,
      rank: offset + scoredReachOnly.length + i + 1,
    })),
  ];

  return merged;
}
