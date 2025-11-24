# bedrock

XRPL Smart Contract project

## Getting Started

### Build the contract
```bash
bedrock flint build --release
```

### Start local node
```bash
bedrock basalt start
```

### Deploy
```bash
bedrock slate deploy --network local
```

## Project Structure

- `contract/` - Smart contract source code
- `bedrock.toml` - Project configuration
- `.wallets/` - Local wallet storage (git-ignored)
