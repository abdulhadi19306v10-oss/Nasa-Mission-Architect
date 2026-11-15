import {
  SpacecraftDesign,
  ResourceBudget,
  MissionReport,
  RealMission,
  Scenario,
  Instrument,
  Orbit
} from '../types';

export function evaluateMissionDesign(
  design: SpacecraftDesign,
  budget: ResourceBudget,
  scenario: Scenario,
  instruments: Instrument[],
  orbit: Orbit,
  realMissions: RealMission[]
): MissionReport {
  const selectedInstruments = instruments.filter((i) => design.instrumentIds.includes(i.id));

  // 1. Science Score (0 - 100)
  let rawScience = 0;
  for (const inst of selectedInstruments) {
    let value = inst.scienceValue;
    // Check if instrument aligns with scenario targets
    const matchesTarget = inst.targetDomains.some((d) =>
      scenario.requiredCapabilities.targetScienceDomains.includes(d)
    );
    if (matchesTarget) {
      value *= 1.25;
    }
    if (scenario.scoringBonusInstruments.includes(inst.id)) {
      value *= 1.35;
    }
    rawScience += value;
  }

  // Base normalization (target ~150 raw points for full score)
  let scienceScore = Math.min(100, Math.round((rawScience / 150) * 100));

  // Severe penalties if pointing or data is broken
  if (!budget.isPointingFeasible) {
    scienceScore = Math.round(scienceScore * 0.3); // instruments cannot focus or track target
  }
  if (!budget.isDataFeasible) {
    scienceScore = Math.round(scienceScore * 0.7); // data lost due to buffer overflow
  }

  // 2. Efficiency Score (0 - 100)
  let efficiencyScore = 70;
  // Mass margin bonus/penalty
  if (budget.massMarginPercent >= 20 && budget.massMarginPercent <= 50) {
    efficiencyScore += 15; // sweet spot
  } else if (budget.massMarginPercent < 20 && budget.massMarginPercent >= 0) {
    efficiencyScore += 5;
  } else if (budget.massMarginPercent < 0) {
    efficiencyScore -= 40;
  }

  // Power efficiency
  if (budget.daylightPowerBalanceW >= 20 && budget.daylightPowerBalanceW <= 100) {
    efficiencyScore += 15;
  } else if (budget.daylightPowerBalanceW < 0) {
    efficiencyScore -= 40;
  }

  efficiencyScore = Math.max(0, Math.min(100, efficiencyScore));

  // 3. Reliability Score (0 - 100)
  let reliabilityScore = 80;
  if (budget.batteryDoDPercent > 70) {
    reliabilityScore -= 25;
  }
  if (!budget.environmentCompatible) {
    reliabilityScore -= 50;
  }
  if ((orbit.radiationLevel === 'high' || orbit.radiationLevel === 'cosmic-rays') && design.obcId === 'obc-standard-radtol') {
    reliabilityScore -= 20;
  } else if (design.obcId === 'obc-radhard-fpga' && (orbit.radiationLevel === 'high' || orbit.radiationLevel === 'cosmic-rays')) {
    reliabilityScore += 10;
  }
  const harshThermal =
    orbit.eclipseMinutes >= 40 ||
    orbit.centralBody === 'lagrange' ||
    orbit.centralBody === 'europa' ||
    orbit.centralBody === 'titan' ||
    orbit.centralBody === 'venus';
  if (design.thermalId === 'thm-active-heaters-louvers' && harshThermal) {
    reliabilityScore += 8;
  }
  reliabilityScore = Math.max(0, Math.min(100, reliabilityScore));

  // 4. Budget Score (0 - 100)
  let budgetScore = 100;
  if (budget.isBudgetUnlimited || !Number.isFinite(budget.budgetLimitM) || budget.budgetLimitM <= 0) {
    budgetScore = 100;
  } else if (budget.totalCostM > budget.budgetLimitM) {
    const overrunRatio = (budget.totalCostM - budget.budgetLimitM) / budget.budgetLimitM;
    budgetScore = Math.max(0, Math.round(100 - overrunRatio * 200));
  } else {
    // Reward finishing under budget without extreme underspending
    const underRatio = (budget.budgetLimitM - budget.totalCostM) / budget.budgetLimitM;
    budgetScore = Math.round(85 + underRatio * 15);
  }

  // 5. Overall status and letter grade
  const hasCriticalFailures = budget.criticalIssues.length > 0;
  let overallScore = 0;

  if (hasCriticalFailures) {
    overallScore = Math.min(45, Math.round((scienceScore * 0.4 + efficiencyScore * 0.3 + reliabilityScore * 0.3) * 0.5));
  } else {
    overallScore = Math.round(
      scienceScore * 0.40 +
      efficiencyScore * 0.25 +
      reliabilityScore * 0.20 +
      budgetScore * 0.15
    );
  }

  overallScore = Math.max(0, Math.min(100, overallScore));

  let status: 'SUCCESS' | 'PARTIAL_SUCCESS' | 'MISSION_FAILURE' = 'SUCCESS';
  if (hasCriticalFailures || overallScore < 50) {
    status = 'MISSION_FAILURE';
  } else if (overallScore < 75 || budget.warnings.length > 0) {
    status = 'PARTIAL_SUCCESS';
  }

  let letterGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
  if (overallScore >= 95) letterGrade = 'A+';
  else if (overallScore >= 88) letterGrade = 'A';
  else if (overallScore >= 75) letterGrade = 'B';
  else if (overallScore >= 60) letterGrade = 'C';
  else if (overallScore >= 50) letterGrade = 'D';
  else letterGrade = 'F';

  // NASA Concept Maturity Level (CML 1 to 6)
  let conceptMaturityLevel = 1;
  if (status === 'SUCCESS' && overallScore >= 90) conceptMaturityLevel = 6; // Ready for Flight Operations / CDR
  else if (status === 'SUCCESS' && overallScore >= 80) conceptMaturityLevel = 5; // Preliminary Design Review (PDR)
  else if (status !== 'MISSION_FAILURE' && overallScore >= 70) conceptMaturityLevel = 4; // Subsystem Definition
  else if (status !== 'MISSION_FAILURE' && overallScore >= 55) conceptMaturityLevel = 3; // Trade Space Exploration
  else if (overallScore >= 40) conceptMaturityLevel = 2; // Initial Concept
  else conceptMaturityLevel = 1; // Pure Concept

  // Find most similar real NASA mission
  let matchedRealMission: RealMission | undefined;
  let highestMatchScore = -1;
  for (const rm of realMissions) {
    let match = 0;
    if (rm.similarityProfile.preferredOrbit === orbit.id) match += 3;
    for (const instId of rm.similarityProfile.instruments) {
      if (design.instrumentIds.includes(instId)) match += 2;
    }
    if (match > highestMatchScore) {
      highestMatchScore = match;
      matchedRealMission = rm;
    }
  }

  const detailedAnalysis: string[] = [];
  if (status === 'MISSION_FAILURE') {
    detailedAnalysis.push(
      `Mission failed due to fatal architectural violations: ${budget.criticalIssues.join('; ')}`
    );
  } else {
    detailedAnalysis.push(
      `Science Return (${scienceScore}%): ${selectedInstruments.length} payload sensor(s) generated signal calibrated for ${orbit.name}.`
    );
    if (budget.massMarginPercent >= 20) {
      detailedAnalysis.push(
        `Mass & Lift Efficiency: Healthy ${budget.massMarginPercent.toFixed(1)}% reserve meets AIAA/NASA 20% structural margin.`
      );
    } else {
      detailedAnalysis.push(
        `Tight Lift Margin (${budget.massMarginPercent.toFixed(1)}%): Launch mass is near rocket limit (<20% AIAA reserve); lighter bus or bigger booster improves resilience.`
      );
    }
    if (budget.daylightPowerBalanceW >= 20 && budget.daylightPowerBalanceW <= 100) {
      detailedAnalysis.push(
        `Optimal Power Sizing (+${budget.daylightPowerBalanceW.toFixed(0)} W): Solar/RTG output sits inside NASA's sweet spot (+20W to +100W) without wasteful excess mass.`
      );
    } else if (budget.daylightPowerBalanceW > 100) {
      detailedAnalysis.push(
        `Over-Powered Bus (+${budget.daylightPowerBalanceW.toFixed(0)} W): High surplus provides safety, though smaller panels could save cost and mass.`
      );
    }
    if (budget.batteryDoDPercent > 70) {
      detailedAnalysis.push(
        `Battery Stress (${budget.batteryDoDPercent.toFixed(0)}% DoD): Deep eclipse discharge degrades long-term cell cycle life; upgrade battery Wh or lower payload draw.`
      );
    }
    if (design.thermalId === 'thm-active-heaters-louvers' && harshThermal) {
      detailedAnalysis.push(
        `Thermal Control (+8% Reliability): Active louvers & strip heaters protect sensitive optics across deep shadow / deep-space swings.`
      );
    }
    if (budget.warnings.length > 0) {
      detailedAnalysis.push(`Advisory Items to Monitor: ${budget.warnings.join('; ')}`);
    }
  }

  const summaryText =
    status === 'SUCCESS'
      ? `Mission is fully operational! The spacecraft meets all requirements for ${scenario.title} with high science yield and robust engineering margins.`
      : status === 'PARTIAL_SUCCESS'
      ? `Mission deployed with partial success. Scientific observations are active, but resource bottlenecks require operational duty-cycling.`
      : `Mission suffered catastrophic system failure. Review the critical issues and redesign your spacecraft bus or trajectory.`;

  return {
    overallScore,
    letterGrade,
    conceptMaturityLevel,
    status,
    scienceScore,
    efficiencyScore,
    reliabilityScore,
    budgetScore,
    summaryText,
    detailedAnalysis,
    matchedRealMission,
    eventsEncountered: []
  };
}
