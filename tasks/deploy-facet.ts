import { Contract } from "ethers";
import { task, types } from "hardhat/config";

task("deploy:facet", "Deploy Facets contract")
  .addOptionalParam<boolean>("logs", "Print the logs", true, types.boolean)
  .addParam("facet", "Facet", undefined, types.string)
  .setAction(async ({ logs, facet }, { ethers }): Promise<Contract> => {
    let ContractFactory;
    if (facet === "SemaphoreGroupsFacet") {
      const PoseidonT3 = await ethers.getContractFactory("PoseidonT3");
      const library = await PoseidonT3.deploy();
      await library.deployed();
      logs &&
        console.log(
          `PoseidonT3 contract has been deployed to: ${library.address}`
        );

      ContractFactory = await ethers.getContractFactory(facet, {
        libraries: {
          PoseidonT3: library.address,
        },
      });
    } else {
      ContractFactory = await ethers.getContractFactory(facet);
    }

    const contract = await ContractFactory.deploy();

    await contract.deployed();

    logs &&
      console.log(
        `${facet} contract has been deployed to: ${contract.address}`
      );

    return contract;
  });
