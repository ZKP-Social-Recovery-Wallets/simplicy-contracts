import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, run } from "hardhat";
import {
  ISemaphoreGroupsBase,
  SimplicyWalletDiamond,
} from "@solidstate/typechain-types";
import { createIdentityCommitments } from "../utils";
import { describeBehaviorOfSemaphoreGroupsBase } from "@simplicy/spec";
import { BigNumber } from "ethers";

const groupId: BigNumber = ethers.constants.One;
const nonExistingGroupId: BigNumber = ethers.constants.Two;
const depth: Number = Number(process.env.TREE_DEPTH);
const zero: BigNumber = ethers.constants.Zero;
const members: bigint[] = createIdentityCommitments(3);

describe.only("SemaphoreGroupsFacet", function () {
  let owner: SignerWithAddress;
  let nomineeOwner: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  let groupAdmin: SignerWithAddress;
  let nonGroupAdmin: SignerWithAddress;
  let anotherGroupAdmin: SignerWithAddress;
  let diamond: SimplicyWalletDiamond;
  let instance: any | ISemaphoreGroupsBase;
  let facetCuts: any[] = [];

  before(async function () {
    [
      owner,
      nomineeOwner,
      nonOwner,
      groupAdmin,
      nonGroupAdmin,
      anotherGroupAdmin,
    ] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const [deployer] = await ethers.getSigners();
    this.deployer = deployer;
    diamond = await run("deploy:diamond", {
      name: "SimplicyWalletDiamond",
      logs: false,
    });

    const facets = await diamond.callStatic["facets()"]();

    expect(facets).to.have.lengthOf(1);

    const poseidonT3 = await run("deploy:poseidonT3", {
      logs: false,
    });

    const semaphoreGroupsFacet = await run("deploy:semaphoreGroupsFacet", {
      library: poseidonT3.address,
      logs: false,
    });

    facetCuts = [
      {
        target: semaphoreGroupsFacet.address,
        action: 0,
        selectors: Object.keys(
          semaphoreGroupsFacet.contract.interface.functions
        ).map((fn) => semaphoreGroupsFacet.contract.interface.getSighash(fn)),
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
      expect(await diamond.version()).to.equal("0.0.1");
    });
  });
  describeBehaviorOfSemaphoreGroupsBase(async () => instance, {
    getOwner: async () => owner,
    getNonOwner: async () => nonOwner,
    getGroupAdmin: async () => groupAdmin,
    getNonGroupAdmin: async () => nonGroupAdmin,
    getAnotherGroupAdmin: async () => anotherGroupAdmin,
    getGroupId: async () => groupId,
    getNonExistingGroupId: async () => nonExistingGroupId,
    getDepth: async () => depth,
    getZero: async () => zero,
    getMembers: async () => members,
    creategroup: (
      groupId: BigNumber,
      depth: Number,
      zeroValue: BigNumber,
      address: string
    ) => instance.createGroup(groupId, depth, zeroValue, address),
    updateGroupAdmin: (groupId: BigNumber, address: string) =>
      instance.updateGroupAdmin(groupId, address),
    addMembers: (groupId: BigNumber, identityCommitments: BigNumber[]) =>
      instance.addMembers(groupId, identityCommitments),
    removeMember: (
      groupId: BigNumber,
      identityCommitment: string,
      proofSiblings: BigNumber[],
      proofPathIndices: number[]
    ) =>
      instance.removeMember(
        groupId,
        identityCommitment,
        proofSiblings,
        proofPathIndices
      ),
  });
  describe("#createGroup(uint256,uint8,uint256,address)", function () {
    describe("reverts if", function () {
      it("non-owner", async function () {
        await expect(
          instance
            .connect(nonOwner)
            ["createGroup(uint256,uint8,uint256,address)"](
              groupId,
              depth,
              zero,
              groupAdmin.address
            )
        ).to.be.revertedWith("Ownable: sender must be owner");
      });
    });
  });
});
