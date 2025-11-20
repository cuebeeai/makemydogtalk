import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL!);

console.log("📧 Waitlist Emails:\n");

const emails = await sql`
  SELECT email, created_at
  FROM waitlist_emails
  ORDER BY created_at DESC
`;

if (emails.length === 0) {
  console.log("No emails in waitlist yet.");
} else {
  console.log(`Total: ${emails.length} email(s)\n`);
  emails.forEach((row, i) => {
    const date = new Date(row.created_at).toLocaleString();
    console.log(`${i + 1}. ${row.email} - ${date}`);
  });
}
