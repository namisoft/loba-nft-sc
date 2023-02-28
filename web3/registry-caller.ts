import "dotenv/config";
import {
    Client,
    EOperationStatus,
    IAccount,
    IClientConfig,
    ProviderType,
    WalletClient,
    Args,
} from "@massalabs/massa-web3";
import fs from "fs";

const DEFAULT_PUBLIC_RPC = "https://test.massa.net/api/v2:33035";
const DEFAULT_PRIVATE_RPC = "https://test.massa.net/api/v2:33034";

const CONTRACT_REGISTRY_ADDRESS =
    "A1qhigAhj1czTAHdCT9xXwZgHKVAxTa5PSVtzurJ4yppG6Gsjr3";

export class ContractRegistryCaller {
    callerAccount = {} as IAccount;
    web3Client = {} as Client;

    async init() {
        if (!process.env.WALLET_PRIVATE_KEY) {
            throw new Error(
                'WALLET_PRIVATE_KEY is not set. Did you create environment file ".env" ?'
            );
        }

        this.callerAccount = await WalletClient.getAccountFromSecretKey(
            process.env.WALLET_PRIVATE_KEY
        );

        const publicRpc = process.env.JSON_RPC_URL_PUBLIC || DEFAULT_PUBLIC_RPC;
        const privateRpc = process.env.JSON_RPC_URL_PRIVATE || DEFAULT_PRIVATE_RPC;

        const providers = [
            {
                url: publicRpc,
                type: ProviderType.PUBLIC,
            },
            {
                url: privateRpc,
                type: ProviderType.PRIVATE,
            },
        ];
        const web3ClientConfig: IClientConfig = {
            providers,
            retryStrategyOn: true,
            periodOffset: 1,
        };
        this.web3Client = new Client(web3ClientConfig, this.callerAccount);
        await this.web3Client.wallet().setBaseAccount(this.callerAccount);
        //console.log(this.web3Client.wallet().getWalletAccounts());
    }

    async createErc721Factory(): Promise<string> {

        const nftInfo = new Args()
            .addString("MyMassaNFT")
            .addString("MMN")
            .addU64(BigInt(666888))
            .addString("/my/massa/nft")
            .addF32(109.1)
            .addF32(211.09)
            .addF32(50.68)
            .addU64(BigInt(9_000_000_000))
            .serialize();
        const serializedNftInfo = new Uint8Array(nftInfo.length);
        for (let i = 0; i < nftInfo.length; i++) {
            serializedNftInfo[i] = nftInfo[i]
        }

        const nonce = await this.getNonceOf(this.callerAccount.address as string) + 1;

        const operationId = await this.web3Client.smartContracts().callSmartContract({
            /// storage fee for taking place in books
            fee: 0,
            /// The maximum amount of gas that the execution of the contract is allowed to cost.
            maxGas: 70000000,
            /// Extra coins that are spent from the caller's balance and transferred to the target
            coins: 30_000_000_000,
            /// Target smart contract address
            targetAddress: CONTRACT_REGISTRY_ADDRESS,
            /// Target function name. No function is called if empty.
            functionName: "createErc721Factory",
            /// Parameter to pass to the target function
            parameter: new Args()
                .addU32(BigInt(nonce))
                .addUint8Array(serializedNftInfo)
                .serialize(),
        });

        console.log(operationId[0]);

        await this.web3Client.smartContracts().awaitRequiredOperationStatus(operationId[0], EOperationStatus.FINAL);

        return "";
    }

    async getNonceOf(acc: string) {
        const r = await this.web3Client.publicApi().getDatastoreEntries(
            [{
                address: CONTRACT_REGISTRY_ADDRESS,
                key: Array.from(Buffer.from(`AccountNonce_${acc}`, "utf16le"))
            }]
        );
        return Number(new Args(r[0].final_value as number[]).nextU32());
    }

    async getDeployedContracts(acc: string) {
        await this.web3Client.publicApi().getDatastoreEntries(
            [{
                address: CONTRACT_REGISTRY_ADDRESS,
                key: Array.from(Buffer.from(`AccountDeployedSCs_${acc}`, "utf16le"))
            }]
        ).then(r => {
            console.log(r[0].final_value);
            const data = new Args(r[0].final_value as number[]);
            const total = Number(data.nextU32());
            console.log(`Total: ${total}`);
            for(let i=1; i<=total; i++) {
                const scInfo = new Args(Array.from(data.nextUint8Array()));
                console.log(`none: ${scInfo.nextU32()}, type: ${scInfo.nextString()}, addr: ${scInfo.nextString()}\n`)
            }
        })
    }
}