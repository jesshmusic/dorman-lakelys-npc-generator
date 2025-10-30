# Dorman Lakely's NPC Generator

A powerful FoundryVTT module for generating complete D&D 5e NPCs with stat blocks, equipment, class features, spells, and optional AI-powered content.

## Features

### Core Features (Free)

- **Complete D&D 5e NPCs**: Generate NPCs with accurate stats based on Challenge Rating
- **Smart Equipment**: Automatically assigns CR-appropriate weapons and armor
- **Class Features**: Integrates level-appropriate class features from compendiums
- **Spellcasting Support**: Full spell selection for spellcaster classes
- **Monster Features**: CR-based abilities like Multiattack, Keen Senses, and more
- **Flexible Output**: Save to world, folders, or compendiums
- **TypeScript Support**: Built with TypeScript for reliability and type safety

### AI Features (Patreon)

- **Apprentice Tier ($3/month)**:
  - AI-powered name generation based on species, gender, and role
  - AI-generated biographies with personality and backstory

- **Wizard Tier ($5/month)**:
  - AI portrait generation using DALL-E 3
  - Access to premium AI models (GPT-4o)
  - All Apprentice tier features

[Support on Patreon](https://www.patreon.com/c/ExistentialArts/membership) to unlock AI features!

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

### Basic NPC Generation

1. Navigate to the Actors directory in FoundryVTT
2. Click the "Generate NPC" button in the header
3. Fill in the form:
   - Select species, gender, role, alignment
   - Set Challenge Rating (determines stats, HP, AC)
   - Choose personality traits
   - Optionally select a folder or compendium destination
4. Click "Create NPC" to generate a complete actor with stats, equipment, features, and spells

### Using AI Features

1. **Connect Patreon**: Click "Connect Patreon for AI Features" in the generator
2. **Authenticate**: You'll be taken to Patreon to authorize the connection
3. **Generate Content**: Use the AI wand buttons next to Name, Biography, and Portrait fields
   - Names and biographies require Apprentice tier ($3/month)
   - Portraits require Wizard tier ($5/month)

### AI Configuration (GM Settings)

In Module Settings, configure:

- **Enable AI Features**: Toggle AI integration
- **OpenAI API Key**: Your OpenAI API key (required for AI features)
- **OpenAI Model**: Choose between GPT-4o Mini, GPT-4o, or GPT-4 Turbo
- **Portrait Art Style**: Default style for AI-generated portraits
- **Temperature Settings**: Control randomness for names, bios, and portraits

## Configuration

### Module Settings

- **Enable AI Features**: Enable/disable AI-powered generation
- **OpenAI API Key**: Required for AI features (get at https://platform.openai.com)
- **OpenAI Model**: Choose the AI model (affects cost and quality)
- **Portrait Art Style**: Visual style for generated portraits
- **Name Generation Randomness**: Control creativity (0.0 = consistent, 2.0 = very creative)
- **Biography Generation Randomness**: Control biography creativity
- **Portrait Prompt Randomness**: Control portrait prompt creativity

## License

This project is licensed under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.
