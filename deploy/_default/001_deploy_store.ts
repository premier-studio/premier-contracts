import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { TOKEN_INTERFACE_STORE } from './000_deploy_tokenInterfaceStore';

export const STORE = 'STORE';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    const { deployer } = await getNamedAccounts();

    const tokenInterfaceStore = (await deployments.get(TOKEN_INTERFACE_STORE)).address;

    await deploy(STORE, {
        contract: 'Store',
        from: deployer,
        args: [tokenInterfaceStore],
        log: true,
        autoMine: true
    });
};

export default func;

func.tags = [STORE];
