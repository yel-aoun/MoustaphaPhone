# Delivery workflow

The user wants completed changes in this project pushed to GitHub and deployed to
Vercel by default. After appropriate checks pass, commit the task's changes, push
them, and deploy through the existing Vercel integration. Verify that the production
deployment succeeds and report the live URL. Do not stop at local implementation
unless the user explicitly requests it or a concrete blocker prevents delivery.

Preserve unrelated work and never force-push to resolve remote divergence.
