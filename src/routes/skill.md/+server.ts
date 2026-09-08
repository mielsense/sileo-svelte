import { skillResponse } from '$docs/server/agent-skill.js';
import type { RequestHandler } from './$types.js';

export const prerender = true;
export const GET: RequestHandler = () => skillResponse();
