# Netlify publishing

Connected 29 September 2026. The BTI Netlify project is
`bti-agriculture-tracker-review-2026` at
`https://bti-agriculture-tracker-review-2026.netlify.app/`. It now deploys the
`main` branch of the BTI GitHub repository. The first Git-based production
deploy published successfully on 29 September 2026. The local `.netlify/`
state now points to this BTI project rather than the older unrelated site.

The public BTI GitHub repository is
`https://github.com/breakthroughinstitute/sustainable-intensification-tracker`.
This folder's Git `main` branch tracks `origin/main` and is aligned with the
GitHub history. Pushing from a local Git client requires GitHub authentication.

The `.gitignore` allows only the five finished site files, the logo, deployment
configuration, and these instructions into Git. `sh build.sh` copies only the
six site files into `dist/`.
Netlify's `netlify.toml` publishes `dist/`, leaving `research/`, `mockups/`,
archives, notes, and local state out of the public deploy.

To publish future changes:

1. Edit the tracker files in this folder.
2. Commit and push the changes to GitHub `main` using an authenticated Git
   client, or make the changes through the connected GitHub account.
3. Netlify builds and publishes each push automatically using `sh build.sh`
   and `dist/`. Saving a local file alone does not update the site.

Check the deployment in the [Netlify project](https://app.netlify.com/projects/bti-agriculture-tracker-review-2026/deploys)
and the [live tracker](https://bti-agriculture-tracker-review-2026.netlify.app/)
after a push. The first Git-based deploy listed seven files: the six intended
site files plus Netlify's copy of `netlify.toml`; no research or mockup files
were present.

The Git repository is deliberately restricted to finished site files. Before
adding new images or data files, update both `.gitignore` and `build.sh` so the
new file is included in Git and the publish directory.
