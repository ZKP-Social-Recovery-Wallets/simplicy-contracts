import { Contract } from "ethers";
import { task, types } from "hardhat/config";

task("deploy:facets", "Deploy Facet contracts")
  .addOptionalParam<boolean>("logs", "Print the logs", true, types.boolean)
  .addParam("facets", "Facets json", undefined, types.json)
  .setAction(async ({ logs, facets }, { ethers }): Promise<Contract[]> => {
    let contracts: Contract[] = [];
    logs && console.log(facets);
    for (let i = 0; i < facets.length; i++) {
      const ContractFactory = await ethers.getContractFactory(facets[i].name);
      const contract = await ContractFactory.deploy();

      await contract.deployed();

      logs &&
        console.log(
          `${facets[i].name} contract has been deployed to: ${contract.address}`
        );

      contracts.push(contract);
    }

    return contracts;
  });
