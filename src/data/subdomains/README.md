# Subdomain Sites

Each subdomain is a standalone static website.

Folder structure:

```text
src/
  data/
    subdomains/
      <subdomain>/
        index.html
        styles.css
        script.js
        assets/
```

Example:

```text
src/data/subdomains/
  example/
    index.html
    styles.css
    script.js
    assets/
      logo.png
      hero.jpg
```

## What this means

- The files inside a subdomain folder are plain HTML, CSS, and JavaScript.
- You can build a completely custom site without React components, data objects, or app-specific presets.
- Anything inside `src/data/subdomains/<subdomain>/` is copied to `dist/subdomains/<subdomain>/` during build.

## Subdomain app sources

Some subdomains can be full app sources inside this folder instead of plain static files.
`mybirth.swymble.com` is built from `src/data/subdomains/mybirth/`, and the root build writes it into `dist/subdomains/mybirth/`.
`what2watch.swymble.com` works the same way: it is built from `src/data/subdomains/what2watch/` into `dist/subdomains/what2watch/`.

## How to add a new subdomain site

1. Create a folder at `src/data/subdomains/<subdomain>/`.
2. Add an `index.html` file.
3. Add any CSS, JS, images, fonts, or extra pages that site needs.
4. Use relative links inside the subdomain site when possible, such as `./styles.css`, `./script.js`, `./about.html`, or `./assets/logo.png`.
5. Start the main dev server with `npm run dev`.
6. Open `http://<subdomain>.localhost:5173/`.

If the folder exists, the dev server automatically serves that site on the matching localhost subdomain. No app code changes are required.

## Custom-domain sites

A folder here doesn't have to be served on a `*.swymble.com` subdomain. If it
carries a `CNAME` file (GitHub Pages convention) naming a custom domain,
`scripts/lib/subdomains.mjs` uses that domain when scaffolding/reading its SEO
files, and a Cloudflare Worker on that domain's zone routes requests to
`/subdomains/<name>/` on the swymble.com origin.

`watchpaintdry/` is the reference example: it lives at
`https://www.watchpaintdry.net/`, routed by
`cloudflare/watchpaintdry-worker.js` (setup steps in that file's header).

## Multi-page sites

You can add more pages inside the same folder, for example:

```text
src/data/subdomains/example/
  index.html
  about.html
  pricing.html
  contact.html
  styles.css
  script.js
```

Then open pages like:

```text
http://example.localhost:5173/about.html
```

## Production setup

1. Deploy the main Swymble site as usual.
2. In Cloudflare DNS, create the subdomain record, such as `example.swymble.com`.
3. Point that record to the same frontend host used by the main site, if your hosting setup expects that.
4. Ensure requests for that hostname can reach the built files under `dist/subdomains/<subdomain>/`.

Depending on your host, that last step is usually one of these:

- A custom domain attached to the same static site deployment, where the host serves the root `index.html` and the built-in redirect sends the request to `/subdomains/<subdomain>/...`
- A rewrite or redirect rule that maps `https://<subdomain>.swymble.com/*` to `/subdomains/<subdomain>/$1`
- A Worker, proxy rule, or host-level rewrite if your platform needs explicit path routing

## Minimal starter example

`index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your Site</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <main>
      <h1>Your subdomain site</h1>
      <p>Build this however you want.</p>
    </main>
    <script src="./script.js"></script>
  </body>
</html>
```

`styles.css`

```css
body {
  margin: 0;
  font-family: sans-serif;
}
```

`script.js`

```js
console.log('Subdomain site loaded');
```
