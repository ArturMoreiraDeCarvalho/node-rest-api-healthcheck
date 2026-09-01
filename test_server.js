import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { createServer } from "node:http";
import { createApp } from "./server.js";

const servers = [];

async function startApp() {
  const server = createServer(createApp()).listen(0);
  servers.push(server);
  await new Promise((resolve) => server.once("listening", resolve));
  return `http://127.0.0.1:${server.address().port}`;
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))));
});

test("health endpoint returns service status", async () => {
  const base = await startApp();
  const response = await fetch(`${base}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok", service: "task-health-api" });
});

test("tasks can be created, listed and updated", async () => {
  const base = await startApp();
  const createdResponse = await fetch(`${base}/tasks`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "Document API", description: "Write examples" }),
  });
  assert.equal(createdResponse.status, 201);
  const created = await createdResponse.json();
  assert.equal(created.title, "Document API");

  const patchResponse = await fetch(`${base}/tasks/${created.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ completed: true }),
  });
  assert.equal(patchResponse.status, 200);
  assert.equal((await patchResponse.json()).completed, true);
});

test("invalid payloads return validation errors", async () => {
  const base = await startApp();
  const response = await fetch(`${base}/tasks`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ description: "Missing title" }),
  });
  assert.equal(response.status, 422);
  assert.deepEqual(await response.json(), { error: "title is required" });
});

test("unknown routes and tasks return 404", async () => {
  const base = await startApp();
  assert.equal((await fetch(`${base}/unknown`)).status, 404);
  assert.equal((await fetch(`${base}/tasks/not-found`)).status, 404);
});

