# ACTIVE WORKING DIRECTORY: /work/platform-v1

All new development, file creation, and refactors must happen inside this folder.

## READ-ONLY AREAS (DO NOT MODIFY)

- `/public`
- `/core`
- `/server.cjs`
- `/site_controller.mjs`
- `package.json`
- `firebase.json`
- Repo root runtime files

These are the current live runtime and must remain untouched.

## ALLOWED ACTIONS

- Read files from root for reference
- Copy files INTO /work/platform-v1 when beginning migration
- Create new modular structure inside /work/platform-v1

## NOT ALLOWED

- Move runtime files
- Edit runtime configs
- Change build paths
- Rewrite imports in the root app

## TASK CHECK

At the start of every task: list any file that would be modified outside this folder.  
If any change would touch outside this folder → STOP and report.
