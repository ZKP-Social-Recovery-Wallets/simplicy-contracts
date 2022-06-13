import { Contract } from "ethers";
import { task, types } from "hardhat/config";

task("deploy:walletFactory:diamond", "Deploy wallet factory Diamond contract")
  .addOptionalParam<boolean>("logs", "Print the logs", true, types.boolean)
  .setAction(async ({ logs }, { ethers }): Promise<Contract> => {
    const ContractFactory = await ethers.getContractFactory(
      "WalletFactoryDiamond"
    );

    const diamond = await ContractFactory.deploy();

    await diamond.deployed();

    logs &&
      console.log(
        `WalletFactoryDiamond contract has been deployed to: ${diamond.address}`
      );

    return diamond;
  });
