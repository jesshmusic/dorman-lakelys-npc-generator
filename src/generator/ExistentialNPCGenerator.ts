// Core NPC generation logic with existential themes
export interface ExistentialNPC {
    name: string;
    age: number;
    occupation: string;
    existentialCrisis: string;
    philosophy: string;
    motivation: string;
    fear: string;
    hope: string;
    contradiction: string;
    backstory: string;
}

export class ExistentialNPCGenerator {
    private existentialCrises = [
        "Questions the meaning of their mundane daily routine",
        "Struggles with the inevitability of death",
        "Wonders if their choices truly matter in the grand scheme",
        "Feels trapped between duty and personal desires",
        "Questions whether they truly know themselves",
        "Grapples with the weight of their past mistakes",
        "Seeks purpose beyond material possessions",
        "Confronts the absurdity of social conventions"
    ];

    private philosophies = [
        "Believes that suffering gives life meaning",
        "Thinks that freedom is both a blessing and a curse",
        "Holds that authenticity is the highest virtue",
        "Views life as an endless series of choices",
        "Sees beauty in the temporary nature of existence",
        "Believes that connection with others defines us",
        "Thinks that creating meaning is humanity's burden",
        "Views absurdity as life's fundamental condition"
    ];

    private occupations = [
        "Tavern keeper", "Blacksmith", "Merchant", "Scholar", "Guard",
        "Farmer", "Priest", "Bard", "Healer", "Scribe",
        "Baker", "Fletcher", "Cobbler", "Tailor", "Fisherman"
    ];

    private names = [
        "Aelian", "Bronwen", "Caelan", "Dara", "Elric", "Fiora",
        "Gareth", "Hilda", "Iorveth", "Jenna", "Kael", "Luna",
        "Magnus", "Nora", "Osric", "Petra", "Quinn", "Raven",
        "Silas", "Thea", "Ulric", "Vera", "Willem", "Xara",
        "Yorick", "Zara"
    ];

    generateNPC(): ExistentialNPC {
        const name = this.getRandomElement(this.names);
        const age = Math.floor(Math.random() * 60) + 20;
        const occupation = this.getRandomElement(this.occupations);
        const existentialCrisis = this.getRandomElement(this.existentialCrises);
        const philosophy = this.getRandomElement(this.philosophies);

        return {
            name,
            age,
            occupation,
            existentialCrisis,
            philosophy,
            motivation: this.generateMotivation(),
            fear: this.generateFear(),
            hope: this.generateHope(),
            contradiction: this.generateContradiction(),
            backstory: this.generateBackstory(name, age, occupation)
        };
    }

    private getRandomElement<T>(array: T[]): T {
        return array[Math.floor(Math.random() * array.length)];
    }

    private generateMotivation(): string {
        const motivations = [
            "To find peace with their past decisions",
            "To protect what little meaning they've found",
            "To understand their place in the world",
            "To create something that will outlast them",
            "To break free from societal expectations",
            "To reconcile with estranged family",
            "To prove their worth to themselves",
            "To find genuine human connection"
        ];
        return this.getRandomElement(motivations);
    }

    private generateFear(): string {
        const fears = [
            "That their life has been wasted",
            "Of being forgotten after death",
            "That they are fundamentally alone",
            "Of making the wrong choice",
            "That nothing they do matters",
            "Of confronting their true self",
            "That love is an illusion",
            "Of the emptiness behind routine"
        ];
        return this.getRandomElement(fears);
    }

    private generateHope(): string {
        const hopes = [
            "That redemption is always possible",
            "That their struggles have meaning",
            "That genuine connection exists",
            "That they can change their story",
            "That beauty makes suffering worthwhile",
            "That their actions ripple through time",
            "That understanding brings peace",
            "That tomorrow offers new possibilities"
        ];
        return this.getRandomElement(hopes);
    }

    private generateContradiction(): string {
        const contradictions = [
            "Seeks solitude but craves companionship",
            "Values honesty but lives a lie",
            "Desires freedom but clings to routine",
            "Fears death but feels already dead inside",
            "Preaches acceptance but harbors resentment",
            "Wants to be understood but hides their truth",
            "Believes in fate but fights against it",
            "Seeks meaning but destroys what they build"
        ];
        return this.getRandomElement(contradictions);
    }

    private generateBackstory(name: string, age: number, occupation: string): string {
        const backstories = [
            `${name} became a ${occupation} after a life-changing event in their youth that shattered their worldview.`,
            `Born into the ${occupation} trade, ${name} has spent ${age - 18} years questioning whether this path was chosen or merely inherited.`,
            `${name} turned to being a ${occupation} as a way to find meaning after losing everything they once held dear.`,
            `Once destined for greatness, ${name} now works as a ${occupation}, finding unexpected wisdom in the mundane.`,
            `${name} chose the life of a ${occupation} to escape their past, but finds that some truths cannot be outrun.`
        ];
        return this.getRandomElement(backstories);
    }
}