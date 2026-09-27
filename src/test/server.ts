import { setupServer } from "msw/node";

/** MSW server; tests add handlers with server.use(...). */
export const server = setupServer();

export const API = "http://api.test/api/v1";
