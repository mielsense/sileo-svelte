import { json } from '@sveltejs/kit';
import { skillIndex } from '$docs/server/agent-skill.js';
import type { RequestHandler } from './$types.js';

export const prerender = true;
export const GET: RequestHandler = () => json(skillIndex);
