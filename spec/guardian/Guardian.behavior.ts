import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { createMerkleTree } from "@semaphore-protocol/proof";
import { describeFilter } from "@solidstate/library";
import { IGuardian } from "@solidstate/typechain-types";
import { expect } from "chai";
import { BigNumber, ContractTransaction } from "ethers";
import { ethers } from "hardhat";

type GuardianDTO = {
  hashId: BigNumber;
};

export interface GuardianBehaviorArgs {
  getOwner: () => Promise<SignerWithAddress>;
  getNonOwner: () => Promise<SignerWithAddress>;
  getDepth: () => Promise<Number>;
  getZero: () => Promise<BigNumber>;
  getMembers: () => Promise<bigint[]>;
  getGuardians: (includePendingAddition: boolean) => Promise<IGuardian[]>;
  numGuardians: (includePendingAddition: boolean) => Promise<BigNumber>;
  setInitialGuardians: (
    guardians: GuardianDTO[]
  ) => Promise<ContractTransaction>;
  addGuardian: (hashId: BigNumber) => Promise<ContractTransaction>;
  removeGuardian: (hashId: BigNumber) => Promise<ContractTransaction>;
  removeGuardians: (guardians: GuardianDTO[]) => Promise<ContractTransaction>;
  cancelPendingGuardians: () => Promise<ContractTransaction>;
}

