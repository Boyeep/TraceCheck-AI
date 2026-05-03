const run = async () => {
  await import("./integration-status.test");
  await import("./api-routes.test");
  await import("./auth-routes.test");
  await import("./security-controls.test");
};

await run();

export {};
