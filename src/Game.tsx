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

// PLEASE REMOVE THIS KEY FROM THE FRONTEND
// IT IS ONLY FOR TEST PURPOSES
const admin = anchor.web3.Keypair.fromSecretKey(Uint8Array.from([156,198,191,61,96,160,43,194,156,56,2,96,199,212,17,19,138,37,113,27,194,195,26,174,215,147,141,181,24,25,26,15,8,119,165,167,128,81,172,80,142,62,105,164,156,28,193,243,191,24,43,121,41,89,165,45,205,29,219,245,174,15,174,57]));
// const admin = new PublicKey([0x08, 0x77, 0xa5, 0xa7, 0x80, 0x51, 0xac, 0x50, 0x8e, 0x3e, 0x69, 0xa4, 0x9c, 0x1c, 0xc1, 0xf3, 0xbf, 0x18, 0x2b, 0x79, 0x29, 0x59, 0xa5, 0x2d, 0xcd, 0x1d, 0xdb, 0xf5, 0xae, 0x0f, 0xae, 0x39]);

export const Game = () => {
  const { wallet, program, connection } = useWorkspace();
  const { sendTransaction } = useWallet();
  const [ playerPda, setPlayerPda ] = useState<PublicKey | null>(null);
  const [ bankAccountPda, setBankAccountPda ] = useState<PublicKey | null>(null);
  const [ health, setHealth ] = useState<HealthState|null>(null);

  const [ amount, setAmount ] = useState<string|null>('9');
  const [ rewardAmount, setRewardAmount ] = useState<string|null>('2');
  const [ healthAmount, setHealthAmount ] = useState<string|null>('2');

  const [ loading, setLoading ] = useState<boolean>(false);
  const [ bankAccountBalance, setBankAccountBalance ] = useState<number|null>(null);
  const [ playerAccountBalance, setPlayerAccountBalance ] = useState<number|null>(null);

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
      const bankAccountPDA = (await PublicKey.findProgramAddress(
        [
            anchor.utils.bytes.utf8.encode("GAME_NAME-bank")
          ],
          program.programId)
      )[0];

      setBankAccountPda(bankAccountPDA);
    })();
  }, [wallet, program]);

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

  useEffect(() => {
    if (!wallet || !program) {
      return;
    }

    doFetchBankBalance();
    doFetchPlayerBalance();
  }, [wallet, program, bankAccountPda]);

  const doFetchBankBalance = async () => {
    if (!wallet || !program) throw new WalletNotConnectedError();

    if (!bankAccountPda) {
      return;
    }

    const balance = await program.provider.connection.getBalance(bankAccountPda);
    setBankAccountBalance(balance);
  }

  const doFetchPlayerBalance = async () => {
    if (!wallet || !program) throw new WalletNotConnectedError();

    if (!playerPda) {
      return;
    }

    const balance = await program.provider.connection.getBalance(wallet.publicKey);
    // const balance = await program.provider.connection.getBalance(playerPda);
    setPlayerAccountBalance(balance);
  }

  const initPlayer = async () => {
    if (!wallet || !program) throw new WalletNotConnectedError();

    if (!playerPda) {
      return;
    }

    // ...
    await program.methods
      .initialize()
      .accounts({
        healthAccount: playerPda,
        player: wallet.publicKey,
      })
      .rpc();
    // let healthState = await program.account.userHealth.fetch(playersPDA);
  }

  const doCreatePlayer = async () => {
    if (!wallet || !program) throw new WalletNotConnectedError();

    if (!playerPda) {
      return;
    }

    setLoading(true);
    try {
      await initPlayer();
      await updateHealth();
    } finally {
      setLoading(false)
    }
  };

  const doTakeRewards = async () => {
    if (!wallet || !program) throw new WalletNotConnectedError();

    if (!playerPda || !bankAccountPda || !rewardAmount) {
      return;
    }

    await program.methods
      .grantReward(new anchor.BN(rewardAmount))
      .accounts({
        healthAccount: playerPda,
        player: wallet.publicKey,
        admin: admin.publicKey,
        bankAccount: bankAccountPda,
      })
      .signers([admin])
      .rpc();

    await doFetchBankBalance();
    await doFetchPlayerBalance();
  }

  const doReduceHealth = async () => {
    if (!wallet || !program) throw new WalletNotConnectedError();

    if (!playerPda || !bankAccountPda || !healthAmount) {
      return;
    }

    await program.methods
      .reduceHealth(new anchor.BN(healthAmount))
      .accounts({
        healthAccount: playerPda,
        player: wallet.publicKey,
        admin: admin.publicKey,
      })
      .signers([admin])
      .rpc();

    await doFetchBankBalance();
    await doFetchPlayerBalance();
  }

  const doBuyHealth = async () => {
    if (!wallet || !program) throw new WalletNotConnectedError();

    if (!playerPda || !bankAccountPda) {
      return;
    }

    setLoading(true);

    try {
      // await program.methods
      //   .initializeBank()
      //   .accounts({
      //     bankAccount: bankAccountPda,
      //     signer: wallet.publicKey,
      //   })
      //   .rpc();

      // await program.
      const transaction = new Transaction();

      const buyAmount = Number(amount);

      if (!buyAmount) {
        alert(`Not valid amount`);
      }

      transaction.add(
        program.instruction
          .initializeBank({
            accounts: {
              bankAccount: bankAccountPda,
              signer: wallet.publicKey,

              systemProgram:  SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: bankAccountPda,
                lamports: buyAmount * LAMPORTS_PER_SOL / 10,
              }).programId
            }
          })
      );

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: playerPda,
          lamports: buyAmount * LAMPORTS_PER_SOL / 10,
        })
      );

      transaction.add(
        program.instruction
          .buyHealth({
            accounts: {
              healthAccount: playerPda,
              player: wallet.publicKey,
              bankAccount: bankAccountPda,
            }
          })
      );

      const signature = await sendTransaction(transaction, connection);

      await connection.confirmTransaction(signature, 'processed');

      await doFetchBankBalance();
      await doFetchPlayerBalance();
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
      <div>
        <h2>Bank account</h2>
        <div>
          <strong>Balance: </strong>{bankAccountBalance}&nbsp;
          <button onClick={doFetchBankBalance} disabled={!wallet}>update</button>
        </div>
      </div>

      <div>
        <h2>Game</h2>
        <div>
          <strong>Player Balance: </strong>{playerAccountBalance}&nbsp;
          <button onClick={doFetchPlayerBalance} disabled={!wallet}>update</button>
        </div>

        {!health && (
          <button onClick={doCreatePlayer} disabled={!wallet}>
            Init
          </button>
        )}

        {health && (
          <div>
            <h3>Health</h3>
            <div><strong>Bump:&nbsp;</strong>{health.bump}</div>
            <div><strong>Health:&nbsp;</strong>{health.health.toString()}</div>

            <div>
              <input
                value={`${amount}`}
                onChange={(e) => setAmount(e.target.value)}
              />
              <button onClick={doBuyHealth} disabled={!wallet}>Buy</button>
            </div>

            <br />

            <div>
              <input
                value={`${rewardAmount}`}
                onChange={(e) => setRewardAmount(e.target.value)}
              />
              <button onClick={doTakeRewards} disabled={!wallet}>Take reward</button>
            </div>


          </div>
        )}
      </div>

      <div>
        <h2>Admin</h2>

        {health && (
          <div>
            <input
              value={`${healthAmount}`}
              onChange={(e) => setHealthAmount(e.target.value)}
            />
            <button onClick={doReduceHealth} disabled={!wallet}>Reduce Health</button>
          </div>
        )}
      </div>

    </React.Fragment>
  )
}

export default Game;