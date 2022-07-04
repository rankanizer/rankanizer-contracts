#!/usr/bin/env bash
trap "exit" INT TERM ERR
trap "kill 0" EXIT

echo "Setup start..."

echo "Starting ganache..."
npm run start-ganache --workspace @rankanizer-contracts/contracts &

echo "Migrating contracts..."
npm run migrate

echo 'REACT_APP_BALLOT_ADDRESS=0xB95c3bb8635c8961b973A247E5CA82bd5CEB79B2' > ./packages/playground/.env

echo "Starting playground..."
npm start &> /dev/null &

echo "Done! Press ctrl-c to stop ganache and playground."
wait