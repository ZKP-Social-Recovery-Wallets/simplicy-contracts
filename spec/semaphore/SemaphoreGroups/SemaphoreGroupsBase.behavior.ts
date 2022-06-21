import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { createMerkleTree } from "@semaphore-protocol/proof";
import { describeFilter } from "@solidstate/library";
import { ISemaphoreGroupsBase } from "@solidstate/typechain-types";
import { expect } from "chai";
import { BigNumber, ContractTransaction } from "ethers";
import { ethers } from "hardhat";

export interface SemaphoreGroupsBaseBehaviorArgs {
  getOwner: () => Promise<SignerWithAddress>;
  getNonOwner: () => Promise<SignerWithAddress>;
  getGroupAdmin: () => Promise<SignerWithAddress>;
  getNonGroupAdmin: () => Promise<SignerWithAddress>;
  getAnotherGroupAdmin: () => Promise<SignerWithAddress>;
  getGroupId: () => Promise<BigNumber>;
  getNonExistingGroupId: () => Promise<BigNumber>;
  getDepth: () => Promise<Number>;
  getZero: () => Promise<BigNumber>;
  getMembers: () => Promise<bigint[]>;
  creategroup: (
    groupId: BigNumber,
    depth: Number,
    zeroValue: BigNumber,
    address: string
  ) => Promise<ContractTransaction>;

  updateGroupAdmin: (
    groupId: BigNumber,
    address: string
  ) => Promise<ContractTransaction>;

  addMembers: (
    groupId: BigNumber,
    identityCommitments: BigNumber[]
  ) => Promise<ContractTransaction>;

  removeMember: (
    groupId: BigNumber,
    identityCommitment: string,
    proofSiblings: BigNumber[],
    proofPathIndices: number[]
  ) => Promise<ContractTransaction>;
}

