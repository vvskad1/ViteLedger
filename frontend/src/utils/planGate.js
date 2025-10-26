export function hasAccess(userSub, minPlan = "basic") {
  if (!userSub || (userSub.status !== "active" && userSub.status !== "trial")) return false;
  
  // Check if trial has expired
  if (userSub.is_trial && userSub.trial_ends_at) {
    const trialEnd = new Date(userSub.trial_ends_at);
    if (new Date() > trialEnd) return false;
  }
  
  const rank = { basic: 1, plus: 2, pro: 3 };
  return rank[userSub.plan] >= rank[minPlan];
}

export function getPlanColor(plan) {
  const colors = {
    basic: "#10b981",
    plus: "#8b5cf6",
    pro: "#f59e0b"
  };
  return colors[plan] || "#64748b";
}

export function formatPeriod(period) {
  return period.charAt(0).toUpperCase() + period.slice(1);
}
