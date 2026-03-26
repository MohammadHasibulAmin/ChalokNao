require("dotenv").config();
const express = require("express");
const cors = require("cors");

const PORT = process.env.PORT || 5000;
const app = express();

const connectDB = require("./config/db");

// middleware
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000" }));

// connect DB
connectDB()
  .then(() => console.log("DB ready"))
  .catch(err => {
    console.error("DB connection failed:", err);
    process.exit(1);
  });

// routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/drivers", require("./routes/driverRoutes"));
// test route
app.get("/", (req, res) => {
  res.send("Running cheap chip server!");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// --- Routes ---

// Register
// app.post("/api/auth/register", async (req, res) => {
//     const { name, email, password, role } = req.body;

//     try {
//         const existingUser = await User.findOne({ email });
//         if (existingUser) return res.status(400).json({ message: "User already exists" });

//         const newUser = new User({ name, email, password, role });
//         await newUser.save();

//         res.status(201).json({ message: "User registered successfully" });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: "Server error" });
//     }
// });

// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");

// // --- Login route ---
// app.post("/api/auth/login", async (req, res) => {
//     const { email, password } = req.body;

//     try {
//         // Find user
//         const user = await User.findOne({ email });
//         if (!user) return res.status(400).json({ message: "User not found" });

//         // Check password
//         // NOTE: If you haven't hashed passwords yet, compare plain text
//         const isMatch = password === user.password; // For now, simple comparison
//         // Later: use bcrypt.compare(password, user.password)

//         if (!isMatch) return res.status(400).json({ message: "Invalid password" });

//         // Create JWT token
//         const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

//         res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: "Server error" });
//     }
// });

// const driverRoutes = require("./routes/driverRoutes");

// // after app.use(express.json());
// app.use("/api/drivers", driverRoutes);

// // --- Connect MongoDB ---
// mongoose.connect(process.env.MONGO_URI)
//     .then(() => console.log("MongoDB connected"))
//     .catch(err => console.error("MongoDB connection error:", err));

// // --- Start server ---
// app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));