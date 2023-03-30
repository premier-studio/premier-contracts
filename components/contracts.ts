import { buildContractsHardhat } from 'ethers-deploy-or-attach';

import { ethers } from 'hardhat';

import { contracts as premierContracts } from '@premier-contracts';

const contracts = buildContractsHardhat(premierContracts, ethers);

export default contracts;
