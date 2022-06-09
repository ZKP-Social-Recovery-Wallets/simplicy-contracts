import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { createMerkleTree } from "@semaphore-protocol/proof";
import { expect } from "chai";
import { ethers, run } from "hardhat";
import {
  SimplicyWalletDiamond,
  SimplicyWalletDiamond__factory,
} from "@solidstate/typechain-types";
import { createIdentityCommitments } from "../utils";

describe("SemaphoreGroupsFacet", function () {
  let owner: SignerWithAddress;
  let getNomineeOwner: SignerWithAddress;
  let getNonOwner: SignerWithAddress;
  let groupAdmin: SignerWithAddress;
  let nonGroupAdmin: SignerWithAddress;
  let diamond: SimplicyWalletDiamond;
  let instance: any;
  let facetCuts: any[] = [];

  const depth = Number(process.env.TREE_DEPTH);
  const groupId = 1;
  const members = createIdentityCommitments(3);

  before(async function () {
    [owner, getNomineeOwner, getNonOwner, groupAdmin, nonGroupAdmin] =
      await ethers.getSigners();
  });

  beforeEach(async function () {
    const [deployer] = await ethers.getSigners();
    this.deployer = deployer;
    diamond = await new SimplicyWalletDiamond__factory(deployer).deploy();

    const facets = await diamond.callStatic["facets()"]();

    expect(facets).to.have.lengthOf(1);

    this.libary = await run("deploy:poseidonT3", {
      logs: false,
    });

    this.facet = await run("deploy:SemaphoreGroupsFacet", {
      library: this.libary.address,
      logs: false,
    });

    facetCuts = [
      {
        target: this.facet.address,
        action: 0,
        selectors: Object.keys(this.facet.interface.functions).map((fn) =>
          this.facet.interface.getSighash(fn)
        ),
      },
    ];

    //do the cut
    await diamond
      .connect(deployer)
      .diamondCut(facetCuts, ethers.constants.AddressZero, "0x");

    instance = await ethers.getContractAt(
      "SemaphoreGroupsFacet",
      diamond.address
    );
  });

  describe("::SimplicyWalletDiamond", function () {
    it("can call functions through diamond address", async function () {
      expect(await diamond.owner()).to.equal(this.deployer.address);
    });
  });
  describe("::SemaphoreGroupsFacet", function () {
    describe("#createGroup", function () {
      it("should create group", async function () {
        const transaction = await instance
          .connect(this.deployer)
          .createGroup(groupId, depth, 0, owner.address);

        expect(transaction)
          .to.emit(instance, "GroupCreated")
          .withArgs(1, 20, 0);

        expect(transaction)
          .to.emit(instance, "GroupAdminUpdated")
          .withArgs(1, "0x", owner.address);
      });
      describe("reverts if", function () {
        it("non-owner", async function () {
          await expect(
            instance
              .connect(getNonOwner)
              .createGroup(groupId, depth, 0, owner.address)
          ).to.be.revertedWith("Ownable: sender must be owner");
        });
      });
    });
    describe("#updateGroupAdmin", function () {
      beforeEach(async function () {
        await instance
          .connect(this.deployer)
          .createGroup(groupId, depth, 0, owner.address);
      });
      it("should update the group admin", async () => {
        const transaction = instance
          .connect(owner)
          .updateGroupAdmin(groupId, groupAdmin.address);

        await expect(transaction)
          .to.emit(instance, "GroupAdminUpdated")
          .withArgs(groupId, owner.address, groupAdmin.address);
      });
      describe("reverts if", function () {
        it("the caller is not the group admin", async function () {
          await expect(
            instance
              .connect(nonGroupAdmin)
              .updateGroupAdmin(groupId, groupAdmin.address)
          ).to.be.revertedWith("SemaphoreGroup: caller is not the group admin");
        });
      });
    });
    describe("#addMember", () => {
      beforeEach(async function () {
        const transaction = await instance
          .connect(this.deployer)
          .createGroup(groupId, depth, 0, groupAdmin.address);

        expect(transaction)
          .to.emit(instance, "GroupAdminUpdated")
          .withArgs(1, "0x", groupAdmin.address);
      });
      it("should add a new member in an existing group", async () => {
        // TODO: how to check the root?
        // const tree = createMerkleTree(depth, BigInt(0), members);
        // tree.delete(0);
        // // const { siblings, pathIndices, root } = tree.createProof(0);
        // console.log("tree", tree);

        const transaction = await instance
          .connect(groupAdmin)
          .addMembers(groupId, members);
        for (let i = 0; i < members.length; i++) {
          const root = [
            "18951329906296061785889394467312334959162736293275411745101070722914184798221",
            "18265569239387019447615006583056890113282443686370447449782395427262311533264",
            "10984560832658664796615188769057321951156990771630419931317114687214058410144",
          ];
          await expect(transaction)
            .to.emit(instance, "MemberAdded")
            .withArgs(groupId, members[i], root[i]);
        }
      });
      describe("reverts if", function () {
        it("the caller is not the group admin", async function () {
          await expect(
            instance.connect(nonGroupAdmin).addMembers(groupId, members)
          ).to.be.revertedWith("SemaphoreGroup: caller is not the group admin");
        });
      });
    });
    describe("#removeMember", () => {
      it("Should remove a member from an existing group", async () => {
        const groupId = 100;
        const tree = createMerkleTree(depth, BigInt(0), [
          BigInt(1),
          BigInt(2),
          BigInt(3),
        ]);

        tree.delete(0);

        await instance
          .connect(owner)
          .createGroup(groupId, depth, 0, groupAdmin.address);
        await instance
          .connect(groupAdmin)
          .addMembers(groupId, [BigInt(1), BigInt(2), BigInt(3)]);
        const { siblings, pathIndices, root } = tree.createProof(0);

        const transaction = await instance.connect(groupAdmin).removeMember(
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
        it("the member if the caller is not the group admin", async () => {
          const transaction = instance
            .connect(nonGroupAdmin)
            .removeMember(groupId, members[0], [0, 1], [0, 1]);

          await expect(transaction).to.be.revertedWith(
            "SemaphoreGroup: caller is not the group admin"
          );
        });
      });
    });
  });
});