export function describeBehaviorOfGuardian(
  deploy: () => Promise<IGuardian>,
  {
    getOwner,
    getNonOwner,
    getDepth,
    getZero,
    getMembers,
  }: GuardianBehaviorArgs,
  skips?: string[]
) {
  const describe = describeFilter(skips);

  describe("::Guardian", function () {
    let owner: SignerWithAddress;
    let nonOwner: SignerWithAddress;
    let depth: Number;
    let zero: BigNumber;
    let members: bigint[];
    let instance: IGuardian;

    beforeEach(async function () {
      instance = await deploy();
      owner = await getOwner();
      nonOwner = await getNonOwner();
      depth = await getDepth();
      zero = await getZero();
      members = await getMembers();
    });
    describe("#getGuardian(uint256)", function () {
      describe("#addGuardian(uint256)", function () {
        it("should return guardian", async function () {
          await instance["addGuardian(uint256)"](members[0]);
          const guardian: any = await instance.callStatic[
            "getGuardian(uint256)"
          ](members[0]);
          expect(guardian.hashId).to.equal(members[0]);
          expect(guardian.status).to.equal(1);
        });
      });
      describe("reverts if", function () {
        it("no guardians added", async function () {
          await expect(
            instance.callStatic["getGuardian(uint256)"](members[0])
          ).to.be.revertedWith("Guardian: GUARDIAN_NOT_FOUND");
        });
      });
    });
    describe("#getGuardians(bool)", function () {
      it("should return empty []", async function () {
        const guardians: any[] = [];
        expect(await instance.callStatic["getGuardians(bool)"](true)).to.eqls(
          guardians
        );
      });
      describe("#addGuardian(uint256)", function () {
        it("should return guardians", async function () {
          await instance["addGuardian(uint256)"](members[0]);
          const transaction = await instance.callStatic["getGuardians(bool)"](
            true
          );
          expect(transaction.length).to.equal(1);
          expect(transaction[0].hashId).to.equal(members[0]);
          expect(transaction[0].status).to.equal(1);
        });
      });
    });
    describe("#numGuardians(bool)", function () {
      it("should return 0", async function () {
        expect(await instance.callStatic["numGuardians(bool)"](true)).to.equal(
          0
        );
      });
      describe("#addGuardian(uint256)", function () {
        it("should return 1", async function () {
          await instance["addGuardian(uint256)"](members[0]);
          expect(
            await instance.callStatic["numGuardians(bool)"](true)
          ).to.equal(1);
        });
      });
    });
    describe("#setInitialGuardians((uint256)[])", function () {
      it("should emits events", async function () {
        let guardians: GuardianDTO[] = [];
        guardians = [
          { hashId: BigNumber.from(members[0]) },
          { hashId: BigNumber.from(members[1]) },
          { hashId: BigNumber.from(members[2]) },
        ];
        const transaction = await instance["setInitialGuardians((uint256)[])"](
          guardians
        );

        const receipt = await transaction.wait();
        let events = receipt.events;
        if (events) {
          for (let i = 0; i < events.length; i++) {
            const args: any = events[i].args;
            await expect(transaction)
              .to.emit(instance, "GuardianAdded")
              .withArgs(members[i], args.effectiveTime);
          }
        }
      });
      describe("reverts if", function () {
        it("below isMinGuardian", async function () {
          let guardians: GuardianDTO[] = [];
          guardians = [
            { hashId: BigNumber.from(members[0]) },
            { hashId: BigNumber.from(members[1]) },
          ];
          await expect(
            instance["setInitialGuardians((uint256)[])"](guardians)
          ).to.be.revertedWith("Guardian: MIN_GUARDIANS_NOT_MET");
        });
        it("above isMaxGuardian", async function () {
          let guardians: GuardianDTO[] = [];
          guardians = [
            { hashId: BigNumber.from(1) },
            { hashId: BigNumber.from(2) },
            { hashId: BigNumber.from(3) },
            { hashId: BigNumber.from(4) },
            { hashId: BigNumber.from(5) },
            { hashId: BigNumber.from(6) },
            { hashId: BigNumber.from(7) },
            { hashId: BigNumber.from(8) },
            { hashId: BigNumber.from(9) },
            { hashId: BigNumber.from(10) },
            { hashId: BigNumber.from(11) },
          ];
          await expect(
            instance["setInitialGuardians((uint256)[])"](guardians)
          ).to.be.revertedWith("Guardian: MAX_GUARDIANS_EXCEEDED");
        });
        it("zero hashId", async function () {
          let guardians: GuardianDTO[] = [];
          guardians = [
            { hashId: BigNumber.from(1) },
            { hashId: BigNumber.from(2) },
            { hashId: ethers.constants.Zero },
          ];
          await expect(
            instance["setInitialGuardians((uint256)[])"](guardians)
          ).to.be.revertedWith("Guardian: GUARDIAN_HASH_ID_IS_ZERO");
        });
        it("guardian exists", async function () {
          await instance["addGuardian(uint256)"](members[2]);

          let guardians: GuardianDTO[] = [];
          guardians = [
            { hashId: BigNumber.from(members[0]) },
            { hashId: BigNumber.from(members[1]) },
            { hashId: BigNumber.from(members[2]) },
          ];
          await expect(
            instance["setInitialGuardians((uint256)[])"](guardians)
          ).to.be.revertedWith("Guardian: GUARDIAN_EXISTS");
        });
      });
    });
    describe("#removeGuardian(uint256)", function () {
      it("should emits events", async function () {
        let guardians: GuardianDTO[] = [];
        guardians = [
          { hashId: BigNumber.from(members[0]) },
          { hashId: BigNumber.from(members[1]) },
          { hashId: BigNumber.from(members[2]) },
        ];
        await instance["setInitialGuardians((uint256)[])"](guardians);
        const transaction = await instance["removeGuardian(uint256)"](
          members[2]
        );

        const receipt = await transaction.wait();
        let events = receipt.events;
        if (events) {
          const args: any = events[0].args;
          await expect(transaction)
            .to.emit(instance, "GuardianRemoved")
            .withArgs(members[2], args.effectiveTime);
        }
      });
      describe("reverts if", function () {
        it("guardian non-exists", async function () {
          let guardians: GuardianDTO[] = [];
          guardians = [
            { hashId: BigNumber.from(1) },
            { hashId: BigNumber.from(2) },
            { hashId: BigNumber.from(3) },
          ];
          await instance["setInitialGuardians((uint256)[])"](guardians);
          await expect(
            instance["removeGuardian(uint256)"](members[2])
          ).to.be.revertedWith("Guardian: GUARDIAN_NOT_FOUND");
        });
        it("zero hashId", async function () {
          let guardians: GuardianDTO[] = [];
          guardians = [
            { hashId: BigNumber.from(1) },
            { hashId: BigNumber.from(2) },
            { hashId: BigNumber.from(3) },
          ];
          await instance["setInitialGuardians((uint256)[])"](guardians);

          await expect(
            instance["removeGuardian(uint256)"](ethers.constants.Zero)
          ).to.be.revertedWith("Guardian: GUARDIAN_HASH_ID_IS_ZERO");
        });
        // TODO: non-active
      });
    });
    describe("#removeGuardians((uint256)[])", function () {
      it("should emits events", async function () {
        let guardians: GuardianDTO[] = [];
        guardians = [
          { hashId: BigNumber.from(members[0]) },
          { hashId: BigNumber.from(members[1]) },
          { hashId: BigNumber.from(members[2]) },
        ];
        await instance["setInitialGuardians((uint256)[])"](guardians);
        const transaction = await instance["removeGuardians((uint256)[])"](
          guardians
        );

        const receipt = await transaction.wait();
        let events = receipt.events;
        if (events) {
          for (let i = 0; i < events.length; i++) {
            const args: any = events[i].args;
            await expect(transaction)
              .to.emit(instance, "GuardianRemoved")
              .withArgs(members[i], args.effectiveTime);
          }
        }
      });
      it("should emits events with different order", async function () {
        let guardians: GuardianDTO[] = [];
        guardians = [
          { hashId: BigNumber.from(members[0]) },
          { hashId: BigNumber.from(members[1]) },
          { hashId: BigNumber.from(members[2]) },
        ];
        await instance["setInitialGuardians((uint256)[])"](guardians);
        guardians = [
          { hashId: BigNumber.from(members[2]) },
          { hashId: BigNumber.from(members[1]) },
          { hashId: BigNumber.from(members[0]) },
        ];
        const transaction = await instance["removeGuardians((uint256)[])"](
          guardians
        );

        const receipt = await transaction.wait();
        let events = receipt.events;
        if (events) {
          for (let i = 0; i < events.length; i++) {
            const args: any = events[i].args;
            await expect(transaction)
              .to.emit(instance, "GuardianRemoved")
              .withArgs(members[i], args.effectiveTime);
          }
        }
      });
      it("should emits events removed less guardian", async function () {
        let guardians: GuardianDTO[] = [];
        guardians = [
          { hashId: BigNumber.from(members[0]) },
          { hashId: BigNumber.from(members[1]) },
          { hashId: BigNumber.from(members[2]) },
        ];
        await instance["setInitialGuardians((uint256)[])"](guardians);
        guardians = [
          { hashId: BigNumber.from(members[0]) },
          { hashId: BigNumber.from(members[1]) },
        ];
        const transaction = await instance["removeGuardians((uint256)[])"](
          guardians
        );

        const receipt = await transaction.wait();
        let events = receipt.events;
        if (events) {
          for (let i = 0; i < events.length; i++) {
            const args: any = events[i].args;
            await expect(transaction)
              .to.emit(instance, "GuardianRemoved")
              .withArgs(members[i], args.effectiveTime);
          }
        }
      });
      describe("reverts if", function () {
        it("guardian non-exists", async function () {
          let guardians: GuardianDTO[] = [];
          guardians = [
            { hashId: BigNumber.from(1) },
            { hashId: BigNumber.from(2) },
            { hashId: BigNumber.from(3) },
          ];
          await instance["setInitialGuardians((uint256)[])"](guardians);
          guardians = [
            { hashId: BigNumber.from(members[0]) },
            { hashId: BigNumber.from(members[1]) },
          ];
          await expect(
            instance["removeGuardians((uint256)[])"](guardians)
          ).to.be.revertedWith("Guardian: GUARDIAN_NOT_FOUND");
        });
      });
    });
  });
}
