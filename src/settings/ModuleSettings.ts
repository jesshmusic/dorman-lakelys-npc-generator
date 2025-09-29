// Module settings configuration
const MODULE_ID = 'existential-npc-generator';

export function registerSettings(): void {
    game.settings.register(MODULE_ID, 'enableExistentialThemes', {
        name: 'Enable Deep Existential Themes',
        hint: 'When enabled, NPCs will have more profound existential crises and philosophical depth.',
        scope: 'world',
        config: true,
        type: Boolean,
        default: true
    });

    game.settings.register(MODULE_ID, 'includeContradictions', {
        name: 'Include Personal Contradictions',
        hint: 'When enabled, NPCs will have internal contradictions that make them more complex.',
        scope: 'world',
        config: true,
        type: Boolean,
        default: true
    });

    game.settings.register(MODULE_ID, 'philosophicalComplexity', {
        name: 'Philosophical Complexity Level',
        hint: 'Controls the depth of philosophical themes in generated NPCs.',
        scope: 'world',
        config: true,
        type: String,
        choices: {
            'simple': 'Simple',
            'moderate': 'Moderate',
            'complex': 'Complex',
            'profound': 'Profound'
        },
        default: 'moderate'
    });
}