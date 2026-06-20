import { Metrics, Trade, StrategyAnalysis, Recommendation, Warning } from '@/types'

/**
 * Analyze strategy performance and provide recommendations
 */
export function analyzeStrategy(metrics: Metrics, trades: Trade[]): StrategyAnalysis {
  const strengths: string[] = []
  const weaknesses: string[] = []
  const recommendations: Recommendation[] = []
  const warnings: Warning[] = []

  // Analyze profitability
  if (metrics.totalReturn > 0) {
    strengths.push(`Positive total return of ${metrics.totalReturnPercent.toFixed(2)}%`)
  } else if (metrics.totalReturn < 0) {
    weaknesses.push(`Negative total return of ${metrics.totalReturnPercent.toFixed(2)}%`)
    recommendations.push({
      type: 'performance',
      priority: 'high',
      title: 'Improve Strategy Profitability',
      description: 'The strategy is currently losing money overall.',
      actionable: 'Review entry and exit conditions, consider adding filters or adjusting parameters.',
    })
  }

  // Analyze win rate
  if (metrics.winRate >= 60) {
    strengths.push(`High win rate of ${metrics.winRate.toFixed(1)}%`)
  } else if (metrics.winRate < 40) {
    weaknesses.push(`Low win rate of ${metrics.winRate.toFixed(1)}%`)
    recommendations.push({
      type: 'performance',
      priority: 'high',
      title: 'Improve Win Rate',
      description: 'Win rate is below 40%, indicating poor entry timing.',
      actionable: 'Add confirmation indicators or tighten entry criteria.',
    })
  }

  // Analyze profit factor
  if (metrics.profitFactor >= 2) {
    strengths.push(`Excellent profit factor of ${metrics.profitFactor.toFixed(2)}`)
  } else if (metrics.profitFactor >= 1.5) {
    strengths.push(`Good profit factor of ${metrics.profitFactor.toFixed(2)}`)
  } else if (metrics.profitFactor < 1) {
    weaknesses.push(`Profit factor below 1 (${metrics.profitFactor.toFixed(2)})`)
    warnings.push({
      severity: 'critical',
      title: 'Unprofitable Strategy',
      description: 'Profit factor is below 1, meaning losses exceed gains.',
      suggestion: 'This strategy will lose money over time. Review and adjust before live trading.',
    })
  } else if (metrics.profitFactor < 1.5) {
    weaknesses.push(`Below-average profit factor of ${metrics.profitFactor.toFixed(2)}`)
    recommendations.push({
      type: 'optimization',
      priority: 'medium',
      title: 'Improve Profit Factor',
      description: 'Profit factor is marginal. Consider optimizing exits.',
      actionable: 'Adjust take-profit levels or add trailing stops to protect gains.',
    })
  }

  // Analyze risk/reward ratio
  if (metrics.riskRewardRatio >= 2) {
    strengths.push(`Excellent risk/reward ratio of ${metrics.riskRewardRatio.toFixed(2)}`)
  } else if (metrics.riskRewardRatio < 1) {
    weaknesses.push(`Poor risk/reward ratio of ${metrics.riskRewardRatio.toFixed(2)}`)
    recommendations.push({
      type: 'risk',
      priority: 'high',
      title: 'Improve Risk/Reward Ratio',
      description: 'Average loss exceeds average win.',
      actionable: 'Widen take-profit targets or tighten stop-loss levels.',
    })
  }

  // Analyze drawdown
  if (metrics.maxDrawdownPercent < 10) {
    strengths.push(`Low maximum drawdown of ${metrics.maxDrawdownPercent.toFixed(2)}%`)
  } else if (metrics.maxDrawdownPercent > 25) {
    weaknesses.push(`High maximum drawdown of ${metrics.maxDrawdownPercent.toFixed(2)}%`)
    warnings.push({
      severity: 'high',
      title: 'High Drawdown Risk',
      description: 'Maximum drawdown exceeds 25% of capital.',
      suggestion: 'Reduce position sizing or add risk management filters.',
    })
    recommendations.push({
      type: 'risk',
      priority: 'high',
      title: 'Reduce Drawdown',
      description: 'Maximum drawdown is too high for most risk tolerances.',
      actionable: 'Implement tighter stop-losses or add portfolio-level risk limits.',
    })
  }

  // Analyze Sharpe ratio
  if (metrics.sharpeRatio >= 1.5) {
    strengths.push(`Excellent Sharpe ratio of ${metrics.sharpeRatio.toFixed(2)}`)
  } else if (metrics.sharpeRatio >= 1) {
    strengths.push(`Good Sharpe ratio of ${metrics.sharpeRatio.toFixed(2)}`)
  } else if (metrics.sharpeRatio < 0.5) {
    weaknesses.push(`Low Sharpe ratio of ${metrics.sharpeRatio.toFixed(2)}`)
    recommendations.push({
      type: 'risk',
      priority: 'medium',
      title: 'Improve Risk-Adjusted Returns',
      description: 'Sharpe ratio indicates poor risk-adjusted performance.',
      actionable: 'Focus on reducing volatility while maintaining returns.',
    })
  }

  // Analyze trade frequency
  if (metrics.totalTrades < 20) {
    warnings.push({
      severity: 'medium',
      title: 'Insufficient Sample Size',
      description: `Only ${metrics.totalTrades} trades in the backtest.`,
      suggestion: 'Results may not be statistically significant. Run a longer backtest.',
    })
  }

  // Analyze consistency
  if (metrics.maxConsecutiveLosses > 5) {
    weaknesses.push(`High consecutive losses (${metrics.maxConsecutiveLosses} in a row)`)
    recommendations.push({
      type: 'consistency',
      priority: 'medium',
      title: 'Manage Losing Streaks',
      description: 'Strategy experiences significant losing streaks.',
      actionable: 'Consider implementing a "max loss" rule to pause trading after consecutive losses.',
    })
  }

  // Analyze expectancy
  if (metrics.expectancy > 0) {
    strengths.push(`Positive expectancy of $${metrics.expectancy.toFixed(2)} per trade`)
  } else {
    weaknesses.push(`Negative expectancy of $${metrics.expectancy.toFixed(2)} per trade`)
  }

  // Kelly criterion analysis
  if (metrics.kellyPercent > 25) {
    warnings.push({
      severity: 'medium',
      title: 'High Kelly Percentage',
      description: `Kelly criterion suggests ${metrics.kellyPercent.toFixed(1)}% position sizing.`,
      suggestion: 'Consider using half-Kelly (12.5%) for more conservative sizing.',
    })
  }

  // Calculate overall score and grade
  const score = calculateScore(metrics, strengths.length, weaknesses.length)
  const grade = getGrade(score)

  return {
    score,
    grade,
    strengths,
    weaknesses,
    recommendations,
    warnings,
  }
}

