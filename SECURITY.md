# Security Policy

Thank you for taking the time to report a security vulnerability related to UniSync. This file describes how to responsibly report security issues, what information to include, and how we handle reports.

## Supported Versions

We support and provide security fixes for the following branches/releases:

- `main` (active development)

If your report affects an unlisted or very old forked version, we may ask you to reproduce the issue on `main` or a supported branch.

## Reporting a Vulnerability

Please do NOT open a public issue for security vulnerabilities. Instead, use one of the following methods to report an issue privately:

1. Email: `security@omerta-ops.example` (replace this placeholder with the project's real security contact)
2. GitHub: Use the repository's Security Advisories / "Report a vulnerability" feature: https://github.com/Omerta-Ops/UniSync/security/advisories

If you choose email, please encrypt your message using our PGP key and include the vulnerability details described below. If you do not have PGP set up, indicate that in your message and we will provide an alternative secure channel.

PGP public key (placeholder):

-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: Placeholder

mQENBFu...REPLACE_WITH_REAL_KEY...IDAQAB
-----END PGP PUBLIC KEY BLOCK-----

## What to Include in a Report

To help us triage and resolve the issue quickly, please include as much of the following as possible:

- A clear, concise description of the vulnerability and impact.
- The version of UniSync and any relevant environment details (OS, runtime, dependencies).
- Step-by-step reproduction instructions or a minimal reproduction case (code snippet, PoC, or test case).
- Expected vs. actual behavior.
- Any logs, stack traces, or error messages that help illustrate the issue.
- Whether you have a suggested fix or mitigation.

If you provide a PoC or exploit code, please mark it clearly in the report and do not publish it publicly until the vulnerability is fixed or coordinated disclosure is agreed.

## Our Process

1. Acknowledgement: We aim to acknowledge all vulnerability reports within 3 business days.
2. Triage: We will triage and classify the severity of the issue, and provide an estimated timeline for mitigation within 7 calendar days when possible.
3. Fix: We will develop and release a fix based on severity and risk. Critical issues will be prioritized.
4. Disclosure: We prefer coordinated disclosure. We will work with the reporter to agree on a disclosure timeline. We will request reasonable time to develop, test, and release fixes before public disclosure.

## Timeline Expectations

- Acknowledgement: within 3 business days
- Initial triage and classification: within 7 calendar days
- Patch or mitigation: timeframe depends on severity and complexity; critical fixes will be prioritized
- Public disclosure: coordinated with reporter unless legal or safety concerns prevent it

## Safe Harbor and Responsible Testing

We ask that researchers follow common-sense responsible disclosure practices:

- Do not test or attack production systems without prior authorization from the system owner.
- Do not access, modify, or exfiltrate other users' data.
- Keep reports confidential until a fix or coordinated disclosure is agreed.

We will not pursue legal action against good-faith security researchers who follow this policy.

## CVE and Credit

We will coordinate CVE assignment for valid vulnerabilities when appropriate. If you would like credit for reporting the issue, indicate how you would like to be credited (name, handle, or remain anonymous).

## No Bounty Policy

At this time, UniSync does not offer a public bug bounty program. If this changes, we will update this document and provide details.

## Contact & Alternatives

If email is not suitable, you can open a private security advisory via GitHub at:

https://github.com/Omerta-Ops/UniSync/security/advisories

If you are unsure how to proceed, open a support discussion or contact the maintainers and we will guide you.

---

Please replace placeholder contact details and PGP key with real values before publishing this file.