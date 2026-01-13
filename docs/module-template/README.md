# Scaffold-XRP Module Template

This is an example module structure for scaffold-xrp. Use this as a reference when creating your own modules.

## Module Structure

```
my-module/
├── module.json              # Required: Module metadata and configuration
├── README.md                # Documentation for your module
├── components/
│   ├── react/               # React components (for Next.js)
│   │   └── ExampleComponent.tsx
│   └── vue/                 # Vue components (for Nuxt)
│       └── ExampleComponent.vue
├── hooks/                   # React hooks (copied for Next.js projects)
│   └── useExample.ts
├── composables/             # Vue composables (copied for Nuxt projects)
│   └── useExample.ts
├── lib/                     # Shared utilities (copied to both frameworks)
│   └── utils.ts
├── pages/                   # Page components
│   ├── react/               # Next.js pages
│   │   └── example.tsx
│   └── vue/                 # Nuxt pages
│       └── example.vue
├── contracts/               # Rust/WASM smart contracts
│   └── src/
│       └── lib.rs
├── data/                    # Static data files
│   └── config.json
└── install.js               # Optional: Post-install script
```

## module.json

The `module.json` file is required and defines your module's metadata:

```json
{
  "name": "my-module",
  "version": "1.0.0",
  "description": "Description of what your module does",
  "author": "Your Name",
  "compatibility": {
    "scaffold-xrp": ">=0.1.0",
    "frameworks": ["nextjs", "nuxt"]
  },
  "files": {
    "components": ["components/"],
    "hooks": ["hooks/"],
    "composables": ["composables/"],
    "lib": ["lib/"],
    "contracts": ["contracts/"],
    "pages": ["pages/"],
    "data": ["data/"]
  },
  "dependencies": {
    "npm": ["some-npm-package"],
    "modules": ["other-scaffold-module"]
  }
}
```

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Unique identifier for your module |
| `version` | Yes | Semantic version of your module |
| `description` | Yes | Brief description of what the module does |
| `author` | No | Author name or organization |
| `compatibility.scaffold-xrp` | No | Minimum scaffold-xrp version required |
| `compatibility.frameworks` | No | Supported frameworks (`nextjs`, `nuxt`, or both) |
| `files` | No | Directories to copy (auto-detected if not specified) |
| `dependencies.npm` | No | NPM packages to install |
| `dependencies.modules` | No | Other scaffold-xrp modules required |

## Installation Flow

When a user installs your module:

1. The module repo is cloned
2. `module.json` is read and validated
3. Framework compatibility is checked
4. Files are copied to the appropriate locations:
   - `components/react/*` → `apps/web/modules/<name>/components/`
   - `components/vue/*` → `apps/web/modules/<name>/components/`
   - `hooks/*` → `apps/web/modules/<name>/hooks/`
   - `composables/*` → `apps/web/modules/<name>/composables/`
   - `lib/*` → `apps/web/modules/<name>/lib/`
   - `contracts/*` → `packages/bedrock/modules/<name>/`
5. NPM dependencies are installed
6. `install.js` is executed (if present)
7. Module is registered in `.scaffold-xrp.json`

## Post-Install Script

You can include an `install.js` script for custom setup:

```javascript
// install.js
const fs = require('fs');
const path = require('path');

// Environment variables available:
// - SCAFFOLD_XRP_PROJECT_DIR: Root project directory
// - SCAFFOLD_XRP_FRAMEWORK: 'nextjs' or 'nuxt'
// - SCAFFOLD_XRP_WEB_DIR: Path to apps/web

const projectDir = process.env.SCAFFOLD_XRP_PROJECT_DIR;
const framework = process.env.SCAFFOLD_XRP_FRAMEWORK;

console.log(`Running post-install for ${framework} project...`);

// Example: Update tailwind.config.js to include module paths
// Example: Add environment variables to .env.example
```

## Publishing Your Module

1. Create a public Git repository for your module
2. Ensure `module.json` is in the root directory
3. Users can install directly via URL:
   ```bash
   npx create-xrp add https://github.com/your-username/your-module
   ```

4. To add to the official registry, submit a PR to:
   https://github.com/XRPL-Commons/scaffold-xrp-registry

## Example Usage

After installation, users can import your module:

```typescript
// Next.js
import { ExampleComponent } from '@/modules/example-module/components/ExampleComponent';
import { useExample } from '@/modules/example-module/hooks/useExample';

// Nuxt
import ExampleComponent from '~/modules/example-module/components/ExampleComponent.vue';
import { useExample } from '~/modules/example-module/composables/useExample';
```

## Best Practices

1. **Support both frameworks** when possible
2. **Document your module** with clear README
3. **Keep dependencies minimal** to avoid conflicts
4. **Use TypeScript** for better developer experience
5. **Include examples** showing how to use your module
6. **Version your module** following semantic versioning
