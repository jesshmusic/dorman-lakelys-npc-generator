// Foundry VTT global types
declare const game: Game;
declare const ui: UI;
declare const Hooks: Hooks;
declare const Actor: typeof ActorConfig;
declare const Dialog: typeof DialogConfig;

interface Game {
    settings: {
        register(namespace: string, key: string, options: any): void;
        get(namespace: string, key: string): any;
    };
}

interface UI {
    notifications?: {
        info(message: string): void;
        error(message: string): void;
        warn(message: string): void;
    };
}

interface Hooks {
    once(event: string, callback: (...args: any[]) => void): void;
    on(event: string, callback: (...args: any[]) => void): void;
}

interface ActorConfig {
    create(data: any): Promise<any>;
}

interface DialogConfig {
    new (config: {
        title: string;
        content: string;
        buttons: Record<string, { label: string; callback?: () => void }>;
        default?: string;
    }): {
        render(force: boolean): void;
    };
}

