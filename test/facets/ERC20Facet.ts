import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, run } from "hardhat";
import {
  ERC20Mock__factory,
  SimplicyWalletDiamond,
} from "@solidstate/typechain-types";

describe.only("ERC20Facet", function () {
  let owner: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  let receiver: SignerWithAddress;
  let spender: SignerWithAddress;
  let walletDiamond: SimplicyWalletDiamond;
  let instance: any;
  let facets: any[];
  let facetCuts: any[] = [];

  const name = "ERC20MOCK";
  const symbol = "ERC20";
  const supply = ethers.utils.parseEther("1");
  const aboveSupply = ethers.utils.parseEther("100");

  before(async function () {
    [owner, nonOwner, receiver, spender] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const [deployer] = await ethers.getSigners();
    this.deployer = deployer;

    //deploy ERC20Mocks
    this.token = await new ERC20Mock__factory(deployer).deploy(
      name,
      symbol,
      owner.address,
      supply
    );

    this.anotherToken = await new ERC20Mock__factory(deployer).deploy(
      name,
      symbol,
      owner.address,
      supply
    );

    walletDiamond = await run("deploy:diamond", {
      name: "SimplicyWalletDiamond",
      logs: false,
    });

    await this.token.transfer(walletDiamond.address, supply);

    facets = await walletDiamond.callStatic["facets()"]();

    expect(facets).to.have.lengthOf(1);

    facets = await run("deploy:facets", {
      facets: [{ name: "ERC20Facet" }],
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

    instance = await ethers.getContractAt("ERC20Facet", walletDiamond.address);
  });

  describe("::SimplicyWalletDiamond", function () {
    it("should call functions through diamond address", async function () {
      expect(await walletDiamond.owner()).to.equal(this.deployer.address);
      expect(await walletDiamond.version()).to.equal("0.0.1");
    });
  });
  describe("::ERC20Facet", function () {
    it("should call functions through diamond address", async function () {
      expect(await instance.erc20FacetVersion()).to.equal("0.0.1");
    });
    describe("#getAllTrackedERC20Tokens", function () {
      it("should able getAllTrackedERC20Tokens", async function () {
        await instance.registerERC20(this.token.address);

        expect(await instance.getAllTrackedERC20Tokens()).eqls([
          this.token.address,
        ]);
      });
    });
    describe("#registerERC20", function () {
      it("should able to register ERC20", async function () {
        const transaction = await instance.registerERC20(this.token.address);

        await expect(transaction)
          .to.emit(instance, "ERC20TokenTracked")
          .withArgs(this.token.address);
      });
      it("should able to register multiple ERC20 tokens", async function () {
        const transaction = await instance.registerERC20(this.token.address);

        await expect(transaction)
          .to.emit(instance, "ERC20TokenTracked")
          .withArgs(this.token.address);

        const transaction2 = await instance.registerERC20(
          this.anotherToken.address
        );

        await expect(transaction2)
          .to.emit(instance, "ERC20TokenTracked")
          .withArgs(this.anotherToken.address);

        expect(await instance.getAllTrackedERC20Tokens()).eqls([
          this.token.address,
          this.anotherToken.address,
        ]);
      });
      describe("reverts if", function () {
        it("zero token address", async function () {
          await expect(
            instance.registerERC20(ethers.constants.AddressZero)
          ).to.be.revertedWith(
            "ERC20Service: tokenAddress is the zero address"
          );
        });
        it("already tracked", async function () {
          await instance.registerERC20(this.token.address);

          await expect(
            instance.registerERC20(this.token.address)
          ).to.be.revertedWith("ERC20Service: ERC20 token is already tracked");
        });
        it("non owner", async function () {
          await expect(
            instance.connect(nonOwner).registerERC20(this.token.address)
          ).to.be.revertedWith("Ownable: sender must be owner");
        });
      });
    });
    describe("#transferERC20", function () {
      it("should able to transfer an ERC20", async function () {
        expect(await this.token.balanceOf(instance.address)).to.equal(supply);

        await instance.registerERC20(this.token.address);

        await instance.transferERC20(
          this.token.address,
          receiver.address,
          supply
        );
        expect(await this.token.balanceOf(instance.address)).to.equal(0);
        expect(await this.token.balanceOf(receiver.address)).to.equal(supply);
      });
      describe("reverts if", function () {
        it("token not tracked", async function () {
          await expect(
            instance.transferERC20(this.token.address, receiver.address, supply)
          ).to.be.revertedWith("ERC20Service: token not tracked");
        });
        it("non owner", async function () {
          await instance.registerERC20(this.token.address);
          await expect(
            instance
              .connect(nonOwner)
              .transferERC20(this.token.address, receiver.address, supply)
          ).to.be.revertedWith("Ownable: sender must be owner");
        });
        it("exceeds balance", async function () {
          await instance.registerERC20(this.token.address);
          await expect(
            instance.transferERC20(
              this.token.address,
              receiver.address,
              aboveSupply
            )
          ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
        });
      });
    });
    describe("#approveERC20", function () {
      it("should able to approve an ERC20", async function () {
        await instance.registerERC20(this.token.address);

        await instance.approveERC20(
          this.token.address,
          spender.address,
          supply
        );

        expect(
          await this.token.allowance(instance.address, spender.address)
        ).to.equal(supply);

        await this.token
          .connect(spender)
          .transferFrom(instance.address, receiver.address, supply);

        expect(await this.token.balanceOf(instance.address)).to.equal(0);
        expect(await this.token.balanceOf(receiver.address)).to.equal(supply);
      });
      describe("reverts if", function () {
        it("token not tracked", async function () {
          await expect(
            instance.approveERC20(this.token.address, spender.address, supply)
          ).to.be.revertedWith("ERC20Service: token not tracked");
        });
        it("non owner", async function () {
          await instance.registerERC20(this.token.address);
          await expect(
            instance
              .connect(nonOwner)
              .approveERC20(this.token.address, spender.address, supply)
          ).to.be.revertedWith("Ownable: sender must be owner");
        });
      });
    });
    describe("#removeERC20", function () {
      it("should able to remove ERC20", async function () {
        await instance.registerERC20(this.token.address);

        const transaction = await instance.removeERC20(this.token.address);

        await expect(transaction)
          .to.emit(instance, "ERC20TokenRemoved")
          .withArgs(this.token.address);
      });
      describe("reverts if", function () {
        it("not tracked", async function () {
          await expect(
            instance.removeERC20(this.token.address)
          ).to.be.revertedWith("ERC20Service: token not tracked");
        });
        it("non owner", async function () {
          await expect(
            instance.connect(nonOwner).removeERC20(this.token.address)
          ).to.be.revertedWith("Ownable: sender must be owner");
        });
      });
    });
  });
});
