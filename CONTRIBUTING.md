# Contributing to Scaffold-XRP

Thank you for your interest in contributing to Scaffold-XRP! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/scaffold-xrp.git`
3. Install dependencies: `pnpm install`
4. Create a branch: `git checkout -b feature/your-feature-name`

## Development Workflow

### Running the Development Server

\`\`\`bash
pnpm dev
\`\`\`

### Building

\`\`\`bash
pnpm build
\`\`\`

### Linting and Formatting

\`\`\`bash
pnpm lint
pnpm format
\`\`\`

## Project Structure

- `apps/web` - Next.js frontend application
- `packages/bedrock` - Smart contracts in Rust
- Root configuration files for Turborepo, pnpm, etc.

## Code Style

- Use Prettier for code formatting (configured in `.prettierrc`)
- Follow existing code patterns and conventions
- Write descriptive commit messages

## Making Changes

### Adding New Features

1. Create a new branch from `main`
2. Implement your feature
3. Test thoroughly
4. Submit a pull request

### Fixing Bugs

1. Create an issue describing the bug
2. Reference the issue in your pull request
3. Include steps to reproduce and test the fix

### Adding New Contracts

1. Add your contract to `packages/bedrock/src/`
2. Update the README with usage instructions
3. Add example interactions to the frontend if applicable

## Pull Request Process

1. Update documentation for any new features
2. Ensure all tests pass and code is formatted
3. Update the README.md if needed
4. Reference any related issues in the PR description
5. Wait for review from maintainers

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community

## Questions?

Feel free to open an issue for any questions or concerns.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
