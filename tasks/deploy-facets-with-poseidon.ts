import { Contract } from "ethers";
import { task, types } from "hardhat/config";

type DeployedContract = {
  name: string;
  contract: Contract;
  address: string;
};

task("deploy:facets-with-poseidon", "Deploy Facet with poseidon contract")
  .addOptionalParam<boolean>("logs", "Print the logs", true, types.boolean)
  .addParam("library", "PoseidonT3 address", undefined, types.string)
  .addParam("facets", "Facets json", undefined, types.json)
  .setAction(
    async (
      { logs, library, facets },
      { ethers }
    ): Promise<DeployedContract[]> => {
      let contracts: DeployedContract[] = [];

      logs && console.log(facets);
      for (let i = 0; i < facets.length; i++) {
        const ContractFactory = await ethers.getContractFactory(
          facets[i].name,
          {
            libraries: {
              PoseidonT3: library,
            },
          }
        );
        const contract = await ContractFactory.deploy();

        await contract.deployed();

        logs &&
          console.log(
            `${facets[i].name} contract has been deployed to: ${contract.address}`
          );

        contracts[i] = {
          name: facets[i].name,
          contract: contract,
          address: contract.address,
        };
      }

      return contracts;
    }
  );
