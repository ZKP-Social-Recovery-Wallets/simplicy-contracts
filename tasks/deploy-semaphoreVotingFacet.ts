import { Contract } from "ethers";
import { task, types } from "hardhat/config";

task("deploy:semaphoreVotingFacet", "Deploy a Semaphore Voting Facet")
  .addOptionalParam<boolean>("logs", "Print the logs", true, types.boolean)
  .setAction(async ({ logs }, { ethers }): Promise<Contract> => {
    const ContractFactory = await ethers.getContractFactory(
      "SemaphoreVotingFacet"
    );

    const contract = await ContractFactory.deploy();

    await contract.deployed();

    logs &&
      console.log(
        `SemaphoreVotingFacet contract has been deployed to: ${contract.address}`
      );

    return contract;
  });
