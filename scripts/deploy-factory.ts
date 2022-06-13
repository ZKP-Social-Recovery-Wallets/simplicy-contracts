import fs from "fs";
import { run, hardhatArguments, ethers } from "hardhat";

async function main() {
  let facetCuts: any[] = [];

  const deployedContracts: { name: string; address: string }[] = [];
  const transactionHash: { name: string; hash: string }[] = [];

  // Deploy diamond
  const diamond = await run("deploy:walletFactory:diamond", {
    logs: true,
  });

  deployedContracts.push({
    name: "WalletFactoryDiamond",
    address: diamond.address,
  });

  const facets = await run("deploy:facets", {
    facets: [{ name: "WalletFactoryFacet" }],
    logs: true,
  });

  for (let i = 0; i < facets.length; i++) {
    deployedContracts.push({
      name: facets[i].name,
      address: facets[i].contract.address,
    });

    facetCuts = [
      {
        target: facets[0].address,
        action: 0,
        selectors: Object.keys(facets[0].contract.interface.functions).map(
          (fn) => facets[0].contract.interface.getSighash(fn)
        ),
      },
    ];
  }

  // do the cut for alice
  await diamond.diamondCut(facetCuts, ethers.constants.AddressZero, "0x");

  const instance = await ethers.getContractAt(
    "WalletFactoryFacet",
    diamond.address
  );
  // test instance
  console.log(await instance.walletFactoryFacetVersion());

  fs.writeFileSync(
    `./deployed-contracts/factory/${hardhatArguments.network}.json`,
    JSON.stringify(deployedContracts, null, 4)
  );

  fs.appendFileSync(
    `./deployed-contracts/factory/${hardhatArguments.network}.json`,
    JSON.stringify(transactionHash, null, 4)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
