import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { createMerkleTree } from "@semaphore-protocol/proof";
import { describeFilter } from "@solidstate/library";
import { IGuardian } from "@solidstate/typechain-types";
import { expect } from "chai";
import { BigNumber, ContractTransaction } from "ethers";
import { ethers } from "hardhat";

type AddGuardianDTO = {
  hashId: BigNumber;
  identityCommitment: string;
  validUntil: number;
};

type RemoveGuardianDTO = {
  hashId: BigNumber;
  identityCommitment: string;
  pendingPeriod: number;
  proofSiblings: BigNumber[];
  proofPathIndices: number[];
};

export interface GuardianBehaviorArgs {
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
  getGuardians: (
    groupId: BigNumber,
    includePendingAddition: boolean
  ) => Promise<IGuardian[]>;
  numGuardians: (
    groupId: BigNumber,
    includePendingAddition: boolean
  ) => Promise<BigNumber>;
  setInitialGuardians: (
    groupId: BigNumber,
    guardians: AddGuardianDTO[]
  ) => Promise<ContractTransaction>;
  addGuardian: (
    groupId: BigNumber,
    hashId: BigNumber,
    identityCommitment: string,
    validUntil: number
  ) => Promise<ContractTransaction>;
  removeGuardian: (
    groupId: BigNumber,
    hashId: BigNumber,
    identityCommitment: string,
    validUntil: Number,
    proofSiblings: BigNumber[],
    proofPathIndices: number[]
  ) => Promise<ContractTransaction>;
  removeGuardians: (
    groupId: BigNumber,
    guardians: RemoveGuardianDTO[]
  ) => Promise<ContractTransaction>;
  cancelPendingGuardians: (groupId: BigNumber) => Promise<ContractTransaction>;
}

export function describeBehaviorOfGuardian(
  deploy: () => Promise<IGuardian>,
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
  }: GuardianBehaviorArgs,
  skips?: string[]
) {
  const describe = describeFilter(skips);

  describe("::Guardian", function () {
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
    let instance: IGuardian;

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
  });
}