export function describeBehaviorOfSemaphoreGroupsBase(
  deploy: () => Promise<ISemaphoreGroupsBase>,
  {
    getOwner,
    getNonOwner,
    getGroupAdmin,
    getNonGroupAdmin,
    getAnotherGroupAdmin,
    getGroupId,
    getNonExistingGroupId,
    getDepth,
    getZero,
    getMembers,
    creategroup,
    updateGroupAdmin,
    addMembers,
    removeMember,
  }: SemaphoreGroupsBaseBehaviorArgs,
  skips?: string[]
) {
  const describe = describeFilter(skips);

  describe("::SemaphoreGroupsBase", function () {
    let owner: SignerWithAddress;
    let nonOwner: SignerWithAddress;
    let groupAdmin: SignerWithAddress;
    let nonGroupAdmin: SignerWithAddress;
    let anotherGroupAdmin: SignerWithAddress;
    let groupId: BigNumber;
    let nonExistingGroupId: BigNumber;
    let depth: Number;
    let zero: BigNumber;
    let members: bigint[];
    let instance: ISemaphoreGroupsBase;

    beforeEach(async function () {
      instance = await deploy();
      owner = await getOwner();
      nonOwner = await getNonOwner();
      groupAdmin = await getGroupAdmin();
      nonGroupAdmin = await getNonGroupAdmin();
      anotherGroupAdmin = await getAnotherGroupAdmin();
      groupId = await getGroupId();
      nonExistingGroupId = await getNonExistingGroupId();
      depth = await getDepth();
      zero = await getZero();
      members = await getMembers();
    });
    describe("#getGroupAdmin(uint256)", function () {
      it("should retun zero address", async function () {
        expect(
          await instance.callStatic["getGroupAdmin(uint256)"](groupId)
        ).to.equal(ethers.constants.AddressZero);
      });
      it("should retun groupAdmin address", async function () {
        await instance
          .connect(owner)
          ["createGroup(uint256,uint8,uint256,address)"](
            groupId,
            Number(depth),
            zero,
            groupAdmin.address
          );

        expect(
          await instance.callStatic["getGroupAdmin(uint256)"](groupId)
        ).to.equal(groupAdmin.address);
      });
    });
    describe("#updateGroupAdmin(uint256,address)", function () {
      beforeEach(async function () {
        await instance
          .connect(owner)
          ["createGroup(uint256,uint8,uint256,address)"](
            groupId,
            Number(depth),
            zero,
            groupAdmin.address
          );
      });
      it("should emit event", async function () {
        await expect(
          instance
            .connect(groupAdmin)
            ["updateGroupAdmin(uint256,address)"](
              groupId,
              anotherGroupAdmin.address
            )
        )
          .to.emit(instance, "GroupAdminUpdated")
          .withArgs(groupId, groupAdmin.address, anotherGroupAdmin.address);
      });
      describe("reverts if", function () {
        it("non-groupAdmin", async function () {
          await expect(
            instance
              .connect(nonGroupAdmin)
              ["updateGroupAdmin(uint256,address)"](
                groupId,
                anotherGroupAdmin.address
              )
          ).to.be.revertedWith("SemaphoreGroupsBase: SENDER_NON_GROUP_ADMIN");
        });
        it("groupId not-exist", async function () {
          await expect(
            instance
              .connect(owner)
              ["updateGroupAdmin(uint256,address)"](
                nonExistingGroupId,
                groupAdmin.address
              )
          ).to.be.revertedWith("SemaphoreGroupsBase: GROUP_ID_NOT_EXIST");
        });
      });
    });
    describe("#createGroup(uint256,uint8,uint256,address)", function () {
      it("should emits events", async function () {
        const transaction = await instance
          .connect(owner)
          ["createGroup(uint256,uint8,uint256,address)"](
            groupId,
            Number(depth),
            zero,
            groupAdmin.address
          );

        await expect(transaction)
          .to.emit(instance, "GroupCreated")
          .withArgs(groupId, depth, zero);

        expect(transaction)
          .to.emit(instance, "GroupAdminUpdated")
          .withArgs(groupId, ethers.constants.AddressZero, groupAdmin.address);
      });
      describe("reverts if", function () {
        it("zero address", async function () {
          await expect(
            instance
              .connect(owner)
              ["createGroup(uint256,uint8,uint256,address)"](
                groupId,
                Number(depth),
                zero,
                ethers.constants.AddressZero
              )
          ).to.be.revertedWith("SemaphoreGroupsBase: ADMIN_ZERO_ADDRESS");
        });
        it("exist", async function () {
          await instance
            .connect(owner)
            ["createGroup(uint256,uint8,uint256,address)"](
              groupId,
              Number(depth),
              zero,
              groupAdmin.address
            );

          await expect(
            instance
              .connect(owner)
              ["createGroup(uint256,uint8,uint256,address)"](
                groupId,
                Number(depth),
                zero,
                groupAdmin.address
              )
          ).to.be.revertedWith("SemaphoreGroupsBase: GROUP_ID_EXISTS");
        });
      });
    });
    describe("#createGroup(uint256,uint8,uint256,address)", () => {
      beforeEach(async function () {
        await instance
          .connect(owner)
          ["createGroup(uint256,uint8,uint256,address)"](
            groupId,
            Number(depth),
            zero,
            groupAdmin.address
          );
      });
      describe("#addMembers(uint256,uint256[])", () => {
        it("should emits events", async function () {
          const transaction = await instance
            .connect(groupAdmin)
            ["addMembers(uint256,uint256[])"](groupId, members);
          const root = [
            "18951329906296061785889394467312334959162736293275411745101070722914184798221",
            "18265569239387019447615006583056890113282443686370447449782395427262311533264",
            "10984560832658664796615188769057321951156990771630419931317114687214058410144",
          ];
          for (let i = 0; i < members.length; i++) {
            await expect(transaction)
              .to.emit(instance, "MemberAdded")
              .withArgs(groupId, members[i], root[i]);
          }
        });
        describe("reverts if", function () {
          it("non-groupAdmin", async function () {
            await expect(
              instance
                .connect(nonGroupAdmin)
                ["addMembers(uint256,uint256[])"](groupId, members)
            ).to.be.revertedWith("SemaphoreGroupsBase: SENDER_NON_GROUP_ADMIN");
          });
          it("groupId not-exist", async function () {
            await expect(
              instance
                .connect(owner)
                ["addMembers(uint256,uint256[])"](nonExistingGroupId, members)
            ).to.be.revertedWith("SemaphoreGroupsBase: GROUP_ID_NOT_EXIST");
          });
        });
      });
      describe("#addMember(uint256,uint256)", () => {
        it("should emit event", async function () {
          const transaction = await instance
            .connect(groupAdmin)
            ["addMember(uint256,uint256)"](groupId, members[0]);
          const root = [
            "18951329906296061785889394467312334959162736293275411745101070722914184798221",
          ];
          await expect(transaction)
            .to.emit(instance, "MemberAdded")
            .withArgs(groupId, members[0], root[0]);
        });
        describe("reverts if", function () {
          it("non-groupAdmin", async function () {
            await expect(
              instance
                .connect(nonGroupAdmin)
                ["addMember(uint256,uint256)"](groupId, members[0])
            ).to.be.revertedWith("SemaphoreGroupsBase: SENDER_NON_GROUP_ADMIN");
          });
          it("groupId not-exist", async function () {
            await expect(
              instance
                .connect(owner)
                ["addMember(uint256,uint256)"](nonExistingGroupId, members[0])
            ).to.be.revertedWith("SemaphoreGroupsBase: GROUP_ID_NOT_EXIST");
          });
        });
      });
      describe("#removeMember(uint256,uint256,uint256[],uint8[])", () => {
        it("should emit event", async function () {
          const tree = createMerkleTree(Number(depth), BigInt(0), [
            BigInt(1),
            BigInt(2),
            BigInt(3),
          ]);
          tree.delete(0);

          await instance
            .connect(groupAdmin)
            ["addMembers(uint256,uint256[])"](groupId, [
              BigInt(1),
              BigInt(2),
              BigInt(3),
            ]);

          const { siblings, pathIndices, root } = tree.createProof(0);

          const transaction = await instance
            .connect(groupAdmin)
            ["removeMember(uint256,uint256,uint256[],uint8[])"](
              groupId,
              BigInt(1),
              siblings.map((s: any) => s[0]),
              pathIndices
            );
          await expect(transaction)
            .to.emit(instance, "MemberRemoved")
            .withArgs(groupId, BigInt(1), root);
        });
        describe("reverts if", function () {
          it("non-groupAdmin", async function () {
            await expect(
              instance
                .connect(nonGroupAdmin)
                ["removeMember(uint256,uint256,uint256[],uint8[])"](
                  groupId,
                  members[0],
                  [0, 1],
                  [0, 1]
                )
            ).to.be.revertedWith("SemaphoreGroupsBase: SENDER_NON_GROUP_ADMIN");
          });
          it("groupId not-exist", async function () {
            await expect(
              instance
                .connect(groupAdmin)
                ["removeMember(uint256,uint256,uint256[],uint8[])"](
                  nonExistingGroupId,
                  members[0],
                  [0, 1],
                  [0, 1]
                )
            ).to.be.revertedWith("SemaphoreGroupsBase: GROUP_ID_NOT_EXIST");
          });
          it("member not-added", async function () {
            const tree = createMerkleTree(Number(depth), BigInt(0), members);
            tree.delete(0);

            const { siblings, pathIndices } = tree.createProof(0);

            await expect(
              instance
                .connect(groupAdmin)
                ["removeMember(uint256,uint256,uint256[],uint8[])"](
                  groupId,
                  members[0],
                  siblings.map((s: any) => s[0]),
                  pathIndices
                )
            ).to.be.revertedWith(
              "IncrementalBinaryTree: leaf is not part of the tree"
            );
          });
        });
      });
    });
  });
}
