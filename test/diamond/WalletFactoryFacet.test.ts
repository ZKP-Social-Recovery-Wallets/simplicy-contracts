import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, run } from "hardhat";
import { Contract } from "ethers";
import {
  SimplicyWalletDiamond,
  WalletFactoryDiamond,
} from "@solidstate/typechain-types";

type DeployedContract = {
  name: string;
  contract: Contract;
  address: string;
};

describe("WalletFactoryFacet", function () {
  let owner: SignerWithAddress;
  let newOwner: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  let walletDiamond: SimplicyWalletDiamond;
  let factoryDiamond: WalletFactoryDiamond;
  let instance: any;
  let groupInstance: any;
  let facetCuts: any[] = [];
  let walletFacetCuts: any[] = [];

  const hashId = ethers.utils.formatBytes32String("1");
  let facets: any[];
  let walletFacets: any[];

  before(async function () {
    [owner, newOwner, nonOwner] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const [deployer] = await ethers.getSigners();
    this.deployer = deployer;
    walletDiamond = await run("deploy:diamond", {
      name: "SimplicyWalletDiamond",
      logs: false,
    });

    factoryDiamond = await run("deploy:diamond", {
      name: "WalletFactoryDiamond",
      logs: false,
    });

    facets = await walletDiamond.callStatic["facets()"]();

    expect(facets).to.have.lengthOf(1);

    // this.verifier = await run("deploy:verifier", {
    //   logs: false,
    // });

    // verifierAddress = this.verifier.address;

    facets = await run("deploy:facets", {
      facets: [{ name: "WalletFactoryFacet" }],
      logs: false,
    });

    for (let i = 0; i < facets.length; i++) {
      facetCuts = [
        {
          target: facets[0].address,
          action: 0,
          selectors: Object.keys(facets[0].contract.interface.functions).map(
            (fn) => facets[0].contract.interface.getSighash(fn)
          ),
        },
      ];
    }

    walletFacets = await run("deploy:facets", {
      facets: [{ name: "SemaphoreFacet" }, { name: "SemaphoreVotingFacet" }],
      logs: false,
    });

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

    walletFacetCuts = [
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
    await factoryDiamond
      .connect(deployer)
      .diamondCut(facetCuts, ethers.constants.AddressZero, "0x");

    await walletDiamond.diamondCut(
      walletFacetCuts,
      ethers.constants.AddressZero,
      "0x"
    );

    instance = await ethers.getContractAt(
      "WalletFactoryFacet",
      factoryDiamond.address
    );
  });

  describe("::SimplicyWalletDiamond", function () {
    it("should call functions through diamond address", async function () {
      expect(await walletDiamond.owner()).to.equal(this.deployer.address);
      expect(await walletDiamond.version()).to.equal("0.0.1");
    });
    // describe("#transferOwnership", function () {
    //   it("should transfer ownership", async function () {
    //     await walletDiamond.transferOwnership(newOwner.address);
    //     expect(await walletDiamond.owner()).to.equal(newOwner.address);
    //   });
    // });
  });
  describe("::SimplicWalletFactoryDiamondyWalletDiamond", function () {
    it("should call functions through diamond address", async function () {
      expect(await factoryDiamond.owner()).to.equal(this.deployer.address);
      expect(await factoryDiamond.version()).to.equal("0.0.1");
    });
  });
  describe("::WalletFactoryFacet", function () {
    it("should call functions through diamond address", async function () {
      expect(await instance.walletFactoryFacetVersion()).to.equal("0.0.1");
    });
    describe("#setDiamond", function () {
      it("should able to set a SimplicyWalletDiamond", async function () {
        const transaction = await instance.setDiamond(walletDiamond.address);

        await expect(transaction)
          .to.emit(instance, "DiamondIsSet")
          .withArgs(walletDiamond.address);

        expect(await instance.getDiamond()).to.equal(walletDiamond.address);
      });
      describe("reverts if", function () {
        it("zero address", async function () {
          await expect(
            instance.setDiamond(ethers.constants.AddressZero)
          ).to.be.revertedWith(
            "WalletFactory: Diamond address is the zero address"
          );
        });
        it("non admin", async function () {
          await expect(
            instance.connect(nonOwner).setDiamond(walletDiamond.address)
          ).to.be.revertedWith("Ownable: sender must be owner");
        });
      });
    });
    describe("#addFacet", function () {
      it("should able to add facets", async function () {
        for (let i = 0; i < facets.length; i++) {
          const transaction = await instance.addFacet(
            walletFacets[i].name,
            walletFacets[i].address,
            "0.0.1"
          );

          await expect(transaction)
            .to.emit(instance, "FacetIsAdded")
            .withArgs(walletFacets[i].name, walletFacets[i].address, "0.0.1");
        }
      });
    });
    describe("#createWallet", function () {
      it("should able create a new wallet", async function () {
        await instance.setDiamond(walletDiamond.address);

        const transaction = await instance.createWallet(hashId);

        const newWallet = await instance.getWallet(hashId);
        expect(newWallet).to.be.properAddress;

        await expect(transaction)
          .to.emit(instance, "NewDiamondWallet")
          .withArgs(newWallet);
      });
      describe("wallet created", function () {
        beforeEach(async function () {
          await instance.setDiamond(walletDiamond.address);

          await instance.connect(owner).createWallet(hashId);

          const newWallet = await instance.getWallet(hashId);

          this.newWalletInstance = await ethers.getContractAt(
            "SimplicyWalletDiamond",
            newWallet
          );
        });
        it("should able call function", async function () {
          //console.log(this.deployer.address);
          console.log("instance.address", instance.address);
          expect(await this.newWalletInstance.owner()).to.equal(owner.address);
          expect(await this.newWalletInstance.version()).to.equal("0.0.1");
        });
        it("should able to cut", async function () {
          const transaction = await this.newWalletInstance
            .connect(owner)
            .diamondCut(walletFacetCuts, ethers.constants.AddressZero, "0x");

          await expect(transaction).to.emit(
            this.newWalletInstance,
            "DiamondCut"
          );
        });
      });
    });
  });
});
