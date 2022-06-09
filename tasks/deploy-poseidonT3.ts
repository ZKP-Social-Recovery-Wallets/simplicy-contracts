import { Contract } from "ethers";
import { task, types } from "hardhat/config";
import { poseidon_gencontract as poseidonContract } from "circomlibjs";

task("deploy:poseidonT3", "Deploy PoseidonT3 contract")
  .addOptionalParam<boolean>("logs", "Print the logs", true, types.boolean)
  .setAction(async ({ logs }, { ethers }): Promise<Contract> => {
    const poseidonT3ABI = poseidonContract.generateABI(2);
    const poseidonT3Bytecode = poseidonContract.createCode(2);

    const [signer] = await ethers.getSigners();

    const PoseidonLibT3Factory = new ethers.ContractFactory(
      poseidonT3ABI,
      poseidonT3Bytecode,
      signer
    );
    const poseidonT3Lib = await PoseidonLibT3Factory.deploy();

    await poseidonT3Lib.deployed();
    logs &&
      console.log(
        `PoseidonT3 contract has been deployed to: ${poseidonT3Lib.address}`
      );

    return poseidonT3Lib;
  });
