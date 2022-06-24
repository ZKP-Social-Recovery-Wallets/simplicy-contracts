import { Identity } from "@semaphore-protocol/identity";
import {
  Semaphore,
  SemaphoreFullProof,
  SemaphoreSolidityProof,
} from "@zk-kit/protocols";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { createMerkleProof } from "@semaphore-protocol/proof";
import { expect } from "chai";
import { ethers, run } from "hardhat";
import {
  IGuardian,
  IRecovery,
  ISemaphore,
  ISemaphoreGroups,
  ISafeOwnable,
  SimplicyWalletDiamond,
} from "@solidstate/typechain-types";
import { createIdentityCommitments } from "../utils";
import { describeBehaviorOfGuardian } from "@simplicy/spec";
import { BigNumber } from "ethers";
import { config } from "../../package.json";

const groupId: BigNumber = ethers.constants.One;
const nonExistingGroupId: BigNumber = ethers.constants.Two;
const depth: Number = Number(process.env.TREE_DEPTH);
const zero: BigNumber = ethers.constants.Zero;
const members: bigint[] = createIdentityCommitments(3);
let verifierAddress: string;

const wasmFilePath = `${config.paths.build["snark-artifacts"]}/semaphore.wasm`;
const zkeyFilePath = `${config.paths.build["snark-artifacts"]}/semaphore.zkey`;

type GuardianDTO = {
  hashId: BigNumber;
};

type Verifier = {
  contractAddress: string;
  merkleTreeDepth: number;
};

