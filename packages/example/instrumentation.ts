export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureMswServer } = await import("./src/mocks/node");
    await ensureMswServer();
  }
}
