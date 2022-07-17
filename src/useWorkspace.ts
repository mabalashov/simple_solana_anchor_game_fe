import {useAnchorWallet} from "@solana/wallet-adapter-react";
import {Connection} from "@solana/web3.js";
import {useMemo} from "react";
import * as anchor from "@project-serum/anchor";
import idl from "./idl/simple_solana_anchor_game.json";
import config from "./config";

export const useWorkspace = () => {
  const programId = new anchor.web3.PublicKey(idl.metadata.address)
  const wallet = useAnchorWallet();
  const connection = new Connection(config.rpcUrl);

  const provider = useMemo(() => {
    if (!wallet) {
      return;
    }
    return new anchor.AnchorProvider(connection, wallet, {});
  }, [wallet]);

  const program = useMemo(() => {
    if (!provider) {
      return;
    }

    return new anchor.Program(idl as anchor.Idl, programId, provider);
  }, [provider])

  return {
    wallet,
    connection,
    provider,
    program,
  }
}

export default useWorkspace;