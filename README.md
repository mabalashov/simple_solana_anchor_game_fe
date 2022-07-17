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

Run
===

There is create-react-app under the hood, so all its scripts are available

To run in the development mode:

```shell
npm run start
```

...and open http://localhost:3000


