const connectDB = require("../config/db");

// REGISTER
exports.register = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const db = await connectDB();

        const existingUser = await db.collection("user").findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        const result = await db.collection("user").insertOne({ name, email, password, role });

        res.json({
            message: "Registered successfully",
            userId: result.insertedId
        });
    } catch (err) {
        console.error("FULL ERROR:", err);
        res.status(500).json({ message: err.message });
    }
};

// LOGIN
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const db = await connectDB();

        const user = await db.collection("user").findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found" });

        if (user.password !== password)
            return res.status(400).json({ message: "Invalid password" });

        const token = "dummy-token"; // placeholder for JWT later

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error("FULL ERROR:", err);
        res.status(500).json({ message: err.message });
    }
};