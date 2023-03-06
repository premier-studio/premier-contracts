import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

export const STORE = 'STORE';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    const { deployer } = await getNamedAccounts();

    await deploy(STORE, {
        contract: 'Store',
        from: deployer,
        args: [],
        log: true,
        autoMine: true
    });
};

export default func;

func.tags = [STORE];
