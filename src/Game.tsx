import {LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction} from '@solana/web3.js';
import React, { useEffect, useState } from 'react';
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import * as anchor from '@project-serum/anchor';
import { BN } from "@project-serum/anchor";
import { useWorkspace } from "./useWorkspace";
import {useWallet} from "@solana/wallet-adapter-react";

type HealthState = {
  bump: number;
  health: BN;
}

const admin = new PublicKey([0x08, 0x77, 0xa5, 0xa7, 0x80, 0x51, 0xac, 0x50, 0x8e, 0x3e, 0x69, 0xa4, 0x9c, 0x1c, 0xc1, 0xf3, 0xbf, 0x18, 0x2b, 0x79, 0x29, 0x59, 0xa5, 0x2d, 0xcd, 0x1d, 0xdb, 0xf5, 0xae, 0x0f, 0xae, 0x39]);

export const Game = () => {
  const { wallet, program, connection } = useWorkspace();
  const { sendTransaction } = useWallet();
  const [ playerPda, setPlayerPda ] = useState<PublicKey | null>(null);
  const [ health, setHealth ] = useState<HealthState|null>(null);
  const [ loading, setLoading ] = useState<boolean>(false);

  const updateHealth = async () => {
    if (!program || !playerPda) {
      throw new WalletNotConnectedError();
    }

    try {
      const healthState = await program.account.userHealth.fetch(playerPda);
      setHealth(healthState as HealthState)

      program.account.userHealth.subscribe(playerPda).on('change', (e) => {
        setHealth(e as HealthState);
      });
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

    setLoading(true);
    try {
      await init();
      await updateHealth();
    } finally {
      setLoading(false)
    }
  };

  const reduceHealth = async () => {
    if (!wallet || !program) throw new WalletNotConnectedError();

    if (!playerPda) {
      return;
    }

    await program.methods
      .reduceHealth(new anchor.BN(2))
      .accounts({
        healthAccount: playerPda,
        player: wallet.publicKey,
        admin,
      })
      .rpc();
  }

  const isAdmin = () => {
    return wallet?.publicKey.equals(admin);
  }

  const buyHealth = async () => {
    if (!wallet || !program) throw new WalletNotConnectedError();

    if (!playerPda) {
      return;
    }

    setLoading(true);

    try {
      // await program.
      const transaction = new Transaction();

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: playerPda,
          lamports: 9 * LAMPORTS_PER_SOL / 10,
        })
      );

      transaction.add(
        program.instruction
          .buyHealth({
            accounts: {
              healthAccount: playerPda,
              player: wallet.publicKey,
              admin: admin,
            }
          })
      );

      const signature = await sendTransaction(transaction, connection);

      await connection.confirmTransaction(signature, 'processed');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <React.Fragment>
        Loading...
      </React.Fragment>
    )
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

      <button onClick={buyHealth} disabled={!wallet}>Buy</button>
      {/*<button onClick={reduceHealth} disabled={!wallet && !isAdmin()}>Reduce Health on 2*</button>*/}
      {/*<div>* Admin decides to reduce health amount (should never be done from the frontend, it is here only for demo purposes. Allowed only for admin</div>*/}
    </React.Fragment>
  )
}

export default Game;