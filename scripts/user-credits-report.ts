import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL!);

console.log("💳 User Credits Report\n");
console.log("=" .repeat(100));

// Get all users with their video operation counts
const users = await sql`
  SELECT
    u.id,
    u.email,
    u.name,
    u.credits,
    u.stripe_customer_id,
    u.created_at,
    u.last_login,
    COUNT(v.id) as videos_created
  FROM users u
  LEFT JOIN video_operations v ON u.id = v.user_id
  GROUP BY u.id, u.email, u.name, u.credits, u.stripe_customer_id, u.created_at, u.last_login
  ORDER BY u.created_at DESC
`;

if (users.length === 0) {
  console.log("No users found.");
} else {
  console.log(`Total Users: ${users.length}\n`);

  let totalCreditsRemaining = 0;
  let totalVideosCreated = 0;

  // Table header
  console.log(
    "Email".padEnd(30) +
    "Name".padEnd(20) +
    "Credits".padEnd(10) +
    "Videos".padEnd(10) +
    "Stripe ID".padEnd(20) +
    "Created"
  );
  console.log("-".repeat(100));

  users.forEach((user) => {
    const email = (user.email as string).padEnd(30).substring(0, 30);
    const name = ((user.name as string) || "N/A").padEnd(20).substring(0, 20);
    const credits = String(user.credits).padEnd(10);
    const videos = String(user.videos_created).padEnd(10);
    const stripeId = (user.stripe_customer_id ? "✓" : "—").padEnd(20);
    const created = new Date(user.created_at).toLocaleDateString();

    console.log(`${email}${name}${credits}${videos}${stripeId}${created}`);

    totalCreditsRemaining += Number(user.credits);
    totalVideosCreated += Number(user.videos_created);
  });

  console.log("-".repeat(100));
  console.log(`\nSummary:`);
  console.log(`  Total Credits Remaining: ${totalCreditsRemaining}`);
  console.log(`  Total Videos Created: ${totalVideosCreated}`);
  console.log(`  Average Credits per User: ${(totalCreditsRemaining / users.length).toFixed(2)}`);
  console.log(`  Users with Stripe: ${users.filter(u => u.stripe_customer_id).length}`);
  console.log(`  Active Users (videos > 0): ${users.filter(u => Number(u.videos_created) > 0).length}`);
}

// Detailed breakdown of video operations
console.log("\n\n📹 Video Operations Breakdown\n");
console.log("=" .repeat(100));

const videoStats = await sql`
  SELECT
    u.email,
    v.status,
    COUNT(*) as count
  FROM video_operations v
  LEFT JOIN users u ON v.user_id = u.id
  GROUP BY u.email, v.status
  ORDER BY u.email, v.status
`;

if (videoStats.length > 0) {
  let currentEmail = "";
  videoStats.forEach((stat) => {
    if (stat.email !== currentEmail) {
      if (currentEmail !== "") console.log("");
      currentEmail = stat.email || "Unknown User";
      console.log(`${currentEmail}:`);
    }
    console.log(`  ${stat.status}: ${stat.count}`);
  });
}
