// import { Identity } from "@semaphore-protocol/identity";
// import {
//   createMerkleProof,
//   createMerkleTree,
//   FullProof,
//   generateProof,
//   packToSolidityProof,
//   SolidityProof,
// } from "@semaphore-protocol/proof";
// import { expect } from "chai";
// import { constants, Signer, utils } from "ethers";
// import { ethers, run } from "hardhat";
// import { GuardianMock as GuardianContract } from "../typechain/GuardianMock";
// import { config } from "../package.json";
// import { createIdentityCommitments } from "./utils";
// import { ContractType } from "hardhat/internal/hardhat-network/stack-traces/model";

// const depth = Number(process.env.TREE_DEPTH);

// describe("Guardian", () => {
//   let contract: GuardianContract;
//   let signers: Signer[];
//   let accounts: string[];

//   const depth = Number(process.env.TREE_DEPTH);
//   const unsupportedDepth = depth + 1;
//   const groupId = 1;
//   const anotherGroupId = 2;
//   const members = createIdentityCommitments(3);

//   const wasmFilePath = `${config.paths.build["snark-artifacts"]}/semaphore.wasm`;
//   const zkeyFilePath = `${config.paths.build["snark-artifacts"]}/semaphore.zkey`;

//   before(async () => {
//     const { address: verifierAddress } = await run("deploy:verifier", {
//       logs: false,
//       depth,
//     });

//     console.log(`Verifier address: ${verifierAddress}`);

//     contract = await run("deploy:guardian", {
//       logs: false,
//       verifiers: [{ merkleTreeDepth: depth, contractAddress: verifierAddress }],
//     });

//     signers = await ethers.getSigners();

//     accounts = await Promise.all(
//       signers.map((signer: Signer) => signer.getAddress())
//     );
//   });

//   describe("# after deployment", () => {
//     it("Should have owner", async () => {
//       expect(await contract.owner()).to.equal(accounts[0]);
//     });
//   });

//   describe("# createGroup", () => {
//     it("Should not create a group if the tree depth is not supported", async () => {
//       console.log(await contract.getGroupAdmin(groupId));
//       const transaction = contract.createGroup(
//         groupId,
//         unsupportedDepth,
//         0,
//         accounts[0]
//       );

//       await expect(transaction).to.be.revertedWith(
//         "Semaphore: tree depth is not supported"
//       );
//     });
//     it("Should create a group", async () => {
//       const transaction = contract.createGroup(groupId, depth, 0, accounts[0]);

//       await expect(transaction)
//         .to.emit(contract, "GroupCreated")
//         .withArgs(groupId, depth, 0);
//       await expect(transaction)
//         .to.emit(contract, "GroupAdminUpdated")
//         .withArgs(groupId, constants.AddressZero, accounts[0]);
//     });
//   });
//   describe("# updateGroupAdmin", () => {
//     it("Revert update a group admin if the caller is not the group admin", async () => {
//       const transaction = contract
//         .connect(signers[1])
//         .updateGroupAdmin(groupId, accounts[1]);

//       await expect(transaction).to.be.revertedWith(
//         "Semaphore: caller is not the group admin"
//       );
//     });

//     it("Should update the group admin", async () => {
//       const transaction = contract.updateGroupAdmin(groupId, accounts[1]);

//       await expect(transaction)
//         .to.emit(contract, "GroupAdminUpdated")
//         .withArgs(groupId, accounts[0], accounts[1]);
//     });
//   });
//   describe("# addMembers", () => {
//     it("Revert when add a member if the caller is not the group admin", async () => {
//       const member = BigInt(2);

//       const transaction = contract.addMembers(groupId, [member]);

//       await expect(transaction).to.be.revertedWith(
//         "Semaphore: caller is not the group admin"
//       );
//     });
//     it("Should add a new member in an existing group", async () => {
//       const transaction = await contract
//         .connect(signers[1])
//         .addMembers(groupId, members);
//       const receipt = await transaction.wait();

//       if (receipt.events) {
//         for (let i = 0; i < receipt.events.length; i++) {
//           await expect(transaction)
//             .to.emit(contract, "MemberAdded")
//             .withArgs(groupId, members[i], 0);
//         }
//       }
//     });
//   });
//   describe("# removeMember", () => {
//     it("Revert when remove a member if the caller is not the group admin", async () => {
//       const transaction = contract
//         .connect(signers[1])
//         .removeMember(groupId, members[0], [0, 1], [0, 1]);

//       await expect(transaction).to.be.revertedWith(
//         "Semaphore: caller is not the group admin"
//       );
//     });

//     it("Should remove a member from an existing group", async () => {
//       const groupId = 100;
//       const tree = createMerkleTree(depth, BigInt(0), [
//         BigInt(1),
//         BigInt(2),
//         BigInt(3),
//       ]);

//       tree.delete(0);

//       await contract.createGroup(groupId, depth, 0, accounts[0]);
//       await contract.addMembers(groupId, [BigInt(1), BigInt(2), BigInt(3)]);

//       const { siblings, pathIndices, root } = tree.createProof(0);
//       console.log("root", root);

//       const transaction = contract.removeMember(
//         groupId,
//         BigInt(1),
//         siblings.map((s) => s[0]),
//         pathIndices
//       );

//       await expect(transaction)
//         .to.emit(contract, "MemberRemoved")
//         .withArgs(groupId, BigInt(1), root);
//     });
//   });
// });
