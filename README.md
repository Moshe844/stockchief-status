# StockChief staging status

Independent public availability page and GitHub Actions checks about every five minutes for the public StockChief staging health endpoint. GitHub Pages hosts the status page outside Render.

Only public service availability, HTTP status, response latency and check timestamps are stored. The monitor discards response bodies and does not use customer data, application credentials or internal release details.

The displayed percentage measures observed checks. Scheduling delays are shown as unknown; short interruptions between checks may be missed. Repository workflow notifications can alert maintainers when a check fails.

Run `node --test monitor.test.mjs` to verify healthy, outage, timeout, malformed-response and stale-monitoring behavior. Run `node monitor.mjs` to save one real observation. There are no package dependencies or paid service subscriptions.

One long-running job (`loop.mjs`) takes a check every five minutes for about five and a half hours, then the next run takes over. GitHub can delay schedules by hours and a dispatch can fail, so the checks do not depend on either: the schedule keeps a run queued behind the current one, and a failed step is logged and the next tick carries on. The page reads the checks straight from the repository, so it does not have to be republished for each one.

Alerts are GitHub issues, which email the repository owner: one after two failed checks in a row, closed on recovery, and one from `watchdog.yml` if checks stop for more than 20 minutes. If checks stop, the page also shows an alert with the age of the last check.
