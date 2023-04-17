import { create, IPFSHTTPClient } from 'ipfs-http-client';
import { promises as fs } from 'fs';
import path from 'path';
import { DropMetadata } from '@premier-types';

const DROP_DIR = path.join(__dirname, '..', '_data', 'drop');
const DROP_VERSIONS_DIR_NAME = 'versions';
const DROP_MODEL_FILE = 'model.glb';

export const IPFS_PREFIX = 'ipfs://';

const node: IPFSHTTPClient = create({ url: '/ip4/127.0.0.1/tcp/5001' });

const readFile = async (pathToFile: string) => {
    return await fs.readFile(pathToFile);
};

const generateDropMetadata = async (dropId: number): Promise<DropMetadata> => {
    const dropDir = path.join(DROP_DIR, dropId.toString());
    const dropModelFile = path.join(dropDir, DROP_MODEL_FILE);
    const dropVersionsDir = path.join(dropDir, DROP_VERSIONS_DIR_NAME);

    // Upload model
    const modelData = await readFile(dropModelFile);
    const modelFile = await node.add({ content: modelData });
    const modelAddress = IPFS_PREFIX + modelFile.cid.toString();

    // Upload each versions
    const versions: any[] = [];
    const files = await fs.readdir(dropVersionsDir);
    for (let index = 0; index < files.length / 2; index++) {
        const infoFile = path.join(dropVersionsDir, index + '.info.json');
        const textureFileName = path.join(dropVersionsDir, index + '.texture.png');

        const textureData = await readFile(textureFileName);
        const textureFile = await node.add({ content: textureData });
        const textureAddress = IPFS_PREFIX + textureFile.cid.toString();

        const info = JSON.parse((await readFile(infoFile)).toString());
        info.texture = textureAddress;
        versions.push(info);
    }

    return {
        id: dropId,
        model: modelAddress,
        versions
    };
};

export const publishDropMetadataToIPFS = async (dropId: number) => {
    const result = await generateDropMetadata(dropId);

    const file = await node.add({
        content: JSON.stringify(result)
    });

    const fileAddress = IPFS_PREFIX + file.cid.toString();
    console.log('Added file:', fileAddress);

    return fileAddress;
};
