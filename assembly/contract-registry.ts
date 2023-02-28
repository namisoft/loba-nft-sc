import { Address, Args, call, Context, createSC, fileToByteArray, generateEvent, Storage } from "@massalabs/massa-as-sdk";
import { joinArrays, stringToBytes, u32FromBytes, u32ToBytes, uint8ArrayFromBytes, uint8ArrayToBytes } from "./utils";

const SC_TYPE_ERC721_FACTORY: string = "Erc721Factory";

const accNonceKeyPrefix: string = "AccountNonce_";
const accDeployedSCsKeyPrefix: string = "AccountDeployedSCs_";

export function createErc721Factory(_serializedArgs: StaticArray<u8>): StaticArray<u8> {
    const args = new Args(_serializedArgs);

    const nonce: u32 = args.nextU32();
    const accNonceKey = stringToBytes(accNonceKeyPrefix + Context.caller().toByteString());
    if (Storage.has(accNonceKey)) {
        const lastNonce = u32FromBytes(Storage.get(accNonceKey));
        if (nonce <= lastNonce) {
            generateEvent("too low nonce");
            return []
        }
    }

    // create ERC721 Factory contract
    let scBytesCode: StaticArray<u8> = fileToByteArray("build/erc721-factory.wasm");
    const erc721FactoryScAddress = createSC(scBytesCode);
    if (!erc721FactoryScAddress.isValid()) {
        generateEvent(
            `create Erc721 Factory contract: createSC returned an invalid address: ${erc721FactoryScAddress.toByteString()}`
        );
        return [];
    }
    generateEvent(
        `Erc721 Factory contract created at address: ${erc721FactoryScAddress.toByteString()}`
    );

    // factory initialization
    const serializedInitParams = uint8ArrayToBytes(args.nextUint8Array());
    const serializedSenderParams = new Args().add(Context.caller()).serialize();
    const factoryInitParams = new Args(joinArrays(
        serializedSenderParams, 0, serializedSenderParams.length - 1,
        serializedInitParams, 0, serializedInitParams.length - 1
    ));
    call(
        erc721FactoryScAddress,
        "initialize",
        factoryInitParams,
        20_000_000_000
    );

    _updateAccountData(
        Context.caller(),
        nonce,
        SC_TYPE_ERC721_FACTORY,
        erc721FactoryScAddress
    );

    return []
}


function _updateAccountData(account: Address, nonce: u32, createdScType: string, createdScAddress: Address): u32 {
    // update nonce
    const accNonceKey = stringToBytes(accNonceKeyPrefix + account.toByteString());
    Storage.set(accNonceKey, u32ToBytes(nonce));

    // update account deployed contract list
    const accDeployedSCsKey = stringToBytes(accDeployedSCsKeyPrefix + account.toByteString());
    let updatedData: Args;
    if (Storage.has(accDeployedSCsKey)) {
        const accDeployedSCsData = Storage.get(accDeployedSCsKey);
        const totalContracts: u32 = u32FromBytes(
            [
                accDeployedSCsData[0],
                accDeployedSCsData[1],
                accDeployedSCsData[2],
                accDeployedSCsData[3],
            ] as StaticArray<u8>
        );
        const bytesOfUpdatedTotalContracts = u32ToBytes(totalContracts + 1);
        updatedData = new Args(joinArrays(
            bytesOfUpdatedTotalContracts, 0, 3,
            accDeployedSCsData, 4, accDeployedSCsData.length - 1
        ))
    } else {
        updatedData = new Args().add(1 as u32)
    }
    const newAddedItem = new Args()
        .add(nonce)
        .add(createdScType)
        .add(createdScAddress);

    updatedData.add(uint8ArrayFromBytes(newAddedItem.serialize()));
    Storage.set(accDeployedSCsKey, updatedData.serialize());

    return updatedData.nextU32()
}