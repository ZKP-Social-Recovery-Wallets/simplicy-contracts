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

describe("SemaphoreVotingFacet", function () {
  let owner: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  let diamond: SimplicyWalletDiamond;
  let instance: any;
  let groupInstance: any;
  let votingInstance: any;
  let facetCuts: any[] = [];
  let walletFacets: any[];

  const depth = Number(process.env.TREE_DEPTH);
  const groupId = 1;
  const poolId = 1;
  const tree = createTree(20); // create a tree with 20 leaves
  const members = createIdentityCommitments(3);
  let verifierAddress: string;

  const wasmFilePath = `${config.paths.build["snark-artifacts"]}/semaphore.wasm`;
  const zkeyFilePath = `${config.paths.build["snark-artifacts"]}/semaphore.zkey`;

  before(async function () {
    [owner, nonOwner] = await ethers.getSigners();
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
      facets: [{ name: "SemaphoreFacet" }, { name: "SemaphoreVotingFacet" }],
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
        target: walletFacets[1].address,
        action: 0,
        selectors: Object.keys(
          walletFacets[1].contract.interface.functions
        ).map((fn) => walletFacets[1].contract.interface.getSighash(fn)),
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

    votingInstance = await ethers.getContractAt(
      "SemaphoreVotingFacet",
      diamond.address
    );
  });

  describe("::SimplicyWalletDiamond", function () {
    it("can call functions through diamond address", async function () {
      expect(await diamond.owner()).to.equal(this.deployer.address);
      expect(await diamond.version()).to.equal("0.0.1");
      expect(await votingInstance.semaphoreVotingFacetVersion()).to.equal(
        "0.0.1"
      );
    });
  });
  describe("::SemaphoreVotingFacet", function () {
    describe("#createPoll", function () {
      it("should able to create a new poll", async function () {
        const transaction = await votingInstance.createPoll(
          poolId,
          this.deployer.address,
          depth
        );

        await expect(transaction)
          .to.emit(votingInstance, "PollCreated")
          .withArgs(poolId, this.deployer.address);
      });
      describe("reverts if", function () {
        it("zero address", async function () {
          await expect(
            votingInstance.createPoll(
              poolId,
              ethers.constants.AddressZero,
              depth
            )
          ).to.be.revertedWith(
            "SemaphoreVoting: coordinator is the zero address"
          );
        });
        it("non owner", async function () {
          await expect(
            votingInstance
              .connect(nonOwner)
              .createPoll(poolId, ethers.constants.AddressZero, depth)
          ).to.be.revertedWith("Ownable: sender must be owner");
        });
      });
    });
  });
});
