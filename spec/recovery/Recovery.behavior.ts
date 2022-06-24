import { Identity } from "@semaphore-protocol/identity";
import {
  Semaphore,
  SemaphoreFullProof,
  SemaphoreSolidityProof,
} from "@zk-kit/protocols";
import { createMerkleProof } from "@semaphore-protocol/proof";
import { MerkleProof } from "@zk-kit/incremental-merkle-tree";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { describeFilter } from "@solidstate/library";
import { IRecovery } from "@solidstate/typechain-types";
import { expect } from "chai";
import { BigNumber, ContractTransaction } from "ethers";
import { ethers } from "hardhat";
import { config } from "../../package.json";

let signal: string;
let bytes32Signal: string;
const identity = new Identity("0");
const identityCommitment = identity.generateCommitment();
let merkleProof: MerkleProof;
let witness: any;
let fullProof: SemaphoreFullProof;
let solidityProof: SemaphoreSolidityProof;
const wasmFilePath = `${config.paths.build["snark-artifacts"]}/semaphore.wasm`;
const zkeyFilePath = `${config.paths.build["snark-artifacts"]}/semaphore.zkey`;

export interface RecoveryBehaviorArgs {
  getOwner: () => Promise<SignerWithAddress>;
  getNominee: () => Promise<SignerWithAddress>;
  getGroupId: () => Promise<BigNumber>;
  getDepth: () => Promise<Number>;
  getMembers: () => Promise<bigint[]>;
  getRecoveryStatus: () => Promise<number>;
  getMajority: () => Promise<Number>;
  getRecoveryNominee: () => Promise<SignerWithAddress>;
  getRecoveryCounter: () => Promise<number>;
  recover: (
    groupId: BigNumber,
    signal: string,
    nullifierHash: BigNumber,
    externalNullifier: BigNumber,
    proof: BigNumber[],
    newOwner: string
  ) => Promise<ContractTransaction>;
  resetRecovery: () => Promise<ContractTransaction>;
}

export function describeBehaviorOfRecovery(
  deploy: () => Promise<IRecovery>,
  {
    getOwner,
    getNominee,
    getGroupId,
    getDepth,
    getMembers,
    getRecoveryStatus,
    getMajority,
    getRecoveryNominee,
    getRecoveryCounter,
    recover,
    resetRecovery,
  }: RecoveryBehaviorArgs,
  skips?: string[]
) {
  const describe = describeFilter(skips);

  describe("::Recovery", function () {
    let owner: SignerWithAddress;
    let nominee: SignerWithAddress;
    let groupId: BigNumber;
    let instance: IRecovery;
    let depth: Number;
    let members: bigint[];

    beforeEach(async function () {
      instance = await deploy();
      owner = await getOwner();
      nominee = await getNominee();
      signal = "Hello World";
      bytes32Signal = ethers.utils.formatBytes32String(signal);
      groupId = await getGroupId();
      depth = await getDepth();
      members = await getMembers();
      merkleProof = createMerkleProof(
        Number(depth),
        BigInt(0),
        members,
        identityCommitment
      );
      witness = Semaphore.genWitness(
        identity.getTrapdoor(),
        identity.getNullifier(),
        merkleProof,
        merkleProof.root,
        signal
      );

      fullProof = await Semaphore.genProof(witness, wasmFilePath, zkeyFilePath);
      solidityProof = Semaphore.packToSolidityProof(fullProof.proof);
    });

    describe("#getRecoveryStatus()", function () {
      it("should starts with 0", async function () {
        expect(await instance.callStatic["getRecoveryStatus()"]()).to.equal(0);
      });
      it("should change to 1", async function () {
        await instance["recover(uint256,bytes32,uint256,uint256[8],address)"](
          groupId,
          bytes32Signal,
          fullProof.publicSignals.nullifierHash,
          fullProof.publicSignals.externalNullifier,
          solidityProof,
          nominee.address
        );
        expect(await instance.callStatic["getRecoveryStatus()"]()).to.equal(1);
      });
    });
    describe("#getMajority()", function () {
      it("should starts with 0", async function () {
        expect(await instance.callStatic["getMajority()"]()).to.equal(0);
      });
      it("should change to 2", async function () {
        await instance["recover(uint256,bytes32,uint256,uint256[8],address)"](
          groupId,
          bytes32Signal,
          fullProof.publicSignals.nullifierHash,
          fullProof.publicSignals.externalNullifier,
          solidityProof,
          nominee.address
        );
        expect(await instance.callStatic["getMajority()"]()).to.equal(2);
      });
    });
    describe("#getRecoveryNominee()", function () {
      it("should starts with 0", async function () {
        expect(await instance.callStatic["getRecoveryNominee()"]()).to.equal(
          ethers.constants.AddressZero
        );
      });
      it("should change to nominee", async function () {
        await instance["recover(uint256,bytes32,uint256,uint256[8],address)"](
          groupId,
          bytes32Signal,
          fullProof.publicSignals.nullifierHash,
          fullProof.publicSignals.externalNullifier,
          solidityProof,
          nominee.address
        );
        expect(await instance.callStatic["getRecoveryNominee()"]()).to.equal(
          nominee.address
        );
      });
    });
    describe("#getRecoveryCounter()", function () {
      it("should starts with 0", async function () {
        expect(await instance.callStatic["getRecoveryCounter()"]()).to.equal(0);
      });
      it("should change to 1", async function () {
        await instance["recover(uint256,bytes32,uint256,uint256[8],address)"](
          groupId,
          bytes32Signal,
          fullProof.publicSignals.nullifierHash,
          fullProof.publicSignals.externalNullifier,
          solidityProof,
          nominee.address
        );
        expect(await instance.callStatic["getRecoveryCounter()"]()).to.equal(1);
      });
    });
    describe("#recover(uint256,bytes32,uint256,uint256[8],address)", function () {
      it("should emits events", async function () {
        const transaction = await instance[
          "recover(uint256,bytes32,uint256,uint256[8],address)"
        ](
          groupId,
          bytes32Signal,
          fullProof.publicSignals.nullifierHash,
          fullProof.publicSignals.externalNullifier,
          solidityProof,
          nominee.address
        );

        const receipt = await transaction.wait();
        console.log(receipt.events);

        await expect(transaction)
          .to.emit(instance, "ProofVerified")
          .withArgs(groupId, bytes32Signal);
      });
      describe("reverts if", function () {});
    });
  });
}
