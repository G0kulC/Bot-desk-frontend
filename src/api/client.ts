/**
 * Small typed fetch wrapper over the generated OpenAPI types (src/api/schema.d.ts).
 *
 *   const page = await api.get("/clients", { query: { status: "live" } });   // typed Page_ClientOut_
 *   await api.post("/clients/{client_id}/knowledge/approve", { path: { client_id }, body: { approved_by_name } });
 *
 * - adds the bearer token
 * - turns {"error": {"code","message"}} into an ApiError
 * - signs the user out on 401
 */
import { authStore } from "./auth-store";
import type { paths } from "./schema";

export const API_BASE_URL: string = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1"
).replace(/\/$/, "");

type Prefix = "/api/v1";
type Method = "get" | "post" | "put" | "patch" | "delete";
type FullPath = Extract<keyof paths, `${Prefix}${string}`>;
type Short<K> = K extends `${Prefix}${infer R}` ? R : never;
export type ApiPath = Short<FullPath>;
type Full<P extends ApiPath> = Extract<`${Prefix}${P}`, keyof paths>;

type Op<P extends ApiPath, M extends Method> = NonNullable<paths[Full<P>][M]>;
/** Paths that support method M. */
export type PathsWith<M extends Method> = {
  [P in ApiPath]: [NonNullable<paths[Full<P>][M]>] extends [never] ? never : P;
}[ApiPath];

type ContentOf<T> = T extends { content: infer C }
  ? C extends { "application/json": infer J }
    ? J
    : C extends { "text/plain": infer S }
      ? S
      : unknown
  : unknown;
type Responses<O> = O extends { responses: infer R } ? R : never;
export type ResponseOf<O> = 200 extends keyof Responses<O>
  ? ContentOf<Responses<O>[200]>
  : 201 extends keyof Responses<O>
    ? ContentOf<Responses<O>[201]>
    : unknown;
type BodyOf<O> = O extends { requestBody?: { content: { "application/json": infer B } } } ? B : never;
type QueryOf<O> = O extends { parameters: { query?: infer Q } } ? NonNullable<Q> : never;
type PathParamsOf<O> = O extends { parameters: { path: infer PP } } ? PP : never;

export type RequestOptions<O> = {
  path?: PathParamsOf<O>;
  query?: QueryOf<O>;
  body?: BodyOf<O>;
  signal?: AbortSignal;
};

export type ApiResponse<P extends ApiPath, M extends Method = "get"> = ResponseOf<Op<P, M>>;
export type ApiBody<P extends ApiPath, M extends Method> = BodyOf<Op<P, M>>;
export type ApiQuery<P extends ApiPath, M extends Method = "get"> = QueryOf<Op<P, M>>;

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type UnauthorizedHandler = () => void;
const unauthorizedHandlers = new Set<UnauthorizedHandler>();
export function onUnauthorized(handler: UnauthorizedHandler): () => void {
  unauthorizedHandlers.add(handler);
  return () => unauthorizedHandlers.delete(handler);
}

function buildUrl(path: string, params?: Record<string, unknown>, query?: Record<string, unknown>): string {
  const filled = path.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = params?.[key];
    if (v === undefined || v === null) throw new Error(`Missing path parameter "${key}" for ${path}`);
    return encodeURIComponent(String(v));
  });
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v === undefined || v === null || v === "") continue;
    qs.append(k, String(v));
  }
  const q = qs.toString();
  return `${API_BASE_URL}${filled}${q ? `?${q}` : ""}`;
}

export async function request<T = unknown>(
  method: Method,
  path: string,
  opts: { path?: unknown; query?: unknown; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json, text/plain" };
  const token = authStore.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(
      buildUrl(path, opts.path as Record<string, unknown>, opts.query as Record<string, unknown>),
      { method: method.toUpperCase(), headers, body, signal: opts.signal },
    );
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
    throw new ApiError(0, "network_error", "Can't reach the Bot Desk server. Check your connection.");
  }

  const type = res.headers.get("content-type") ?? "";
  const payload: unknown =
    res.status === 204
      ? null
      : type.includes("application/json")
        ? await res.json().catch(() => null)
        : await res.text();

  if (!res.ok) {
    const err = (payload as { error?: { code?: string; message?: string; details?: unknown } } | null)?.error;
    const apiErr = new ApiError(
      res.status,
      err?.code ?? `http_${res.status}`,
      err?.message ?? (typeof payload === "string" && payload ? payload : `Request failed (${res.status})`),
      err?.details,
    );
    if (res.status === 401 && !path.startsWith("/auth/login")) {
      authStore.clear();
      unauthorizedHandlers.forEach((h) => h());
    }
    throw apiErr;
  }
  return payload as T;
}

function make<M extends Method>(method: M) {
  return <P extends PathsWith<M>>(path: P, opts?: RequestOptions<Op<P, M>>) =>
    request<ResponseOf<Op<P, M>>>(method, path, opts);
}

export const api = {
  get: make("get"),
  post: make("post"),
  put: make("put"),
  patch: make("patch"),
  delete: make("delete"),
};

/** Human-readable message for toasts. */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === "validation_error" && Array.isArray(err.details) && err.details.length) {
      const first = err.details[0] as { loc?: unknown[]; msg?: string };
      const field = first.loc?.slice(1).join(".");
      return field ? `${field}: ${first.msg}` : (first.msg ?? err.message);
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}
