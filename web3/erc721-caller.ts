import "dotenv/config";
import { Client, EOperationStatus, IAccount, IClientConfig, ProviderType, WalletClient, Args} from "@massalabs/massa-web3";
import fs from "fs";
import { toBytes } from "@massalabs/massa-as-sdk";

const DEFAULT_PUBLIC_RPC = "https://test.massa.net/api/v2:33035";
const DEFAULT_PRIVATE_RPC = "https://test.massa.net/api/v2:33034";

const ERC721_ADDRESS = "A1nMzVDa5u9LWFTfQcGUxqGuyQZSA7nxYGnCx1F784KJRvkB7nr";

export class Erc721Caller {
    callerAccount = {} as IAccount;
    web3Client = {} as Client;

    async init() {
        if (!process.env.WALLET_PRIVATE_KEY) {
            throw new Error("WALLET_PRIVATE_KEY is not set. Did you create environment file \".env\" ?");
        }

        this.callerAccount = await WalletClient.getAccountFromSecretKey(process.env.WALLET_PRIVATE_KEY);

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

    async tokenURI(): Promise<string> {
        await this.web3Client.publicApi().getDatastoreEntries(
            [{
                address: ERC721_ADDRESS,
                key: Array.from(Buffer.from("baseURI", "utf16le"))
            }]
        ).then(r => console.log(r[0].final_value?.map(c => String.fromCharCode(c)).join('')));

        await this.web3Client.publicApi().getDatastoreEntries(
            [{
                address: ERC721_ADDRESS,
                key: Array.from(Buffer.from("maxSupply", "utf16le"))
            }]
        ).then(r => console.log(r[0].final_value));
        
        await this.web3Client.smartContracts().readSmartContract({
            targetAddress: ERC721_ADDRESS,
            targetFunction: "tokenURI",
            parameter: new Args().addU32(BigInt(1)).serialize(),
            fee: 0,
            maxGas: 70000000
        }).then(r => console.log(r));
        return "";
    }

    

}