function calculateScore(metrics: Metrics, strengthCount: number, weaknessCount: number): number {
  let score = 50 // Base score

  // Profitability (0-20 points)
  if (metrics.totalReturn > 0) score += Math.min(20, metrics.totalReturnPercent / 5)
  else score -= Math.min(20, Math.abs(metrics.totalReturnPercent) / 5)

  // Win rate (0-15 points)
  score += (metrics.winRate - 50) * 0.3

  // Profit factor (0-15 points)
  if (metrics.profitFactor >= 2) score += 15
  else if (metrics.profitFactor >= 1.5) score += 10
  else if (metrics.profitFactor >= 1) score += 5
  else score -= 10

  // Risk metrics (0-20 points)
  if (metrics.maxDrawdownPercent < 10) score += 10
  else if (metrics.maxDrawdownPercent < 20) score += 5
  else if (metrics.maxDrawdownPercent > 30) score -= 10

  if (metrics.sharpeRatio > 1) score += 10
  else if (metrics.sharpeRatio > 0.5) score += 5

  // Risk/Reward (0-10 points)
  if (metrics.riskRewardRatio >= 2) score += 10
  else if (metrics.riskRewardRatio >= 1) score += 5
  else score -= 5

  // Adjust for strengths/weaknesses
  score += strengthCount * 2
  score -= weaknessCount * 2

  return Math.max(0, Math.min(100, score))
}

function getGrade(score: number): StrategyAnalysis['grade'] {
  if (score >= 95) return 'A+'
  if (score >= 90) return 'A'
  if (score >= 85) return 'B+'
  if (score >= 80) return 'B'
  if (score >= 75) return 'C+'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}
