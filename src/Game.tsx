import { PublicKey } from '@solana/web3.js';
import React, { useEffect, useState } from 'react';
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import * as anchor from '@project-serum/anchor';
import { BN } from "@project-serum/anchor";
import { useWorkspace } from "./useWorkspace";

type HealthState = {
  bump: number;
  health: BN;
}

export const Game = () => {
  const { wallet, program } = useWorkspace();
  const [ playerPda, setPlayerPda ] = useState<PublicKey | null>(null);
  const [ health, setHealth ] = useState<HealthState|null>(null);

  const updateHealth = async () => {
    if (!program || !playerPda) {
      throw new WalletNotConnectedError();
    }

    try {
      const healthState = await program.account.userHealth.fetch(playerPda);
      setHealth(healthState as HealthState)
    } catch (e) {
    }
  }


  useEffect(() => {
    if (!wallet || !program) {
      return;
    }

    (async() => {
      const [playerPDA, _] = await PublicKey.findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode("GAME_NAME-health"),
          wallet.publicKey.toBuffer(),
        ],
        program.programId,
      );

      setPlayerPda(playerPDA);
    })()
  }, [wallet, program]);

  useEffect(() => {
    (async() => {
      if (!program || !playerPda) {
        return;
      }

      await updateHealth();
    })()
  }, [playerPda, program]);

  const init = async () => {
    if (!wallet || !program) throw new WalletNotConnectedError();

    if (!playerPda) {
      return;
    }

    await program.methods
      .initialize()
      .accounts({
        healthAccount: playerPda,
        player: wallet.publicKey,
      })
      .rpc();
  }

  const start = async () => {
    if (!wallet || !program) throw new WalletNotConnectedError();

    if (!playerPda) {
      return;
    }

    await init();
    await updateHealth();
  };

  const buy = async () => {
    if (!wallet || !program) throw new WalletNotConnectedError();

    if (!playerPda) {
      return;
    }

    const tx = await program.methods
      .buyHealth()
      .accounts({
        healthAccount: playerPda,
        player: wallet.publicKey,
        admin: new PublicKey([0x08, 0x77, 0xa5, 0xa7, 0x80, 0x51, 0xac, 0x50, 0x8e, 0x3e, 0x69, 0xa4, 0x9c, 0x1c, 0xc1, 0xf3, 0xbf, 0x18, 0x2b, 0x79, 0x29, 0x59, 0xa5, 0x2d, 0xcd, 0x1d, 0xdb, 0xf5, 0xae, 0x0f, 0xae, 0x39])
      })
      .rpc();

    console.log({ transactionSignature: tx });
  }

  return (
    <React.Fragment>
      {!health && (
        <button onClick={start} disabled={!wallet}>
          Init
        </button>
      )}

      {health && (
        <div>
          <h2>Health</h2>
          <div><strong>Bump:&nbsp;</strong>{health.bump}</div>
          <div><strong>Health:&nbsp;</strong>{health.health.toString()}</div>
        </div>
      )}

      <button onClick={buy} disabled={!wallet}>Buy</button>
    </React.Fragment>
  )
}

export default Game;