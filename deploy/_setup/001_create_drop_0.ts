import { ethers } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

import { STORE } from '@premier-deploy/_default/001_deploy_store';
import { publishDropMetadataToIPFS } from '@premier-scripts';

const { parseEther: toEth } = ethers.utils;

const DROP_ID = 0;

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { execute } = deployments;

    const { deployer } = await getNamedAccounts();

    await execute(
        STORE,
        {
            from: deployer,
            log: true,
            autoMine: true
        },
        'createDrop',
        500,
        toEth('0.25'),
        5
    );

    const address = await publishDropMetadataToIPFS(DROP_ID);

    await execute(
        STORE,
        {
            from: deployer,
            log: true,
            autoMine: true
        },
        'setDropURI',
        DROP_ID,
        address
    );
};

export default func;
