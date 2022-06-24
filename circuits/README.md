# zkSocialRecoveryWallet circom circuits

This folder contains all the [semaphore circuits](https://github.com/semaphore-protocol/semaphore) used in the zkSocialRecoveryWallet application.


## Install dependencies

To install all the dependencies run:

```bash
yarn install
```

## Compile circuits and generate and verify the zk-proof using [snarkjs](https://github.com/semaphore-protocol/semaphore)

To compile and run the circuits, go to root folder.

Run:

```bash
yarn compile:circuits
```

If you are in circuit folder:
```bash
cd ..

yarn compile:circuits
```

It will generate:
- semaphore.wasm
- semaphore.zkey


```text
├── build
│   ├── snark-artifacts
│   │   ├── semaphore.wasm
│   │   ├── semaphore.zkey
```