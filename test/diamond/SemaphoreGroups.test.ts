import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, run } from "hardhat";
import {
  SimplicyWalletDiamond,
  SimplicyWalletDiamond__factory,
} from "@solidstate/typechain-types";

describe.only("SemaphoreGroupsFacet", function () {
  let owner: SignerWithAddress;
  let diamond: any;
  let facetCuts: any[] = [];

  before(async function () {
    [owner] = await ethers.getSigners();
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

    console.log(Object.keys(this.facet.interface.functions));

    //do the cut
    await diamond
      .connect(deployer)
      .diamondCut(facetCuts, ethers.constants.AddressZero, "0x");
  });

  describe("::SimplicyWalletDiamond", function () {
    it("can call functions through diamond address", async function () {
      expect(await diamond.owner()).to.equal(this.deployer.address);
    });
  });
  describe("::SemaphoreGroupsFacet", function () {
    describe("#createGroup", function () {
      it("should create group", async function () {
        console.log(this.deployer.address);
        const transaction = await diamond
          .connect(this.deployer)
          .createGroup(1, 20, 0, owner.address);
        const receipt = await transaction.wait();
        console.log(receipt);
      });
    });
  });
});
