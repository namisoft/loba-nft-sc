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

const ERC721_FACTORY_ADDRESS =
  "A16gXC1LKF5ojVEX4qrJsnAqywiq3k6iy7LRgeQd1SmUtdoPtFk";

export class Erc721FactoryCaller {
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

  async createErc71Contract(): Promise<string> {

    await this.web3Client.smartContracts().callSmartContract({
      /// storage fee for taking place in books
      fee: 0,
      /// The maximum amount of gas that the execution of the contract is allowed to cost.
      maxGas: 70000000,
      /// Extra coins that are spent from the caller's balance and transferred to the target
      coins: 10_000_000_000,
      /// Target smart contract address
      targetAddress: ERC721_FACTORY_ADDRESS,
      /// Target function name. No function is called if empty.
      functionName: "initialize",
      /// Parameter to pass to the target function
      parameter: new Args()
      .addString("A1RrTFcNzLBtj85ofzEPDviA8QoFm756WzYMnEtuLrFEQwY99Tc")
      .addString("MyMassaNFT")
      .addString("MMN")
      .addU64(BigInt(666888))
      .addString("/my/massa/nft")
      .addF32(109.1)
      .addF32(211.09)
      .addF32(50.68)
      .addU64(BigInt(9_000_000_000))
      .serialize(),
    }).then((r) => console.log(r));


    return "";
  }
}
