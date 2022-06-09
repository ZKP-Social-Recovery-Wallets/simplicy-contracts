import { Contract } from "ethers";
import { task, types } from "hardhat/config";

task("deploy:diamond", "Deploy Diamond contract")
  .addOptionalParam<boolean>("logs", "Print the logs", true, types.boolean)
  // .addParam("diamond", "Diamond", undefined, types.string)
  .addParam(
    "owner",
    "The owner of the Diamond contract",
    undefined,
    types.string
  )
  .setAction(
    async ({ logs, diamond, owner }, { ethers }): Promise<Contract> => {
      const ContractFactory = await ethers.getContractFactory("Diamond");

      const contract = await ContractFactory.deploy(owner);

      await contract.deployed();

      logs &&
        console.log(
          `Diamond contract has been deployed to: ${contract.address}`
        );

      return contract;
    }
  );
