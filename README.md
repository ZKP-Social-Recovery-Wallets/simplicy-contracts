# zkSocialRecoveryWallet circuits and contracts

This folder was generated using [Hardhat](https://github.com/NomicFoundation/hardhat) and contains all the smart contracts used in the zkSocialRecoveryWallet application.

## Install dependencies

```bash
yarn install
```

## Prepare for test and deployment

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

##  Run tests

Test contracts with Hardhat and generate gas report using `hardhat-gas-reporter`:

```bash
yarn test
```

###  Test coverage
Generate a code coverage report using `solidity-coverage`:

```bash
yarn coverage
```

## Publication

Publish packages via Lerna:

```bash
yarn lerna-publish
```

## Deployment

### Diamond

```bash
yarn deploy:diamond --name: 'WalletFactoryDiamond'
```

```bash
yarn deploy:diamond --name: 'SimplicyWalletDiamond'
```

### Facets

```bash
yarn deploy:facets --facets '[{"name": "ERC20Facet"}, {"name": "ERC721Facet"}, {"name": "RecoveryFacet"}, {"name": "WalletFactoryFacet"}, {"name": "SemaphoreFacet"}, {"name": "SemaphoreVotingFacet"}]'
```

### Facets with poseidon

```bash
yarn deploy:poseidonT3 --name: 'PoseidonT3'
```

```bash
yarn deploy:facet-with-poseidon --facets '[{"name": "GuardianFacet"}, {"name": "SemaphoreGroupsFacet"}]' --library: ${poseidonT3Address}
```

## File Structure

```text
├── build
│   ├── snark-artifacts
│   │   ├── semaphore.wasm
│   │   ├── semaphore.zkey
├── circuits
│   ├── semaphore.circom
│   ├── ecdh.circom
│   ├── tree
│   │   ├── hasherPoseidon.circom
│   │   ├── poseidon
│   │   │   ├── poseidonHashT3.circom
│   │   │   ├── poseidonHashT4.circom
│   │   │   ├── poseidonHashT5.circom
│   │   │   ├── poseidonHashT6.circom
├── contracts
│   ├── contracts
│   │   ├── diamond
│   │   │   ├── ISimplicyWalletDiamond.sol
│   │   │   ├── IWalletFactoryDiamond.sol
│   │   │   ├── SimplicyWalletDiamond.sol
│   │   │   ├── WalletFactoryDiamond.sol
│   │   ├── facets
│   │   │   ├── ERC20Facet.sol
│   │   │   ├── ERC721Facet.sol
│   │   │   ├── GuardianFacet.sol
│   │   │   ├── RecoveryFacet.sol
│   │   │   ├── SemaphoreFacet.sol
│   │   │   ├── SemaphoreGroupsFacet.sol
│   │   │   ├── WalletFactoryFacet.sol
│   │   ├── guardian
│   │   │   ├── Guardian.sol
│   │   │   ├── GuardianInternal.sol
│   │   │   ├── GuardianStorage.sol
│   │   │   ├── IGuardian.sol
│   │   │   ├── IGuardianInternal.sol
│   │   ├── interfaces
│   │   │   ├── IGuardianFacet.sol
│   │   │   ├── IVerifier.sol
│   │   │   ├── IzkWallet.sol
│   │   ├── recovery
│   │   │   ├── IRecovery.sol
│   │   │   ├── IRecoveryInternal.sol
│   │   │   ├── Recovery.sol
│   │   │   ├── RecoveryInternal.sol
│   │   │   ├── RecoveryMock.sol
│   │   │   ├── RecoveryStorage.sol
│   │   ├── semaphore
│   │   │   ├── base
│   │   │   │   ├── SemaphoreCoreBase
│   │   │   │   │   ├── ISemaphoreCoreBase.sol
│   │   │   │   │   ├── ISemaphoreCoreBaseInternal.sol
│   │   │   │   │   ├── SemaphoreCoreBase.sol
│   │   │   │   │   ├── SemaphoreCoreBaseInternal.sol
│   │   │   │   │   ├── SemaphoreCoreBaseMock.sol
│   │   │   │   │   ├── SemaphoreCoreBaseStorage.sol
│   │   │   │   ├── SemaphoreGroupsBase
│   │   │   │   │   ├── ISemaphoreGroupsBase.sol
│   │   │   │   │   ├── ISemaphoreGroupsInternal.sol
│   │   │   │   │   ├── SemaphoreGroupsBase.sol
│   │   │   │   │   ├── SemaphoreGroupsBaseInternal.sol
│   │   │   │   │   ├── SemaphoreGroupsBaseMock.sol
│   │   │   │   │   ├── SemaphoreGroupsBaseStorage.sol
│   │   │   ├── extensions
│   │   │   │   ├── SemaphoreVoting
│   │   │   │   │   ├── ISemaphoreVoting.sol
│   │   │   │   │   ├── ISemaphoreVotingInternal.sol
│   │   │   │   │   ├── SemaphoreVoting.sol
│   │   │   │   │   ├── SemaphoreVotingInternal.sol
│   │   │   │   │   ├── SemaphoreVotingStorage.sol
│   │   │   ├── ISemaphore.sol
│   │   │   ├── ISemaphoreGroups.sol
│   │   │   ├── ISemaphoreInternal.sol
│   │   │   ├── Semaphore.sol
│   │   │   ├── SemaphoreInternal.sol
│   │   │   ├── SemaphoreStorage.sol
│   │   ├── token
│   │   │   ├── ERC20
│   │   │   │   ├── ERC20Service.sol
│   │   │   │   ├── ERC20ServiceInternal.sol
│   │   │   │   ├── ERC20ServiceMock.sol
│   │   │   │   ├── ERC20ServiceStorage.sol
│   │   │   │   ├── IERC20Service.sol
│   │   │   │   ├── IERC20ServiceInternal.sol
│   │   │   ├── ERC721
│   │   │   │   ├── ERC721Service.sol
│   │   │   │   ├── ERC721ServiceInternal.sol
│   │   │   │   ├── ERC721ServiceStorage.sol
│   │   │   │   ├── IERC721Service.sol
│   │   │   │   ├── IERC721ServiceInternal.sol
│   │   │   ├── ERC1155
│   │   │   │   ├── ERC1155ServiceStorage.sol
│   │   ├── utils
│   │   │   ├── cryptography
│   │   │   │   ├── IncrementalBinaryTree
│   │   │   │   │   ├── IIncrementalBinaryTree.sol
│   │   │   │   │   ├── IIncrementalBinaryTreeInternal.sol
│   │   │   │   │   ├── IncrementalBinaryTreeInternal.sol
│   │   │   │   │   ├── IncrementalBinaryTreeStorage.sol
│   │   │   │   ├── Hashes.sol
│   │   │   ├── Constant.sol
│   │   ├── verifier
│   │   │   ├── Verifier16.sol
│   │   │   ├── Verifier17.sol
│   │   │   ├── Verifier18.sol
│   │   │   ├── Verifier19.sol
│   │   │   ├── Verifier20.sol
│   │   │   ├── Verifier21.sol
│   │   │   ├── Verifier22.sol
│   │   │   ├── Verifier23.sol
│   │   │   ├── Verifier24.sol
│   │   │   ├── Verifier25.sol
│   │   │   ├── Verifier26.sol
│   │   │   ├── Verifier27.sol
│   │   │   ├── Verifier28.sol
│   │   │   ├── Verifier29.sol
│   │   │   ├── Verifier30.sol
│   │   │   ├── Verifier31.sol
│   │   │   ├── Verifier32.sol
│   │   ├── wallet
│   │   │   ├── factory
│   │   │   │   ├── IWalletFactory.sol
│   │   │   │   ├── IWalletFactoryInternal.sol
│   │   │   │   ├── WalletFactory.sol
│   │   │   │   ├── WalletFactoryInternal.sol
│   │   │   │   ├── WalletFactoryStorage.sol
```