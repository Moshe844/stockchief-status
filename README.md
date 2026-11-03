# StockChief staging status

Independent public availability page and GitHub Actions checks about every five minutes for the public StockChief staging health endpoint. GitHub Pages hosts the status page outside Render.

Only public service availability, HTTP status, response latency and check timestamps are stored. The monitor discards response bodies and does not use customer data, application credentials or internal release details.

The displayed percentage measures observed checks. Scheduling delays are shown as unknown; short interruptions between checks may be missed. Repository workflow notifications can alert maintainers when a check fails.

Run `node --test monitor.test.mjs` to verify healthy, outage, timeout, malformed-response and stale-monitoring behavior. Run `node monitor.mjs` to save one real observation. There are no package dependencies or paid service subscriptions.

Each run starts the next one after about four minutes, because GitHub can delay scheduled runs by hours. The schedule only restarts the chain if it breaks. If checks stop, the page shows an alert with the age of the last check.
