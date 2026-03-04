import { auth } from "./src/lib/auth";
import "dotenv/config";

async function main() {
  process.env.BETTER_AUTH_SECRET =
    "a_very_secret_string_1234567890_antigravity";
  console.log("Testing getSession directly...");
  try {
    const session = await auth.api.getSession({
      headers: new Headers(), // Empty headers should return null, not throw
    });
    console.log("Session Result:", session);
  } catch (err: any) {
    console.error("getSession threw an error:");
    console.error(err);
    if (err.body) console.error("Error body:", err.body);
  }
}
main();
