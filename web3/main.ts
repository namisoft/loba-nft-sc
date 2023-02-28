import { Erc721Caller } from "./erc721-caller";
import { Erc721FactoryCaller } from "./erc721-factory-caller";
import { ContractRegistryCaller } from "./registry-caller";

(async () => {
    // const caller = new Erc721Caller();
    // await caller.init();
    // await caller.tokenURI();

    // const caller = new Erc721FactoryCaller();
    // await caller.init();
    // await caller.createErc71Contract();

    const caller = new ContractRegistryCaller();
    await caller.init();
    //await caller.createErc721Factory();
    await caller.getNonceOf("A1RrTFcNzLBtj85ofzEPDviA8QoFm756WzYMnEtuLrFEQwY99Tc");
    await caller.getDeployedContracts("A1RrTFcNzLBtj85ofzEPDviA8QoFm756WzYMnEtuLrFEQwY99Tc");
})();