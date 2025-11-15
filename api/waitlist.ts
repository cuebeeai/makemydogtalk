import { storage } from "../server/storage";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: "Email is required" });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    await storage.addWaitlistEmail(email);

    res.json({ success: true, message: "Thank you for joining our waitlist!" });
  } catch (error: any) {
    // Handle duplicate email
    if (error.message?.includes('duplicate') || error.code === '23505') {
      return res.status(200).json({ success: true, message: "You're already on our waitlist!" });
    }

    console.error("Error in /api/waitlist:", error);
    res.status(500).json({ error: "Failed to join waitlist. Please try again." });
  }
}
