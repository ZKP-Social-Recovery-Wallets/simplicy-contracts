import { Contract } from "ethers";
import { task, types } from "hardhat/config";

task("deploy:guardian", "Deploy a GuardianBaseMock contract")
  .addOptionalParam<boolean>("logs", "Print the logs", true, types.boolean)
  .addParam(
    "verifiers",
    "Tree depths and verifier addresses",
    undefined,
    types.json
  )
  .setAction(async ({ logs, verifiers }, { ethers }): Promise<Contract> => {
    const PoseidonT3 = await ethers.getContractFactory("PoseidonT3");

    const poseidonT3 = await PoseidonT3.deploy();

    await poseidonT3.deployed();

    logs &&
      console.log(
        `PoseidonT3 contract has been deployed to: ${poseidonT3.address}`
      );

    const IncrementalBinaryTree = await ethers.getContractFactory(
      "IncrementalBinaryTree",
      { libraries: { PoseidonT3: poseidonT3.address } }
    );

    const incrementalBinaryTree = await IncrementalBinaryTree.deploy();

    await incrementalBinaryTree.deployed();

    logs &&
      console.log(
        `IncrementalBinaryTree contract has been deployed to: ${incrementalBinaryTree.address}`
      );

    const depth = Number(process.env.TREE_DEPTH);
    const groupId = 1;

    const ContractFactory = await ethers.getContractFactory("GuardianMock", {
      libraries: {
        IncrementalBinaryTree: incrementalBinaryTree.address,
      },
    });
    const contract = await ContractFactory.deploy(verifiers, groupId, depth, 0);

    await contract.deployed();

    logs &&
      console.log(
        `Guardian contract has been deployed to: ${contract.address}`
      );

    return contract;
  });
