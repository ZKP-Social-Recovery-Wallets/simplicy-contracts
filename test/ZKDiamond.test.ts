import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { describeBehaviorOfDiamond } from "@solidstate/spec";
import { ZKDiamond } from "@solidstate/typechain-types/ZKPDiamond";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("ZKDiamond", function () {
  let owner: SignerWithAddress;
  let getNomineeOwner: SignerWithAddress;
  let getNonOwner: SignerWithAddress;

  let instance: ZKDiamond;

  let facetCuts: any[] = [];

  before(async function () {
    [owner, getNomineeOwner, getNonOwner] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const [deployer] = await ethers.getSigners();
    instance = await new ZKDiamond(deployer).deploy();

    const facets = await instance.callStatic["facets()"]();

    expect(facets).to.have.lengthOf(1);

    facetCuts[0] = {
      target: instance.address,
      action: 0,
      selectors: facets[0].selectors,
    };
  });

  describeBehaviorOfDiamond({
    deploy: async () => instance as any,
    getOwner: async () => owner,
    getNomineeOwner: async () => getNomineeOwner,
    getNonOwner: async () => getNonOwner,
    facetCuts,
    fallbackAddress: ethers.constants.AddressZero,
  });
});
