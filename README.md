# Simplicy contracts


## Development

Install dependencies via Yarn:

```bash
yarn install
```

Setup Husky to format code on commit:

```bash
yarn prepare
```

Link local packages and install remaining dependencies via Lerna:

```bash
yarn lerna bootstrap
```

Compile contracts via Hardhat:

```bash
yarn compile
```

Automatically upgrade dependencies with yarn-up:

```bash
yarn upgrade-dependencies
```

## Deployment
Deploy facets
```bash
yarn deploy:facets --facets '[{"name": "WalletFactoryFacet"}, {"name": "SemaphoreFacet"}, {"name": "SemaphoreVotingFacet"}]'
```

### Testing

Test contracts with Hardhat and generate gas report using `hardhat-gas-reporter`:

```bash
yarn test
```

Generate a code coverage report using `solidity-coverage`:

```bash
yarn coverage
```

Testing using forge
```bash
forge test

```

### Publication

Publish packages via Lerna:

```bash
yarn lerna-publish
```