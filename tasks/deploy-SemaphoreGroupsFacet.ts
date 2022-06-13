import { Contract } from "ethers";
import { task, types } from "hardhat/config";

type DeployedContract = {
  name: string;
  contract: Contract;
  address: string;
};

task("deploy:semaphoreGroupsFacet", "Deploy SemaphoreGroupsFacet contract")
  .addOptionalParam<boolean>("logs", "Print the logs", true, types.boolean)
  .addParam("library", "PoseidonT3 address", undefined, types.string)
  .setAction(
    async ({ logs, library }, { ethers }): Promise<DeployedContract> => {
      let deployedContract: DeployedContract;

      const ContractFactory = await ethers.getContractFactory(
        "SemaphoreGroupsFacet",
        {
          libraries: {
            PoseidonT3: library,
          },
        }
      );

      const contract = await ContractFactory.deploy();

      await contract.deployed();

      deployedContract = {
        name: "SemaphoreGroupsFacet",
        contract: contract,
        address: contract.address,
      };

      logs &&
        console.log(
          `SemaphoreGroupsFacet contract has been deployed to: ${contract.address}`
        );

      return deployedContract;
    }
  );
