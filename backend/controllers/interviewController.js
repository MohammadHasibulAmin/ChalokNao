const Interview = require("../models/Interview");
const connectDB = require("../config/db");
const { ObjectId } = require("mongodb");

exports.requestInterview = async (req, res) => {
  try {
    const { ownerId, driverId, type, date, location, locationLat, locationLng } = req.body;

    if (!ownerId || !driverId || !type || !date) {
      return res.status(400).json({ message: "ownerId, driverId, type and date are required" });
    }

    // If interview is offline, require a location/address. For other types, location should be omitted.
    if (String(type).toLowerCase() === "offline" && !location) {
      return res.status(400).json({ message: "Location/address is required for offline interviews" });
    }

    const shouldStoreLocation = String(type).toLowerCase() === "offline";
    const coords =
      Number.isFinite(Number(locationLat)) && Number.isFinite(Number(locationLng))
        ? { lat: Number(locationLat), lng: Number(locationLng) }
        : null;

    const interview = await Interview.createInterview({
      ownerId,
      driverId,
      type,
      date: new Date(date),
      location: shouldStoreLocation ? (location || null) : null,
      locationCoordinates: shouldStoreLocation ? coords : null,
      status: "pending",
    });

    return res.status(201).json(interview);
  } catch (err) {
    console.error("REQUEST INTERVIEW ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.respondInterview = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["accepted", "rejected"].includes(String(status || "").toLowerCase())) {
      return res.status(400).json({ message: "status must be accepted or rejected" });
    }

    const interview = await Interview.updateInterviewStatus(req.params.id, String(status).toLowerCase());
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    try {
      const db = await connectDB();
      const ownerIdStr = String(interview.ownerId || "");
      if (ownerIdStr) {
        const statusLower = String(status).toLowerCase();
        const notif = {
          _id: new ObjectId(),
          type: "interview",
          status: statusLower,
          message: statusLower === "accepted" 
            ? "Your interview request has been accepted by the driver."
            : "Your interview request has been rejected by the driver.",
          data: { interviewId: String(interview._id), driverId: String(interview.driverId) },
          read: false,
          createdAt: new Date(),
        };

        await db.collection("user").updateOne(
          { _id: new ObjectId(ownerIdStr) },
          { $push: { notifications: notif }, $set: { updatedAt: new Date() } }
        );

        try {
          const socketManager = require("../socket/socketManager");
          const io = socketManager.getIo();
          io.to(`user:${ownerIdStr}`).emit("interview:updated", notif);
        } catch (err) {
          console.warn("Interview socket emit failed:", err.message);
        }
      }
    } catch (err) {
      console.warn("Interview notification creation failed:", err.message);
    }

    return res.json(interview);
  } catch (err) {
    console.error("RESPOND INTERVIEW ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getDriverInterviews = async (req, res) => {
  try {
    const interviews = await Interview.listByDriver(req.params.driverId);

    // populate owner/driver names
    const ids = new Set();
    interviews.forEach((iv) => {
      if (iv.ownerId) ids.add(String(iv.ownerId));
      if (iv.driverId) ids.add(String(iv.driverId));
    });

    const idList = Array.from(ids);
    const db = await connectDB();
    const objectIds = [];
    const stringIds = [];
    idList.forEach((id) => {
      if (String(id).length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
        try {
          objectIds.push(new ObjectId(id));
        } catch (_) {
          stringIds.push(id);
        }
      } else {
        stringIds.push(id);
      }
    });

    const query = { $or: [] };
    if (objectIds.length) query.$or.push({ _id: { $in: objectIds } });
    if (stringIds.length) query.$or.push({ _id: { $in: stringIds } });

    let users = [];
    if (query.$or.length) {
      users = await db.collection("user").find(query).toArray();
    }

    const userMap = new Map(users.map((u) => [String(u._id), u]));

    // If some interviews reference driver document ids (drivers._id) instead of user ids,
    // try to resolve those to the underlying user ids via the drivers collection.
    const missingDriverIds = Array.from(
      new Set(
        interviews
          .map((iv) => iv.driverId)
          .filter((id) => id && !userMap.has(String(id)))
      )
    );

    const driverIdToUserId = new Map();
    if (missingDriverIds.length) {
      const driverObjectIds = [];
      const driverStringIds = [];
      missingDriverIds.forEach((id) => {
        if (String(id).length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
          try {
            driverObjectIds.push(new ObjectId(id));
          } catch (_) {
            driverStringIds.push(id);
          }
        } else {
          driverStringIds.push(id);
        }
      });

      const driverQuery = { $or: [] };
      if (driverObjectIds.length) driverQuery.$or.push({ _id: { $in: driverObjectIds } });
      if (driverStringIds.length) driverQuery.$or.push({ _id: { $in: driverStringIds } });

      if (driverQuery.$or.length) {
        const drivers = await db.collection("drivers").find(driverQuery).toArray();
        const userIdsFromDrivers = Array.from(new Set(drivers.map((d) => String(d.userId)).filter(Boolean)));
        if (userIdsFromDrivers.length) {
          // fetch those users and add to userMap
          const objIds = [];
          const strIds = [];
          userIdsFromDrivers.forEach((uid) => {
            if (String(uid).length === 24 && /^[0-9a-fA-F]{24}$/.test(uid)) {
              try {
                objIds.push(new ObjectId(uid));
              } catch (_) {
                strIds.push(uid);
              }
            } else {
              strIds.push(uid);
            }
          });

          const uQuery = { $or: [] };
          if (objIds.length) uQuery.$or.push({ _id: { $in: objIds } });
          if (strIds.length) uQuery.$or.push({ _id: { $in: strIds } });

          if (uQuery.$or.length) {
            const extraUsers = await db.collection("user").find(uQuery).toArray();
            extraUsers.forEach((u) => userMap.set(String(u._id), u));
          }
        }

        // build map driver._id -> driver.userId for mapping later
        drivers.forEach((d) => {
          if (d && d._id && d.userId) {
            driverIdToUserId.set(String(d._id), String(d.userId));
          }
        });
      }
    }

    const populated = interviews.map((iv) => {
      const ownerName = userMap.get(String(iv.ownerId))?.name || null;
      // driverName may be directly available if interview.driverId is a user id,
      // otherwise try to map via driverId -> driver.userId -> userMap
      const directDriver = userMap.get(String(iv.driverId));
      const driverName = directDriver?.name || null;
      const driverUserId = driverName ? String(iv.driverId) : driverIdToUserId.get(String(iv.driverId)) || null;

      return {
        ...iv,
        ownerName,
        driverName: driverName || (driverUserId ? userMap.get(String(driverUserId))?.name || null : null),
        ownerUserId: iv.ownerId ? String(iv.ownerId) : null,
        driverUserId: driverUserId,
      };
    });

    return res.json(populated);
  } catch (err) {
    console.error("GET DRIVER INTERVIEWS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getOwnerInterviews = async (req, res) => {
  try {
    const interviews = await Interview.listByOwner(req.params.ownerId);

    // populate owner/driver names similar to driver list
    const ids = new Set();
    interviews.forEach((iv) => {
      if (iv.ownerId) ids.add(String(iv.ownerId));
      if (iv.driverId) ids.add(String(iv.driverId));
    });

    const idList = Array.from(ids);
    const db = await connectDB();
    const objectIds = [];
    const stringIds = [];
    idList.forEach((id) => {
      if (String(id).length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
        try {
          objectIds.push(new ObjectId(id));
        } catch (_) {
          stringIds.push(id);
        }
      } else {
        stringIds.push(id);
      }
    });

    const query = { $or: [] };
    if (objectIds.length) query.$or.push({ _id: { $in: objectIds } });
    if (stringIds.length) query.$or.push({ _id: { $in: stringIds } });

    let users = [];
    if (query.$or.length) {
      users = await db.collection("user").find(query).toArray();
    }

    const userMap = new Map(users.map((u) => [String(u._id), u]));

    const missingDriverIds = Array.from(
      new Set(
        interviews
          .map((iv) => iv.driverId)
          .filter((id) => id && !userMap.has(String(id)))
      )
    );

    const driverIdToUserId = new Map();
    if (missingDriverIds.length) {
      const driverObjectIds = [];
      const driverStringIds = [];
      missingDriverIds.forEach((id) => {
        if (String(id).length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
          try {
            driverObjectIds.push(new ObjectId(id));
          } catch (_) {
            driverStringIds.push(id);
          }
        } else {
          driverStringIds.push(id);
        }
      });

      const driverQuery = { $or: [] };
      if (driverObjectIds.length) driverQuery.$or.push({ _id: { $in: driverObjectIds } });
      if (driverStringIds.length) driverQuery.$or.push({ _id: { $in: driverStringIds } });

      if (driverQuery.$or.length) {
        const drivers = await db.collection("drivers").find(driverQuery).toArray();
        const userIdsFromDrivers = Array.from(new Set(drivers.map((d) => String(d.userId)).filter(Boolean)));
        if (userIdsFromDrivers.length) {
          const objIds = [];
          const strIds = [];
          userIdsFromDrivers.forEach((uid) => {
            if (String(uid).length === 24 && /^[0-9a-fA-F]{24}$/.test(uid)) {
              try {
                objIds.push(new ObjectId(uid));
              } catch (_) {
                strIds.push(uid);
              }
            } else {
              strIds.push(uid);
            }
          });

          const uQuery = { $or: [] };
          if (objIds.length) uQuery.$or.push({ _id: { $in: objIds } });
          if (strIds.length) uQuery.$or.push({ _id: { $in: strIds } });

          if (uQuery.$or.length) {
            const extraUsers = await db.collection("user").find(uQuery).toArray();
            extraUsers.forEach((u) => userMap.set(String(u._id), u));
          }
        }

        drivers.forEach((d) => {
          if (d && d._id && d.userId) {
            driverIdToUserId.set(String(d._id), String(d.userId));
          }
        });
      }
    }

    const populated = interviews.map((iv) => {
      const ownerName = userMap.get(String(iv.ownerId))?.name || null;
      const directDriver = userMap.get(String(iv.driverId));
      const driverName = directDriver?.name || null;
      const driverUserId = driverName ? String(iv.driverId) : driverIdToUserId.get(String(iv.driverId)) || null;

      return {
        ...iv,
        ownerName,
        driverName: driverName || (driverUserId ? userMap.get(String(driverUserId))?.name || null : null),
        ownerUserId: iv.ownerId ? String(iv.ownerId) : null,
        driverUserId: driverUserId,
      };
    });

    return res.json(populated);
  } catch (err) {
    console.error("GET OWNER INTERVIEWS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.updateOwnerInterview = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["completed", "cancelled"].includes(String(status || "").toLowerCase())) {
      return res.status(400).json({ message: "status must be completed or cancelled" });
    }

    const interview = await Interview.updateInterviewStatus(req.params.id, String(status).toLowerCase());
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    return res.json(interview);
  } catch (err) {
    console.error("UPDATE OWNER INTERVIEW ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};