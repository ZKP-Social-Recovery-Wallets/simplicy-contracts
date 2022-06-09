import { Identity } from "@semaphore-protocol/identity";
import {
  Semaphore,
  SemaphoreFullProof,
  SemaphoreSolidityProof,
} from "@zk-kit/protocols";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { createMerkleProof } from "@semaphore-protocol/proof";
import { expect } from "chai";
import { utils } from "ethers";
import { ethers, run } from "hardhat";
import {
  SimplicyWalletDiamond,
  SimplicyWalletDiamond__factory,
} from "@solidstate/typechain-types";
import { config } from "../../package.json";
import { createTree, createIdentityCommitments } from "../utils";

type Facets = {
  name: string;
  args?: any[];
};

type Verifier = {
  contractAddress: string;
  merkleTreeDepth: number;
};

describe.only("SemaphoreFacet", function () {
  let owner: SignerWithAddress;
  let diamond: SimplicyWalletDiamond;
  let instance: any;
  let groupInstance: any;
  let facetCuts: any[] = [];

  const depth = Number(process.env.TREE_DEPTH);
  const groupId = 1;
  const tree = createTree(20); // create a tree with 20 leaves
  const members = createIdentityCommitments(3);
  let verifierAddress: string;

  const wasmFilePath = `${config.paths.build["snark-artifacts"]}/semaphore.wasm`;
  const zkeyFilePath = `${config.paths.build["snark-artifacts"]}/semaphore.zkey`;

  before(async function () {
    [owner] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const [deployer] = await ethers.getSigners();
    this.deployer = deployer;
    diamond = await new SimplicyWalletDiamond__factory(deployer).deploy();

    const facets = await diamond.callStatic["facets()"]();

    expect(facets).to.have.lengthOf(1);

    this.verifier = await run("deploy:verifier", {
      logs: false,
    });

    verifierAddress = this.verifier.address;

    this.semaphore = await run("deploy:semaphore", {
      logs: false,
    });

    facetCuts = [
      {
        target: this.semaphore.address,
        action: 0,
        selectors: Object.keys(this.semaphore.interface.functions).map((fn) =>
          this.semaphore.interface.getSighash(fn)
        ),
      },
    ];

    //do the cut
    await diamond
      .connect(deployer)
      .diamondCut(facetCuts, ethers.constants.AddressZero, "0x");

    instance = await ethers.getContractAt("SemaphoreFacet", diamond.address);

    this.libary = await run("deploy:poseidonT3", {
      logs: false,
    });

    this.groupFacet = await run("deploy:SemaphoreGroupsFacet", {
      library: this.libary.address,
      logs: true,
    });

    facetCuts = [
      {
        target: this.groupFacet.address,
        action: 0,
        selectors: Object.keys(this.groupFacet.interface.functions).map((fn) =>
          this.groupFacet.interface.getSighash(fn)
        ),
      },
    ];

    //do the cut
    await diamond
      .connect(deployer)
      .diamondCut(facetCuts, ethers.constants.AddressZero, "0x");

    groupInstance = await ethers.getContractAt(
      "SemaphoreGroupsFacet",
      diamond.address
    );
  });

  describe("::SimplicyWalletDiamond", function () {
    it("can call functions through diamond address", async function () {
      expect(await diamond.owner()).to.equal(this.deployer.address);
    });
  });
  describe("::SemaphoreFacet", function () {
    describe("#verifyProof", function () {
      const signal = "Hello world";
      const bytes32Signal = utils.formatBytes32String(signal);
      const identity = new Identity("0");
      const identityCommitment = identity.generateCommitment();
      const merkleProof = createMerkleProof(
        depth,
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

      this.beforeEach(async function () {
        const verifiers: Verifier[] = [
          { merkleTreeDepth: depth, contractAddress: verifierAddress },
        ];
        await instance.connect(this.deployer).init(verifiers);
        await groupInstance
          .connect(this.deployer)
          .createGroup(groupId, depth, 0, owner.address);

        await groupInstance.connect(owner).addMembers(groupId, members);

        fullProof = await Semaphore.genProof(
          witness,
          wasmFilePath,
          zkeyFilePath
        );
        solidityProof = Semaphore.packToSolidityProof(fullProof.proof);
      });
      it("should verify the proof", async function () {
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
});
