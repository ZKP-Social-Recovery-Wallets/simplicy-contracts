import { Contract } from "ethers";
import { task, types } from "hardhat/config";

let ContractFactory;
task("deploy:SemaphoreGroupsFacet", "Deploy SemaphoreGroupsFacet contract")
  .addOptionalParam<boolean>("logs", "Print the logs", true, types.boolean)
  .addParam("library", "PoseidonT3 address", undefined, types.string)
  .setAction(async ({ logs, library }, { ethers }): Promise<Contract> => {
    ContractFactory = await ethers.getContractFactory("SemaphoreGroupsFacet", {
      libraries: {
        PoseidonT3: library,
      },
    });

    const contract = await ContractFactory.deploy();

    await contract.deployed();

    logs &&
      console.log(
        `SemaphoreGroupsFacet contract has been deployed to: ${contract.address}`
      );

    return contract;
  });
