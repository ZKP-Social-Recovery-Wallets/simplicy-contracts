import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { describeBehaviorOfRecovery } from "@solidstate/spec";
import { RecoveryMock, RecoveryMock__factory } from "@simplicy/typechain-types";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { createIdentityCommitments } from "../utils";

const groupId: BigNumber = ethers.constants.One;
const depth: Number = Number(process.env.TREE_DEPTH);
const members: bigint[] = createIdentityCommitments(3);

describe.only("Recovery", function () {
  let owner: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  let nominee: SignerWithAddress;
  let instance: RecoveryMock;

  before(async function () {
    [owner, nonOwner, nominee] = await ethers.getSigners();
  });

  beforeEach(async function () {
    instance = await new RecoveryMock__factory(owner).deploy();
  });

  describeBehaviorOfRecovery(async () => instance, {
    getOwner: async () => owner,
    getNominee: async () => nominee,
    getGroupId: async () => groupId,
    getDepth: async () => depth,
    getMembers: async () => members,
    getRecoveryStatus: () => instance.getRecoveryStatus(),
    getMajority: () => instance.getMajority(),
    getRecoveryNominee: () => instance.getRecoveryNominee(),
    getRecoveryCounter: () => instance.getRecoveryCounter(),
    recover: (
      groupId: BigNumber,
      signal: string,
      nullifierHash: BigNumber,
      externalNullifier: BigNumber,
      proof: BigNumber[],
      newOwner: string
    ) =>
      instance.recover(
        groupId,
        signal,
        nullifierHash,
        externalNullifier,
        proof,
        newOwner
      ),
    resetRecovery: () => instance.resetRecovery(),
  });
  describe("#resetRecovery()", function () {
    describe("reverts if", function () {
      it("non owner", async function () {
        await expect(
          instance.connect(nonOwner).resetRecovery()
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });
  });
});
