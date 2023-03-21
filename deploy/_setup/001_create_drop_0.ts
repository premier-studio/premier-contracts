import { ethers } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

import Contracts from '@premier-contracts/components/contracts';
import { STORE } from '@premier-contracts/deploy/_default/000_deploy_store';
import { publishDropMetadataToIPFS } from '@premier-contracts/scripts';

const { parseEther: toEth } = ethers.utils;

const DROP_ID = 0;

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { execute, read } = deployments;

    const { deployer } = await getNamedAccounts();
    const deployerSigner = await ethers.getSigner(deployer);

    await execute(
        STORE,
        {
            from: deployer,
            log: true,
            autoMine: true
        },
        'createDrop',
        500,
        toEth('0.1'),
        5
    );

    const getContract = async (int: number) => {
        const dropContractAddress = (await read(STORE, {}, 'drop', int)) as string;
        const dropContract = (await Contracts.Drop.attach(dropContractAddress)).connect(deployerSigner);

        return dropContract;
    };

    const dropContract = await getContract(DROP_ID);
    const address = await publishDropMetadataToIPFS(DROP_ID);
    await dropContract.setDropURI(address);
};

export default func;
