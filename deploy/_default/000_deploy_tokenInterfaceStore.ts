import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

export const TOKEN_INTERFACE_STORE = 'TOKEN_INTERFACE_STORE';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    const { deployer } = await getNamedAccounts();

    await deploy(TOKEN_INTERFACE_STORE, {
        contract: 'TokenInterfaceStore',
        from: deployer,
        args: [],
        log: true,
        autoMine: true
    });
};

export default func;

func.tags = [TOKEN_INTERFACE_STORE];
