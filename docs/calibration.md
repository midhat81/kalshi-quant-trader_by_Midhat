# Calibration Methodology

## What this measures

A forecasting system is well-calibrated if, among all the times it predicts an event with probability p, that event actually happens roughly p fraction of the time. Calibration is the standard way professional forecasters (Metaculus, the Good Judgment Project) and quant researchers evaluate probabilistic predictions — accuracy alone is misleading, since a forecaster who always says "90%" and is right 90% of the time is well-calibrated, while one who says "99%" and is right 90% of the time is overconfident, even if both have the same hit rate.

## How it's computed here

For every signal the system generates, calibration.py later checks whether that signal's market has genuinely settled on Kalshi (status == "settled"). If so, it records:

- The model's stated probability at signal time (predicted_probability)
- The real outcome (resolution_value, directly from Kalshi — never inferred)
- The Brier score component: (predicted_probability_of_yes - actual_outcome)^2

The Brier score is the average of these components across all resolved signals:
- 0.0 = perfect calibration
- 0.25 = what a forecaster who always guesses 50% achieves against a coin-flip-like distribution
- 1.0 = maximally wrong on every prediction

## Why this can't be faked

Calibration data is only ever written after Kalshi's own API confirms a real settlement. There is no code path that estimates, backfills, or assumes an outcome. If you inspect check_and_record_resolutions() in calibration.py, you'll see it skips any market that isn't reported as settled — there's no shortcut to generate more calibration records faster than markets actually resolve.

## Current limitations

- Small sample sizes early on will produce noisy Brier scores — the API's calibration_note field says so explicitly once fewer than 20 resolutions exist
- Currently scoped to the KXHIGHNY series; broader coverage requires tracking more series over time