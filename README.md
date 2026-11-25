# ziyueli-site

Static site for Ziyue Li. Hosted on GitHub Pages. No framework.

## Edit and build

1. Set your details in `site.config.json`: `url`, `domain`, `email`, `linkedin`, `ga4`.
2. Run `node build.mjs`. It needs Node 18 or newer. It has no packages to install.
3. Commit the changed files and push to `main`.

The build writes `index.html`, `apps/*/index.html`, `sitemap.xml`, `robots.txt`, `llms.txt`, `404.html` and `CNAME`.

Edit app text in `data/apps.json`. Edit the home page in `src/index.template.html`.
Do not edit `index.html` by hand. The build overwrites it.

## Publish on GitHub Pages

1. Push this folder to the repo root on branch `main`.
2. In the repo, open Settings, then Pages. Set Source to "Deploy from a branch", branch `main`, folder `/ (root)`.
3. For a custom domain, set `domain` in `site.config.json`, set `url` to `https://<domain>`, run the build, and push.
   Add the DNS records that GitHub lists, then turn on "Enforce HTTPS".

## After launch

1. Add the site in Google Search Console and verify it with a DNS record.
2. Submit `sitemap.xml`.
3. Optional: set `ga4` to your measurement ID and run the build again.

## Privacy, analytics and fonts

- `privacy/index.html` is built by `build.mjs` and linked from every footer and next to the booking buttons.
- Analytics is off until `ga4` in `site.config.json` has a Measurement ID. With an ID, the build writes `assets/consent.js`. It shows a cookie box (Accept or Decline). It loads Google Analytics only after Accept. A "Cookie settings" link in each footer re-opens the box.
- Set GA4 data retention to 2 months, and turn off Google signals and ad features in the GA4 admin.
- Fonts (Geologica, Figtree) are in `assets/fonts/`. The site makes no request to Google Fonts.
- Test the cookie box without editing the config: `GA4_ID=G-TEST000000 node build.mjs`. Then run `node build.mjs` again and delete `assets/consent.js` before you publish.
