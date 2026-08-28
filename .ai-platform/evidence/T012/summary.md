# T012 Evidence Summary

Status: Needs_Review

Every local and Docker attempt now has an explicit `timeouts.overallMs` budget, defaulting to ten minutes. Docker applies the signal across image inspection/build and worker execution, terminates the owned process tree, force-removes the deterministic container name as a fallback, and maps expiry to infrastructure exit code 3. The local runner uses the same budget and classification.

DSH web boot, route non-response and browser navigation failures use DSH/infrastructure failure kinds. Completed HTTP or DOM mismatches stay ordinary plugin assertion failures. Existing exit codes and the v1 report schema are unchanged.

The local cold-image reproduction expired at exactly the global budget during a slow Chromium package download, returned the infrastructure message, and left no owned container. Protected GitHub CI run [33061801560](https://github.com/iiwish/dsh-testkit/actions/runs/33061801560) separately passed the normal real-host browser path and three-version compatibility matrix.
