import { Identity } from "@semaphore-protocol/identity";
import {
  Semaphore,
  SemaphoreFullProof,
  SemaphoreSolidityProof,
} from "@zk-kit/protocols";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { createMerkleProof } from "@semaphore-protocol/proof";
import { MerkleProof } from "@zk-kit/incremental-merkle-tree";
import { describeFilter } from "@solidstate/library";
import { ISemaphore } from "@solidstate/typechain-types";
import { expect } from "chai";
import { BigNumber, ContractTransaction } from "ethers";
import { ethers } from "hardhat";
import { config } from "../../package.json";

export interface SemaphoreBehaviorArgs {
  getOwner: () => Promise<SignerWithAddress>;
  getNomineeOwner: () => Promise<SignerWithAddress>;
  getGroupId: () => Promise<BigNumber>;
  getNonExistingGroupId: () => Promise<BigNumber>;
  getDepth: () => Promise<Number>;
  getMembers: () => Promise<bigint[]>;
  verifyProof: (
    groupId: BigNumber,
    signal: string,
    nullifierHash: BigNumber,
    externalNullifier: BigNumber,
    proof: BigNumber[]
  ) => Promise<ContractTransaction>;
}

export function describeBehaviorOfSemaphore(
  deploy: () => Promise<ISemaphore>,
  {
    getOwner,
    getNomineeOwner,
    getGroupId,
    getNonExistingGroupId,
    getDepth,
    getMembers,
    verifyProof,
  }: SemaphoreBehaviorArgs,
  skips?: string[]
) {
  const describe = describeFilter(skips);

  describe("::Semaphore", function () {
    let owner: SignerWithAddress;
    let nomineeOwner: SignerWithAddress;
    let groupId: BigNumber;
    let nonExistingGroupId: BigNumber;
    let depth: Number;
    let members: bigint[];
    let instance: ISemaphore;

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

    beforeEach(async function () {
      instance = await deploy();
      owner = await getOwner();
      nomineeOwner = await getNomineeOwner();
      signal = "Hello World";
      bytes32Signal = ethers.utils.formatBytes32String(signal);
      groupId = await getGroupId();
      nonExistingGroupId = await getNonExistingGroupId();
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
    describe("#verifyProof(uint256,byte32,uint256,uint256,uint256[8])", function () {
      it("should emit event", async function () {
        const transaction = await instance.verifyProof(
          groupId,
          bytes32Signal,
          fullProof.publicSignals.nullifierHash,
          fullProof.publicSignals.merkleRoot,
          solidityProof
        );

        await expect(transaction)
          .to.emit(instance, "ProofVerified")
          .withArgs(groupId, bytes32Signal);
      });
    });
  });
}
