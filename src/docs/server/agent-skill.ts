import skillSource from '../../../skills/sileo-svelte/SKILL.md?raw';

export const skillPath = '/.well-known/agent-skills/sileo-svelte/SKILL.md';

export function skillResponse() {
    return new Response(skillSource, {
        headers: { 'content-type': 'text/markdown; charset=utf-8' }
    });
}

export const skillIndex = {
    $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
    skills: [
        {
            name: 'sileo-svelte',
            type: 'skill-md',
            description: 'Add, customize, and debug sileo-svelte notifications in Svelte 5.',
            url: skillPath
        }
    ]
};
