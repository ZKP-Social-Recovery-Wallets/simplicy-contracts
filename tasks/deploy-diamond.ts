import { Contract } from "ethers";
import { task, types } from "hardhat/config";

task("deploy:diamond", "Deploy diamond contract")
  .addOptionalParam<boolean>("logs", "Print the logs", true, types.boolean)
  .addOptionalParam(
    "account",
    "The account to deploy the contract from",
    undefined,
    types.string
  )
  .addParam("name", "Diamond name", undefined, types.string)
  .setAction(async ({ logs, account, name }, { ethers }): Promise<Contract> => {
    const [deployer, aliceWallet, bobWallet] = await ethers.getSigners();

    let deployerAccount;
    if (account === "alice") {
      deployerAccount = aliceWallet;
    } else if (account === "bob") {
      deployerAccount = bobWallet;
    } else {
      deployerAccount = deployer;
    }

    logs && console.log("deployAccount:", deployerAccount.address);
    const ContractFactory = await ethers.getContractFactory(name);

    const diamond = await ContractFactory.deploy();

    await diamond.deployed();

    logs &&
      console.log(`${name} contract has been deployed to: ${diamond.address}`);

    return diamond;
  });