describe.only("GuardianFacet", function () {
  let owner: SignerWithAddress;
  let nomineeOwner: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  let diamond: SimplicyWalletDiamond;
  let instance: any | IGuardian;
  let recoveryInstance: any | IRecovery;
  let semaphoreInstance: any | ISemaphore;
  let semaphoreGroupsInstance: any | ISemaphoreGroups;
  let safeOwnableInstance: any | ISafeOwnable;
  let facetCuts: any[] = [];
  let facets: any[];
  let anotherFacets: any[];

  before(async function () {
    [owner, nomineeOwner, nonOwner] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const [deployer] = await ethers.getSigners();
    this.deployer = deployer;
    diamond = await run("deploy:diamond", {
      name: "SimplicyWalletDiamond",
      logs: false,
    });

    facets = await diamond.callStatic["facets()"]();

    expect(facets).to.have.lengthOf(1);

    this.verifier = await run("deploy:verifier", {
      logs: false,
    });

    verifierAddress = this.verifier.address;

    const poseidonT3 = await run("deploy:poseidonT3", {
      logs: false,
    });

    facets = await run("deploy:with-poseidon", {
      library: poseidonT3.address,
      facets: [{ name: "GuardianFacet" }, { name: "SemaphoreGroupsFacet" }],
      logs: false,
    });

    facetCuts = [
      {
        target: facets[0].address,
        action: 0,
        selectors: Object.keys(facets[0].contract.interface.functions).map(
          (fn) => facets[0].contract.interface.getSighash(fn)
        ),
      },
      {
        target: facets[1].address,
        action: 0,
        selectors: Object.keys(facets[1].contract.interface.functions).map(
          (fn) => facets[1].contract.interface.getSighash(fn)
        ),
      },
    ];

    //do the cut
    await diamond
      .connect(deployer)
      .diamondCut(facetCuts, ethers.constants.AddressZero, "0x");

    facets = await run("deploy:facets", {
      facets: [{ name: "SemaphoreFacet" }, { name: "RecoveryFacet" }],
      logs: false,
    });

    facetCuts = [
      {
        target: facets[0].address,
        action: 0,
        selectors: Object.keys(facets[0].contract.interface.functions).map(
          (fn) => facets[0].contract.interface.getSighash(fn)
        ),
      },
      {
        target: facets[1].address,
        action: 0,
        selectors: Object.keys(facets[1].contract.interface.functions).map(
          (fn) => facets[1].contract.interface.getSighash(fn)
        ),
      },
    ];

    //do the cut
    await diamond
      .connect(deployer)
      .diamondCut(facetCuts, ethers.constants.AddressZero, "0x");

    instance = await ethers.getContractAt("GuardianFacet", diamond.address);
    recoveryInstance = await ethers.getContractAt(
      "RecoveryFacet",
      diamond.address
    );
    semaphoreInstance = await ethers.getContractAt(
      "SemaphoreFacet",
      diamond.address
    );

    semaphoreGroupsInstance = await ethers.getContractAt(
      "SemaphoreGroupsFacet",
      diamond.address
    );

    safeOwnableInstance = await ethers.getContractAt(
      "ISafeOwnable",
      diamond.address
    );
  });

  describe("::SimplicyWalletDiamond", function () {
    it("can call functions through diamond address", async function () {
      expect(await diamond.owner()).to.equal(this.deployer.address);
      expect(await diamond.version()).to.equal("0.0.1");
      expect(await instance.guardianFacetVersion()).to.equal("0.0.1");
      expect(await recoveryInstance.recoveryFacetVersion()).to.equal("0.0.1");
      expect(await semaphoreInstance.semaphoreFacetVersion()).to.equal("0.0.1");
      expect(
        await semaphoreGroupsInstance.semaphoreGroupsFacetVersion()
      ).to.equal("0.0.1");
    });
  });
  describeBehaviorOfGuardian(async () => instance, {
    getOwner: async () => owner,
    getNonOwner: async () => nonOwner,
    getDepth: async () => depth,
    getZero: async () => zero,
    getMembers: async () => members,
    getGuardians: (includePendingAdditions: boolean) =>
      instance.getGuardians(includePendingAdditions),
    numGuardians: (includePendingAdditions: boolean) =>
      instance.numGuardians(includePendingAdditions),
    setInitialGuardians: (guardians: GuardianDTO[]) =>
      instance.setInitialGuardians(guardians),
    addGuardian: (hashId: BigNumber) => instance.addGuardian(hashId),
    removeGuardian: (hashId: BigNumber) => instance.removeGuardian(hashId),
    removeGuardians: (guardians: GuardianDTO[]) =>
      instance.removeGuardians(guardians),
    cancelPendingGuardians: () => instance.cancelPendingGuardians(),
  });
  describe("::GuardianFacet", function () {
    beforeEach(async function () {
      const verifiers: Verifier[] = [
        { merkleTreeDepth: Number(depth), contractAddress: verifierAddress },
      ];

      await semaphoreInstance.connect(this.deployer).setVerifiers(verifiers);

      await semaphoreGroupsInstance.createGroup(
        groupId,
        depth,
        0,
        owner.address
      );
      let guardians: GuardianDTO[] = [];
      guardians = [
        { hashId: BigNumber.from(members[0]) },
        { hashId: BigNumber.from(members[1]) },
        { hashId: BigNumber.from(members[2]) },
      ];
      await instance.connect(owner).addGuardians(groupId, members, guardians);
    });
    describe("#setInitialGuardians((uint256)[]", function () {
      describe("reverts if", function () {
        it("non-owner", async function () {
          let guardians: GuardianDTO[] = [];
          guardians = [
            { hashId: BigNumber.from(members[0]) },
            { hashId: BigNumber.from(members[1]) },
            { hashId: BigNumber.from(members[2]) },
          ];

          await expect(
            instance
              .connect(nonOwner)
              ["setInitialGuardians((uint256)[])"](guardians)
          ).to.be.revertedWith("Ownable: sender must be owner");
        });
      });
    });
    describe("#recover(uint256,byte32,uint256,uint256,uint256[8],address)", function () {
      it("should able to call recover", async function () {
        const signal = "Hello world";
        const bytes32Signal = ethers.utils.formatBytes32String(signal);
        const identity = new Identity("0");
        const identityCommitment = identity.generateCommitment();
        const merkleProof = createMerkleProof(
          Number(depth),
          BigInt(0),
          members,
          identityCommitment
        );
        const witness = Semaphore.genWitness(
          identity.getTrapdoor(),
          identity.getNullifier(),
          merkleProof,
          merkleProof.root,
          signal
        );

        let fullProof: SemaphoreFullProof;
        let solidityProof: SemaphoreSolidityProof;

        fullProof = await Semaphore.genProof(
          witness,
          wasmFilePath,
          zkeyFilePath
        );
        solidityProof = Semaphore.packToSolidityProof(fullProof.proof);

        await recoveryInstance.recover(
          groupId,
          bytes32Signal,
          fullProof.publicSignals.nullifierHash,
          fullProof.publicSignals.merkleRoot,
          solidityProof,
          nomineeOwner.address
        );

        expect(await recoveryInstance.getMajority()).to.equal("2");
        expect(await recoveryInstance.getRecoveryStatus()).to.equal(1);

        expect(await recoveryInstance.getRecoveryCounter()).to.equal(1);
      });
    });
  });
});
