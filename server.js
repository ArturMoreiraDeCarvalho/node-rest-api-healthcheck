import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const MAX_BODY_BYTES = 1_000_000;

function json(res, status, payload) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      const error = new Error("Request body is too large");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  if (size === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("Request body must be valid JSON");
    error.status = 400;
    throw error;
  }
}

function createTask(input) {
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!title) return { error: "title is required" };
  return {
    value: {
      id: randomUUID(),
      title,
      description: typeof input.description === "string" ? input.description.trim() : "",
      completed: false,
      createdAt: new Date().toISOString(),
    },
  };
}

export function createApp({ initialTasks = [] } = {}) {
  const tasks = initialTasks.map((task) => ({ ...task }));

  return async function app(req, res) {
    const url = new URL(req.url, "http://localhost");
    const taskMatch = url.pathname.match(/^\/tasks\/([^/]+)$/);

    if (req.method === "GET" && url.pathname === "/health") {
      return json(res, 200, { status: "ok", service: "task-health-api" });
    }
    if (req.method === "GET" && url.pathname === "/tasks") {
      return json(res, 200, { data: tasks });
    }
    if (req.method === "POST" && url.pathname === "/tasks") {
      try {
        const result = createTask(await readJson(req));
        if (result.error) return json(res, 422, { error: result.error });
        tasks.push(result.value);
        return json(res, 201, result.value);
      } catch (error) {
        return json(res, error.status ?? 500, { error: error.message });
      }
    }
    if (req.method === "GET" && taskMatch) {
      const task = tasks.find((item) => item.id === taskMatch[1]);
      return task ? json(res, 200, task) : json(res, 404, { error: "task not found" });
    }
    if (req.method === "PATCH" && taskMatch) {
      const task = tasks.find((item) => item.id === taskMatch[1]);
      if (!task) return json(res, 404, { error: "task not found" });
      try {
        const input = await readJson(req);
        if (input.title !== undefined) {
          if (typeof input.title !== "string" || !input.title.trim()) {
            return json(res, 422, { error: "title must be a non-empty string" });
          }
          task.title = input.title.trim();
        }
        if (input.description !== undefined) {
          if (typeof input.description !== "string") {
            return json(res, 422, { error: "description must be a string" });
          }
          task.description = input.description.trim();
        }
        if (input.completed !== undefined) {
          if (typeof input.completed !== "boolean") {
            return json(res, 422, { error: "completed must be boolean" });
          }
          task.completed = input.completed;
        }
        return json(res, 200, task);
      } catch (error) {
        return json(res, error.status ?? 500, { error: error.message });
      }
    }
    return json(res, 404, { error: "route not found" });
  };
}

if (import.meta.url === `file://${process.argv[1].replaceAll("\\", "/")}`) {
  const port = Number(process.env.PORT ?? 3000);
  createServer(createApp()).listen(port, () => {
    console.log(`Task Health API listening on http://localhost:${port}`);
  });
}

