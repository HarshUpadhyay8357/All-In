import express from "express";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { auth } from "../utils/auth";

const router = express.Router();

//register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ error: "missing fields" });

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser.length > 0)
      return res.status(400).json({ error: "user already exists" });

    const hashedPassword = await auth.hashPassword(password);

    const newUser = await db
      .insert(users)
      .values({
        username: username,
        email: email,
        password: hashedPassword,
        chips: 1000,
      })
      .returning({ id: users.id, username: users.username });

    const { accessToken, refreshToken } = auth.generateTokens(
      newUser[0].id,
      newUser[0].username,
    );

    res.status(201).json({
      user: { id: newUser[0].id, username: newUser[0].username, email },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "server error" });
  }
});

//login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "missing fields" });

    const user = await db.select().from(users).where(eq(users.email, email));

    if (user.length == 0)
      return res.status(401).json({ error: "Invalid credentials" });

    const valid = await auth.verifyPassword(password, user[0].password);

    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const { accessToken, refreshToken } = auth.generateTokens(
      user[0].id,
      user[0].username,
    );

    res.json({
      user: {
        id: user[0].id,
        email: user[0].email,
        username: user[0].username,
        chips: user[0].email,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

//refresh token
router.post("/refresh", (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "No refresh token" });
    }

    const decoded = auth.verifyRefreshToken(refreshToken);

    if (!decoded) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const { accessToken } = auth.generateTokens(
      decoded.userId,
      decoded.username,
    );

    res.json({ accessToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
