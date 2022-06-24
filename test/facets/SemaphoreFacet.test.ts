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
import { Contract } from "ethers";
import { SimplicyWalletDiamond } from "@solidstate/typechain-types";
import { config } from "../../package.json";
import { createTree, createIdentityCommitments } from "../utils";

type DeployedContract = {
  name: string;
  contract: Contract;
  address: string;
};

type Verifier = {
  contractAddress: string;
  merkleTreeDepth: number;
};

describe("SemaphoreFacet", function () {
  let owner: SignerWithAddress;
  let diamond: SimplicyWalletDiamond;
  let instance: any;
  let groupInstance: any;
  let facetCuts: any[] = [];
  let walletFacets: any[];

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
    diamond = await run("deploy:diamond", {
      name: "SimplicyWalletDiamond",
      logs: false,
    });

    const facets = await diamond.callStatic["facets()"]();

    expect(facets).to.have.lengthOf(1);

    this.verifier = await run("deploy:verifier", {
      logs: false,
    });

    verifierAddress = this.verifier.address;

    const poseidonT3 = await run("deploy:poseidonT3", {
      logs: false,
    });

    const semaphoreGroupsFacet: DeployedContract = await run(
      "deploy:semaphoreGroupsFacet",
      {
        library: poseidonT3.address,
        logs: false,
      }
    );

    walletFacets = await run("deploy:facets", {
      facets: [{ name: "SemaphoreFacet" }],
      logs: false,
    });

    facetCuts = [
      {
        target: walletFacets[0].address,
        action: 0,
        selectors: Object.keys(
          walletFacets[0].contract.interface.functions
        ).map((fn) => walletFacets[0].contract.interface.getSighash(fn)),
      },
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

    instance = await ethers.getContractAt("SemaphoreFacet", diamond.address);

    groupInstance = await ethers.getContractAt(
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

      beforeEach(async function () {
        const verifiers: Verifier[] = [
          { merkleTreeDepth: depth, contractAddress: verifierAddress },
        ];
        await instance.connect(this.deployer).setVerifiers(verifiers);
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
