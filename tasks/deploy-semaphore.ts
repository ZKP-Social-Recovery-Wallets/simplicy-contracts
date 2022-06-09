import { Contract } from "ethers";
import { task, types } from "hardhat/config";

task("deploy:semaphore", "Deploy a Semaphore contract")
  .addOptionalParam<boolean>("logs", "Print the logs", true, types.boolean)
  .setAction(async ({ logs }, { ethers }): Promise<Contract> => {
    const ContractFactory = await ethers.getContractFactory("SemaphoreFacet");

    const contract = await ContractFactory.deploy();

    await contract.deployed();

    logs &&
      console.log(
        `Semaphore contract has been deployed to: ${contract.address}`
      );

    return contract;
  });
