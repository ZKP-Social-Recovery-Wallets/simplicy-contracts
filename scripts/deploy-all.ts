import fs from "fs";
import { Contract } from "ethers";
import { run, hardhatArguments, ethers } from "hardhat";
import {
  WalletFactoryDiamond,
  WalletFactoryFacet,
} from "@solidstate/typechain-types";

type Verifier = {
  contractAddress: string;
  merkleTreeDepth: number;
};

type DeployedContract = {
  name: string;
  contract: Contract;
  address: string;
};

async function main() {
  let factoryDiamond: WalletFactoryDiamond;
  let walletFactoryInstance: WalletFactoryFacet;
  let factoryFacets: DeployedContract[];

  let facetCuts: { target: string; action: number; selectors: any }[] = [];
  let aliceSemaphoreInstance: any;
  let bobSemaphoreInstance: any;
  let aliceSemaphoreGroupsInstance: any;
  let bobSemaphoreGroupsInstance: any;
  let aliceSemaphoreVotingInstance: any;
  let bobSemaphoreVotingInstance: any;
  let facets: DeployedContract[];
  let anotherFacets: DeployedContract[];

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

  // Deploy factory diamond
  factoryDiamond = await run("deploy:diamond", {
    name: "WalletFactoryDiamond",
    logs: true,
  });
  deployedContracts.push({
    name: "WalletFactoryDiamond",
    address: factoryDiamond.address,
  });

  factoryFacets = await run("deploy:facets", {
    facets: [{ name: "WalletFactoryFacet" }],
  });

  for (let i = 0; i < facets.length; i++) {
    deployedContracts.push({
      name: factoryFacets[i].name,
      address: factoryFacets[i].address,
    });

    facetCuts.push({
      target: factoryFacets[i].address,
      action: 0,
      selectors: Object.keys(factoryFacets[i].contract.interface.functions).map(
        (fn) => facets[i].contract.interface.getSighash(fn)
      ),
    });
  }

  // Deploy poseidonT3.
  const { address } = await run("deploy:poseidonT3", { logs: true });
  deployedContracts.push({
    name: "PoseidonT3",
    address,
  });
  const poseidonT3Address = address;

  facets = await run("deploy:facet-with-poseidon", {
    library: poseidonT3Address,
    facets: [{ name: "GuardianFacet" }, { name: "SemaphoreGroupsFacet" }],
    logs: false,
  });

  for (let i = 0; i < facets.length; i++) {
    deployedContracts.push({
      name: facets[i].name,
      address: facets[i].address,
    });

    facetCuts.push({
      target: facets[i].address,
      action: 0,
      selectors: Object.keys(facets[i].contract.interface.functions).map((fn) =>
        facets[i].contract.interface.getSighash(fn)
      ),
    });
  }

  anotherFacets = await run("deploy:facets", {
    facets: [
      { name: "ERC20Facet" },
      { name: "ERC721Facet" },
      { name: "RecoveryFacet" },
      { name: "SemaphoreFacet" },
      { name: "SemaphoreVotingFacet" },
      { name: "WalletFactoryFacet" },
    ],
  });

  for (let i = 0; i < facets.length; i++) {
    deployedContracts.push({
      name: anotherFacets[i].name,
      address: anotherFacets[i].address,
    });

    facetCuts.push({
      target: anotherFacets[i].address,
      action: 0,
      selectors: Object.keys(anotherFacets[i].contract.interface.functions).map(
        (fn) => anotherFacets[i].contract.interface.getSighash(fn)
      ),
    });
  }

  //do the cut for factory contract
  await factoryDiamond
    .connect(deployer)
    .diamondCut(facetCuts, ethers.constants.AddressZero, "0x");

  walletFactoryInstance = await ethers.getContractAt(
    "FactoryFacet",
    factoryDiamond.address
  );

  console.log(await walletFactoryInstance.walletFactoryFacetVersion());

  // facetCuts = [
  //   {
  //     target: facets[0].address,
  //     action: 0,
  //     selectors: Object.keys(facets[0].contract.interface.functions).map((fn) =>
  //       facets[0].contract.interface.getSighash(fn)
  //     ),
  //   },
  //   {
  //     target: facets[1].address,
  //     action: 0,
  //     selectors: Object.keys(facets[1].contract.interface.functions).map((fn) =>
  //       facets[1].contract.interface.getSighash(fn)
  //     ),
  //   },
  //   {
  //     target: anotherFacets[0].address,
  //     action: 0,
  //     selectors: Object.keys(anotherFacets[0].contract.interface.functions).map(
  //       (fn) => anotherFacets[0].contract.interface.getSighash(fn)
  //     ),
  //   },
  //   {
  //     target: anotherFacets[1].address,
  //     action: 0,
  //     selectors: Object.keys(anotherFacets[1].contract.interface.functions).map(
  //       (fn) => anotherFacets[1].contract.interface.getSighash(fn)
  //     ),
  //   },
  //   {
  //     target: anotherFacets[2].address,
  //     action: 0,
  //     selectors: Object.keys(anotherFacets[2].contract.interface.functions).map(
  //       (fn) => facets[2].contract.interface.getSighash(fn)
  //     ),
  //   },
  //   {
  //     target: anotherFacets[3].address,
  //     action: 0,
  //     selectors: Object.keys(anotherFacets[3].contract.interface.functions).map(
  //       (fn) => anotherFacets[3].contract.interface.getSighash(fn)
  //     ),
  //   },
  //   {
  //     target: anotherFacets[4].address,
  //     action: 0,
  //     selectors: Object.keys(anotherFacets[4].contract.interface.functions).map(
  //       (fn) => anotherFacets[4].contract.interface.getSighash(fn)
  //     ),
  //   },
  //   {
  //     target: anotherFacets[5].address,
  //     action: 0,
  //     selectors: Object.keys(anotherFacets[5].contract.interface.functions).map(
  //       (fn) => anotherFacets[5].contract.interface.getSighash(fn)
  //     ),
  //   },
  // ];

  // do the cut for alice
  // await alice
  //   .connect(aliceWallet)
  //   .diamondCut(facetCuts, ethers.constants.AddressZero, "0x");

  // // do the cut for bob.
  // await bob
  //   .connect(bobWallet)
  //   .diamondCut(facetCuts, ethers.constants.AddressZero, "0x");

  // aliceSemaphoreInstance = await ethers.getContractAt(
  //   "SemaphoreFacet",
  //   alice.address
  // );
  // bobSemaphoreInstance = await ethers.getContractAt(
  //   "SemaphoreFacet",
  //   bob.address
  // );

  // aliceSemaphoreGroupsInstance = await ethers.getContractAt(
  //   "SemaphoreGroupsFacet",
  //   alice.address
  // );

  // bobSemaphoreGroupsInstance = await ethers.getContractAt(
  //   "SemaphoreGroupsFacet",
  //   bob.address
  // );

  // aliceSemaphoreVotingInstance = await ethers.getContractAt(
  //   "SemaphoreVotingFacet",
  //   alice.address
  // );

  // bobSemaphoreVotingInstance = await ethers.getContractAt(
  //   "SemaphoreVotingFacet",
  //   alice.address
  // );

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
