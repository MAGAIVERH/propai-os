import { buildApp } from "./app.js";

const DEFAULT_PORT = 3333;

async function main(): Promise<void> {
  const app = await buildApp({ logger: true });

  const port = Number(process.env.PORT ?? DEFAULT_PORT);
  const host = process.env.HOST ?? "0.0.0.0";

  await app.listen({ port, host });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
