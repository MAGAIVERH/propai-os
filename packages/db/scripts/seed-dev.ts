import { closeDb } from "../src/client.js";
import { seedDevIdentity } from "../src/seed/dev-identity.js";

async function main(): Promise<void> {
  const result = await seedDevIdentity();

  console.log("\nDev identity seed complete:\n");
  console.log(`  organizationId: ${result.organizationId}`);
  console.log(`  userId:         ${result.userId}`);
  console.log(`  memberId:       ${result.memberId}`);
  console.log("");
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
