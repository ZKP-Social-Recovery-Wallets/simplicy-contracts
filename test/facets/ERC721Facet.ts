import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, run } from "hardhat";
import {
  ERC721Mock,
  ERC721Mock__factory,
  SimplicyWalletDiamond,
} from "@solidstate/typechain-types";

describe.only("ERC721Facet", function () {
  let owner: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  let receiver: SignerWithAddress;
  let spender: SignerWithAddress;
  let walletDiamond: SimplicyWalletDiamond;
  let instance: any;
  let token: ERC721Mock;
  let facets: any[];
  let facetCuts: any[] = [];

  const name = "ERC721MOCK";
  const symbol = "ERC721";
  const tokenID = 1;
  const anotherTokenId = 2;

  before(async function () {
    [owner, nonOwner, receiver, spender] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const [deployer] = await ethers.getSigners();
    this.deployer = deployer;

    //deploy ERC721Mocks
    token = await new ERC721Mock__factory(deployer).deploy(name, symbol);

    this.anotherToken = await new ERC721Mock__factory(deployer).deploy(
      name,
      symbol
    );

    walletDiamond = await run("deploy:diamond", {
      name: "SimplicyWalletDiamond",
      logs: false,
    });

    facets = await walletDiamond.callStatic["facets()"]();

    expect(facets).to.have.lengthOf(1);

    facets = await run("deploy:facets", {
      facets: [{ name: "ERC721Facet" }],
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
    ];

    //do the cut
    await walletDiamond
      .connect(deployer)
      .diamondCut(facetCuts, ethers.constants.AddressZero, "0x");

    instance = await ethers.getContractAt("ERC721Facet", walletDiamond.address);

    await token["safeMint(address,uint256)"](owner.address, tokenID);
    await token.transferFrom(owner.address, instance.address, tokenID);
  });

  describe("::SimplicyWalletDiamond", function () {
    it("should call functions through diamond address", async function () {
      expect(await walletDiamond.owner()).to.equal(this.deployer.address);
      expect(await walletDiamond.version()).to.equal("0.0.1");
    });
  });
  describe("::ERC721Facet", function () {
    it("should call functions through diamond address", async function () {
      expect(await instance.erc721FacetVersion()).to.equal("0.0.1");
    });
    describe("#getAllTrackedERC721Tokens", function () {
      it("should able getAllTrackedERC721Tokens", async function () {
        await instance.registerERC721(token.address);

        expect(await instance.getAllTrackedERC721Tokens()).eqls([
          token.address,
        ]);
      });
    });
    describe("#registerERC721", function () {
      it("should able to register ERC721", async function () {
        const transaction = await instance.registerERC721(token.address);

        await expect(transaction)
          .to.emit(instance, "ERC721TokenTracked")
          .withArgs(token.address);
      });
      it("should able to register multiple ERC721 tokens", async function () {
        const transaction = await instance.registerERC721(token.address);

        await expect(transaction)
          .to.emit(instance, "ERC721TokenTracked")
          .withArgs(token.address);

        const transaction2 = await instance.registerERC721(
          this.anotherToken.address
        );

        await expect(transaction2)
          .to.emit(instance, "ERC721TokenTracked")
          .withArgs(this.anotherToken.address);

        expect(await instance.getAllTrackedERC721Tokens()).eqls([
          token.address,
          this.anotherToken.address,
        ]);
      });
      describe("reverts if", function () {
        it("zero token address", async function () {
          await expect(
            instance.registerERC721(ethers.constants.AddressZero)
          ).to.be.revertedWith(
            "ERC721Service: tokenAddress is the zero address"
          );
        });
        it("already tracked", async function () {
          await instance.registerERC721(token.address);

          await expect(
            instance.registerERC721(token.address)
          ).to.be.revertedWith(
            "ERC721Service: ERC721 token is already tracked"
          );
        });
        it("non owner", async function () {
          await expect(
            instance.connect(nonOwner).registerERC721(token.address)
          ).to.be.revertedWith("Ownable: sender must be owner");
        });
      });
    });
    describe("#transferERC721", function () {
      it("should able to transfer an ERC721", async function () {
        //expect(await token.balanceOf(instance.address)).to.equal(supply);

        await instance.registerERC721(token.address);

        await instance.transferERC721(token.address, receiver.address, tokenID);
        // expect(await token.balanceOf(instance.address)).to.equal(0);
        // expect(await token.balanceOf(receiver.address)).to.equal(supply);
      });
      describe("reverts if", function () {
        it("token not tracked", async function () {
          await expect(
            instance.transferERC721(token.address, receiver.address, tokenID)
          ).to.be.revertedWith("ERC721Service: token not tracked");
        });
        it("non owner", async function () {
          await instance.registerERC721(token.address);
          await expect(
            instance
              .connect(nonOwner)
              .transferERC721(token.address, receiver.address, tokenID)
          ).to.be.revertedWith("Ownable: sender must be owner");
        });
      });
    });
    describe("#approveERC721", function () {
      it("should able to approve an ERC721", async function () {
        await instance.registerERC721(token.address);

        await instance.approveERC721(token.address, spender.address, tokenID);

        // expect(
        //   await token.allowance(instance.address, spender.address)
        // ).to.equal(supply);

        await token
          .connect(spender)
          .transferFrom(instance.address, receiver.address, tokenID);

        // expect(await token.balanceOf(instance.address)).to.equal(0);
        // expect(await token.balanceOf(receiver.address)).to.equal(supply);
      });
      describe("reverts if", function () {
        it("token not tracked", async function () {
          await expect(
            instance.approveERC721(token.address, spender.address, tokenID)
          ).to.be.revertedWith("ERC721Service: token not tracked");
        });
        it("non owner", async function () {
          await instance.registerERC721(token.address);
          await expect(
            instance
              .connect(nonOwner)
              .approveERC721(token.address, spender.address, tokenID)
          ).to.be.revertedWith("Ownable: sender must be owner");
        });
      });
    });
    describe("#removeERC721", function () {
      it("should able to remove ERC721", async function () {
        await instance.registerERC721(token.address);

        const transaction = await instance.removeERC721(token.address);

        await expect(transaction)
          .to.emit(instance, "ERC721TokenRemoved")
          .withArgs(token.address);
      });
      describe("reverts if", function () {
        it("not tracked", async function () {
          await expect(instance.removeERC721(token.address)).to.be.revertedWith(
            "ERC721Service: token not tracked"
          );
        });
        it("non owner", async function () {
          await expect(
            instance.connect(nonOwner).removeERC721(token.address)
          ).to.be.revertedWith("Ownable: sender must be owner");
        });
      });
    });
  });
});
