Prepare
===

Install deps:

```shell
npm i
```

Please copy the `idl` after deploying the program:

```shell
cp $PROGRAM_PATH/simple-solana-anchor-game/target/idl/simple_solana_anchor_game.json ./src/idl
```

Config
===

Configs are stored in `src/config.json`:

```json
{
  "rpcUrl": "http://127.0.0.1:8899"
}
```

Configure Localnet Backend for test
===

Run Solana testnet:
```shell
solana-test-validator -r
```

Compile and deploy Anchor program
```shell
anchor build
anchor deploy
```

Transfer some tokens to your wallet, you are using in Phantom:
```shell
solana transfer --allow-unfunded-recipient  <wallet>  10
```

Run
===

There is create-react-app under the hood, so all its scripts are available

To run in the development mode:

```shell
npm run start
```

...and open http://localhost:3000

HowTo
===

Click "Init" if you are running the first time. The player account will be initialized

After approving transaction please wait 20 seconds and all controls will appear

Actually, all operation tooks apx 20 seconds to be performed

The balances in the UI are not updating automatically. Please click update each time


