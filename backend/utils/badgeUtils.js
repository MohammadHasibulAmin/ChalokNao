function calculateBadges(driver) {
  const badges = [];
  const ratingAvg = Number(driver.ratingAvg || 0);
  const completedContracts = Number(driver.completedContracts || driver.totalContracts || 0);
  const experienceYears = Number(driver.experienceYears || 0);

  if (ratingAvg >= 4.9 && completedContracts >= 20 && experienceYears >= 8) {
    badges.push("Elite Veteran");
    return badges;
  }

  if (ratingAvg >= 4.7 && completedContracts >= 10 && experienceYears >= 5) {
    badges.push("Trusted Pro");
    return badges;
  }

  if (ratingAvg >= 4.4 && completedContracts >= 5 && experienceYears >= 3) {
    badges.push("Steady Professional");
    return badges;
  }

  if (ratingAvg >= 4.0 && experienceYears >= 2) {
    badges.push("Reliable Driver");
    return badges;
  }

  badges.push("Rising Driver");

  return badges;
}

module.exports = {
  calculateBadges,
};
