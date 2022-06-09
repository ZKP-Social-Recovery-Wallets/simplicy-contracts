import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, run } from "hardhat";
import {
  SimplicyWalletDiamond,
  SimplicyWalletDiamond__factory,
} from "@solidstate/typechain-types";
import { createIdentityCommitments } from "../utils";

describe.only("SemaphoreGroupsFacet", function () {
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

    this.facet = await run("deploy:facet", {
      facet: "SemaphoreGroupsFacet",
      log: false,
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
        await instance
          .connect(this.deployer)
          .createGroup(groupId, depth, 0, groupAdmin.address);
      });
      it("should add a new member in an existing group", async () => {
        const transaction = await instance
          .connect(groupAdmin)
          .addMembers(groupId, members);
        for (let i = 0; i < members.length; i++) {
          await expect(transaction)
            .to.emit(instance, "MemberAdded")
            .withArgs(groupId, members[i], "0");
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
  });
});
