import { buildContracts } from 'ethers-deploy-or-attach';

import { ethers } from 'hardhat';

import { contracts } from '@premier-contracts';

const builtContracts = buildContracts(contracts, ethers);

export default builtContracts;
