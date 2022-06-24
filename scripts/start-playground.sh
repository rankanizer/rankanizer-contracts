trap "exit" INT TERM ERR
trap "kill 0" EXIT

echo "Setup start..."

echo "Starting ganache..."
npx ganache-cli -m "inhale path antenna catalog all uncover rebel orbit cupboard liquid more fit" &

echo "Migrating contracts..."
npm run migrate

echo "Starting playground..."
npm start

echo "Done! Press ctrl-c to stop ganache and playground."
wait