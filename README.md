# StockChief production status

Independent GitHub Pages availability page for https://app.stockchiefhq.com/.
The monitor reads production /healthz and /readyz about every minute. A healthy
web page cannot hide dead or overdue background work. Only component availability,
HTTP status, latency and check timestamps are published; response bodies, release
IDs, credentials and customer data are discarded.

site/production-status.json contains production-only observations. Retired staging
history remains untouched in site/status.json and is never counted as production
uptime. The latest 1,440 observations are retained for detail; daily counters retain
the exact observed success percentage for the last 30 UTC calendar days without
making the downloaded history grow on every one-minute tick.

Run node --test monitor.test.mjs for production target, dependency failure, timeout,
stale monitoring, rollover, replay, isolated history and recovery checks. Run
node monitor.mjs to save one real production observation. No package dependencies
or new hosting subscriptions are needed.

One bounded job (loop.mjs) checks for about five and a half hours, then hands over.
The production concurrency group prevents overlapping production writers. A retired
staging run can finish separately without touching production history. The page reads
the latest observations from the repository, with its separately published copy as
a fallback. Neither delayed schedules nor failed individual checks end the loop.

Two consecutive failed checks open one production outage issue; recovery closes it.
The watchdog requests a restart and opens a separate issue if observations are over
five minutes old. GitHub notification settings govern actual notification delivery;
this is not proof of a staffed incident response. A four-minute-old observation shows
unknown on the page, never a false green status.

No check guarantees individual imports, AI quality, provider availability, payment
delivery or a service-level agreement. Short interruptions between checks can be missed.
