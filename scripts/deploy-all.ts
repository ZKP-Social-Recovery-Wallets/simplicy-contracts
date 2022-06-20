import fs from "fs";
import { run, hardhatArguments, ethers } from "hardhat";

type Verifier = {
  contractAddress: string;
  merkleTreeDepth: number;
};

async function main() {
  let facetCuts: any[] = [];
  let aliceSemaphoreInstance: any;
  let bobSemaphoreInstance: any;
  let aliceSemaphoreGroupsInstance: any;
  let bobSemaphoreGroupsInstance: any;
  let aliceSemaphoreVotingInstance: any;
  let bobSemaphoreVotingInstance: any;

  const depth = Number(process.env.TREE_DEPTH);
  const groupId: number = 1;

  const [deployer, aliceWallet, bobWallet] = await ethers.getSigners();

  const deployedContracts: { name: string; address: string }[] = [];
  const transactionHash: { name: string; hash: string }[] = [];

  // Deploy verifiers.
  for (let treeDepth = 16; treeDepth <= 32; treeDepth++) {
    const { address } = await run("deploy:verifier", {
      depth: treeDepth,
      logs: true,
    });

    deployedContracts.push({
      name: `Verifier${treeDepth}`,
      address,
    });
  }

  // Deploy diamond for Alice.
  const alice = await run("deploy:diamond", {
    name: "SimplicyWalletDiamond",
    account: "alice",
    logs: true,
  });
  deployedContracts.push({
    name: "Alice SimplicyWalletDiamond",
    address: alice.address,
  });

  // Deploy diamond for Bob.
  const bob = await run("deploy:diamond", {
    name: "SimplicyWalletDiamond",
    account: "bob",
    logs: true,
  });
  deployedContracts.push({
    name: "Bob SimplicyWalletDiamond",
    address: bob.address,
  });

  // Deploy poseidonT3.
  const { address } = await run("deploy:poseidonT3", { logs: true });
  deployedContracts.push({
    name: "PoseidonT3",
    address,
  });
  const poseidonT3Address = address;

  // Deploy SemaphoreGroupsFacet.
  const semaphoreGroupsFacet = await run("deploy:semaphoreGroupsFacet", {
    library: poseidonT3Address,
    logs: true,
  });

  deployedContracts.push({
    name: "SemaphoreGroupsFacet",
    address: semaphoreGroupsFacet.address,
  });

  const semaphoreVotingFacet = await run("deploy:semaphoreVotingFacet", {
    logs: true,
  });

  deployedContracts.push({
    name: "SemaphoreVotingFacet",
    address: semaphoreVotingFacet.address,
  });

  // Deploy SemaphoreFacet
  const semaphorefacet = await run("deploy:semaphore", {
    logs: true,
  });

  deployedContracts.push({
    name: "SemaphoreFacet",
    address: semaphorefacet.address,
  });

  facetCuts = [
    {
      target: semaphoreGroupsFacet.address,
      action: 0,
      selectors: Object.keys(semaphoreGroupsFacet.interface.functions).map(
        (fn) => semaphoreGroupsFacet.interface.getSighash(fn)
      ),
    },
    {
      target: semaphoreVotingFacet.address,
      action: 0,
      selectors: Object.keys(semaphoreVotingFacet.interface.functions).map(
        (fn) => semaphoreVotingFacet.interface.getSighash(fn)
      ),
    },
    {
      target: semaphorefacet.address,
      action: 0,
      selectors: Object.keys(semaphorefacet.interface.functions).map((fn) =>
        semaphorefacet.interface.getSighash(fn)
      ),
    },
  ];

  // do the cut for alice
  await alice
    .connect(aliceWallet)
    .diamondCut(facetCuts, ethers.constants.AddressZero, "0x");

  // // do the cut for bob.
  await bob
    .connect(bobWallet)
    .diamondCut(facetCuts, ethers.constants.AddressZero, "0x");

  aliceSemaphoreInstance = await ethers.getContractAt(
    "SemaphoreFacet",
    alice.address
  );
  bobSemaphoreInstance = await ethers.getContractAt(
    "SemaphoreFacet",
    bob.address
  );

  aliceSemaphoreGroupsInstance = await ethers.getContractAt(
    "SemaphoreGroupsFacet",
    alice.address
  );

  bobSemaphoreGroupsInstance = await ethers.getContractAt(
    "SemaphoreGroupsFacet",
    bob.address
  );

  aliceSemaphoreVotingInstance = await ethers.getContractAt(
    "SemaphoreVotingFacet",
    alice.address
  );

  bobSemaphoreVotingInstance = await ethers.getContractAt(
    "SemaphoreVotingFacet",
    alice.address
  );

  const verifier: string = "Verifier" + depth;
  const foundVerifier = deployedContracts.filter((obj) => {
    return obj.name === verifier;
  });

  console.log(verifier, foundVerifier[0].address);
  const verifiers: Verifier[] = [
    { merkleTreeDepth: depth, contractAddress: foundVerifier[0].address },
  ];

  // set verifiers for Alice and Bob
  const aliceTransaction = await aliceSemaphoreInstance
    .connect(aliceWallet)
    .setVerifiers(verifiers);
  console.log("Alice setVerifiers transaction hash: ", aliceTransaction.hash);

  transactionHash.push({
    name: "Alice setVerifiers",
    hash: aliceTransaction.hash,
  });

  const bobTransaction = await bobSemaphoreInstance
    .connect(bobWallet)
    .setVerifiers(verifiers);
  console.log("Bob setVerifiers transaction hash: ", bobTransaction.hash);

  transactionHash.push({
    name: "Bob setVerifiers",
    hash: bobTransaction.hash,
  });

  // create default group for Alice and Bob
  const aliceCreateGroupTransaction = await aliceSemaphoreGroupsInstance
    .connect(aliceWallet)
    .createGroup(groupId, depth, 0, deployer.address);
  console.log(
    "aliceCreateGroupTransaction hash: ",
    aliceCreateGroupTransaction.hash
  );

  transactionHash.push({
    name: "aliceCreateGroupTransaction",
    hash: aliceCreateGroupTransaction.hash,
  });

  const bobCreateGroupTransaction = await bobSemaphoreGroupsInstance
    .connect(bobWallet)
    .createGroup(groupId, depth, 0, deployer.address);
  console.log(
    "bobCreateGroupTransaction hash: ",
    bobCreateGroupTransaction.hash
  );

  transactionHash.push({
    name: "bobCreateGroupTransaction",
    hash: bobCreateGroupTransaction.hash,
  });

  const aliceCreatePoll = await aliceSemaphoreVotingInstance.createPoll(
    1,
    deployer.address,
    depth
  );

  transactionHash.push({
    name: "Alice SemaphoreVotingStorage createPoll",
    hash: aliceCreatePoll.hash,
  });

  const bobCreatePool = await bobSemaphoreVotingInstance.createPoll(
    1,
    deployer.address,
    depth
  );

  transactionHash.push({
    name: "Bob SemaphoreVotingStorage createPoll",
    hash: bobCreatePool.hash,
  });

  fs.writeFileSync(
    `./deployed-contracts/${hardhatArguments.network}.json`,
    JSON.stringify(deployedContracts, null, 4)
  );

  fs.appendFileSync(
    `./deployed-contracts/${hardhatArguments.network}.json`,
    JSON.stringify(transactionHash, null, 4)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
