# Dorman Lakely's NPC Generator

A FoundryVTT module that generates NPCs with philosophical depth and complex inner lives.

## Features

- **Existential Depth**: Each NPC comes with an existential crisis, personal philosophy, and internal contradictions
- **Complex Psychology**: NPCs have motivations, fears, hopes, and contradictions that make them feel real
- **TypeScript Support**: Built with TypeScript for better development experience and type safety
- **Customizable Settings**: Configure the depth of existential themes and philosophical complexity
- **Easy Integration**: Adds a simple button to the Actors directory for quick NPC generation

## Installation

1. Copy the `dorman-lakelys-npc-generator` folder to your FoundryVTT `Data/modules` directory
2. Install dependencies: `npm install`
3. Build the TypeScript: `npm run build`
4. Enable the module in FoundryVTT

## Development

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn

### Setup
```bash
# Install dependencies
npm install

# Build TypeScript files
npm run build

# Watch for changes during development
npm run dev
```

### Project Structure
```
dorman-lakelys-npc-generator/
├── src/                          # TypeScript source files
│   ├── main.ts                   # Main module entry point
│   ├── generator/                # NPC generation logic
│   ├── ui/                       # User interface components
│   └── settings/                 # Module settings
├── scripts/                      # Compiled JavaScript (generated)
├── styles/                       # CSS styles
├── lang/                         # Localization files
├── artwork/                      # Module artwork
├── module.json                   # FoundryVTT module manifest
├── package.json                  # Node.js package configuration
└── tsconfig.json                 # TypeScript configuration
```

## Usage

1. Navigate to the Actors directory in FoundryVTT
2. Click the "Generate NPC" button in the header
3. Review the generated NPC's existential profile
4. Click "Create Actor" to add them to your world, or "Regenerate" for a new NPC

## Generated NPC Properties

Each NPC includes:
- **Basic Info**: Name, age, occupation
- **Existential Crisis**: A fundamental question or struggle they face
- **Philosophy**: Their worldview and beliefs
- **Motivation**: What drives them forward
- **Fear**: What they're afraid of
- **Hope**: What keeps them going
- **Contradiction**: Internal conflicts that make them complex
- **Backstory**: How they came to be who they are

## Configuration

The module includes several settings to customize NPC generation:
- **Enable Deep Existential Themes**: Toggle profound existential content
- **Include Personal Contradictions**: Add internal conflicts to NPCs
- **Philosophical Complexity Level**: Control the depth of philosophical themes

## License

This project is licensed under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.