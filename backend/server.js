require("dotenv").config();
const path = require("path");
const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const setupSupportChatSocket = require("./socket/supportChatSocket");

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

app.use(express.json());
app.use(cors({ origin: "http://localhost:3000" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/drivers", require("./routes/driverRoutes"));
app.use("/api/interviews", require("./routes/interviewRoutes"));
app.use("/api/hire", require("./routes/hireRoutes"));
app.use("/api/offer", require("./routes/offerRoutes"));
app.use("/api/owner/shortlist", require("./routes/shortlistRoutes"));
app.use("/api/training", require("./routes/trainingRoutes"));
app.use("/api/request", require("./routes/requestRoutes"));
app.use("/api/contracts", require("./routes/contractRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/admin", require("./routes/admin/verificationRoutes"));

app.get("/", (req, res) => {
  res.send("ChalokNao backend running");
});

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

setupSupportChatSocket(io);

connectDB()
  .then(() => {
    console.log("DB ready");
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error("DB connection failed:", err);
    process.exit(1);
  });