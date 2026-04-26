const Training = require("../models/Training");
const Progress = require("../models/Progress");
const connectDB = require("../config/db");

const DEFAULT_MODULES = [
  {
    _id: "defensive-driving",
    title: "Defensive Driving Tips",
    content: "Hazard anticipation, safe distance control, and emergency response basics.",
    estimatedMinutes: 20,
    category: "Safety",
  },
  {
    _id: "highway-driving",
    title: "Highway Driving Rules",
    content: "Lane discipline, overtaking rules, speed awareness, and highway etiquette.",
    estimatedMinutes: 18,
    category: "Regulations",
  },
  {
    _id: "customer-service",
    title: "Customer Service Best Practices",
    content: "Professional communication, punctuality, conflict handling, and rider comfort.",
    estimatedMinutes: 15,
    category: "Service",
  },
  {
    _id: "maintenance-basics",
    title: "Vehicle Maintenance Basics",
    content: "Daily checks, warning signs, and preventive maintenance essentials.",
    estimatedMinutes: 22,
    category: "Maintenance",
  },
];

function buildTrainingBadges({ completedCount, completionRate, avgScore }) {
  const badges = [];

  if (completedCount >= 1) badges.push("Learner Starter");
  if (completedCount >= 2) badges.push("Safety Improver");
  if (completedCount >= 3) badges.push("Road Skill Specialist");
  if (completionRate === 100 && avgScore >= 85) badges.push("Certified Skill Master");

  return badges;
}

function buildSummary(modules, progressByTrainingId) {
  const mergedModules = modules.map((module) => {
    const current = progressByTrainingId.get(String(module._id)) || null;
    const completed = Boolean(current?.completed);
    const score = Number(current?.score || 0);

    return {
      ...module,
      progress: {
        completed,
        score,
        certificateIssued: Boolean(current?.certificateIssued),
        updatedAt: current?.updatedAt || null,
      },
    };
  });

  const totalModules = mergedModules.length;
  const completedModules = mergedModules.filter((item) => item.progress.completed).length;
  const completionRate = totalModules ? Math.round((completedModules / totalModules) * 100) : 0;
  const scoreTotal = mergedModules.reduce((sum, item) => sum + Number(item.progress.score || 0), 0);
  const avgScore = totalModules ? Number((scoreTotal / totalModules).toFixed(1)) : 0;
  const certificates = mergedModules.filter((item) => item.progress.certificateIssued).length;
  const badges = buildTrainingBadges({ completedCount: completedModules, completionRate, avgScore });

  return {
    modules: mergedModules,
    summary: {
      totalModules,
      completedModules,
      completionRate,
      avgScore,
      certificates,
      badges,
      isTrained: completionRate >= 50,
    },
  };
}

exports.getTrainingList = async (req, res) => {
  try {
    const trainings = await Training.listTrainings();
    if (!Array.isArray(trainings) || !trainings.length) {
      return res.json(DEFAULT_MODULES);
    }

    return res.json(trainings);
  } catch (err) {
    console.error("GET TRAINING LIST ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getDriverProgress = async (req, res) => {
  try {
    const driverId = req.params.driverId || req.query.driverId;
    if (!driverId) {
      return res.status(400).json({ message: "driverId is required" });
    }

    const trainings = await Training.listTrainings();
    const modules = Array.isArray(trainings) && trainings.length ? trainings : DEFAULT_MODULES;
    const progressList = await Progress.listProgressByDriver(driverId);
    const progressMap = new Map(progressList.map((item) => [String(item.trainingId), item]));
    const payload = buildSummary(modules, progressMap);

    return res.json(payload);
  } catch (err) {
    console.error("GET DRIVER PROGRESS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.createProgress = async (req, res) => {
  try {
    const { driverId, trainingId, completed, score } = req.body;
    if (!driverId || !trainingId) {
      return res.status(400).json({ message: "driverId and trainingId are required" });
    }

    const trainings = await Training.listTrainings();
    const modules = Array.isArray(trainings) && trainings.length ? trainings : DEFAULT_MODULES;
    const matchedModule = modules.find((item) => String(item._id) === String(trainingId));
    const numericScore = Number(score || 0);
    const isCompleted = Boolean(completed);
    const certificateIssued = isCompleted && numericScore >= 70;

    const progress = await Progress.upsertProgress({
      driverId,
      trainingId,
      completed: isCompleted,
      score: numericScore,
      moduleTitle: matchedModule?.title || "",
      certificateIssued,
    });

    const db = await connectDB();
    const progressList = await Progress.listProgressByDriver(driverId);
    const progressMap = new Map(progressList.map((item) => [String(item.trainingId), item]));
    const { summary } = buildSummary(modules, progressMap);

    await db.collection("drivers").updateOne(
      { userId: String(driverId) },
      {
        $set: {
          trainingSummary: {
            completionRate: summary.completionRate,
            avgScore: summary.avgScore,
            completedModules: summary.completedModules,
            totalModules: summary.totalModules,
            certificateCount: summary.certificates,
            updatedAt: new Date(),
            isTrained: summary.isTrained,
          },
          trainingBadges: summary.badges,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return res.status(201).json(progress);
  } catch (err) {
    console.error("CREATE PROGRESS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};
