import fs from "fs";
import { run, hardhatArguments, ethers } from "hardhat";
import { Signer } from "ethers";

const FacetCutAction = {
  Add: 0,
  Replace: 1,
  Remove: 2,
};

function getSignatures(contract: any) {
  return Object.keys(contract.interface.functions);
}

function getSelectors(contract: any): string[] {
  const signatures = getSignatures(contract);
  const selectors = contract.interface.getSighash(signatures[0]);
  return selectors;
}

async function main() {
  const deployedContracts: { name: string; address: string }[] = [];

  // Deploy verifiers.
  for (let treeDepth = 16; treeDepth <= 32; treeDepth++) {
    const { address } = await run("deploy:verifier", { depth: treeDepth });

    deployedContracts.push({
      name: `Verifier${treeDepth}`,
      address,
    });
  }

  // Accounts
  let signers: Signer[];
  let accounts: string[];
  signers = await ethers.getSigners();
  accounts = await Promise.all(
    signers.map((signer: Signer) => signer.getAddress())
  );

  // Deploy Facet.
  const semaphoreGroupsFacet = await run("deploy:facet", {
    facet: "SemaphoreGroupsFacet",
  });

  console.log(
    "semaphoreGroupsFacet signatures",
    getSignatures(semaphoreGroupsFacet)
  );

  deployedContracts.push({
    name: `SemaphoreGroupsFacet`,
    address: semaphoreGroupsFacet.address,
  });

  // Deploy Diamond.
  const diamond = await run("deploy:diamond", {
    // diamond: "Diamond",
    owner: accounts[0],
  });

  deployedContracts.push({
    name: `Diamond`,
    address: diamond.address,
  });

  // Add Facets to diamondCut
  const diamondCut = [];

  diamondCut.push([
    semaphoreGroupsFacet.address,
    FacetCutAction.Add,
    semaphoreGroupsFacet.interface.getSighash(
      getSelectors(semaphoreGroupsFacet)
    ),
  ]);

  const InitDiamond = await ethers.getContractFactory("InitDiamond");
  const initDiamond = await InitDiamond.deploy();
  await initDiamond.deployed();
  console.log("initDiamond", initDiamond.address);

  let functionCall = "0x";

  const diamondCutFacet = await ethers.getContractAt(
    "DiamondCutFacet",
    diamond.address
  );

  const tx = await diamondCutFacet.diamondCut(
    diamondCut,
    initDiamond.address,
    "0x",
    {}
  );

  const result = await tx.wait();
  if (!result.status) {
    console.log(
      "TRANSACTION FAILED!!! -------------------------------------------"
    );
    console.log("See block explorer app for details.");
  }
  console.log("DiamondCut success!");
  console.log("Transaction hash:" + tx.hash);

  fs.writeFileSync(
    `./deployed-contracts/${hardhatArguments.network}.json`,
    JSON.stringify(deployedContracts, null, 4)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
