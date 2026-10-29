# Development and Deployment

## Prerequisites

- Node.js 22.12.0 or newer

The project uses Oxfmt for formatting, Oxlint for type-aware JavaScript/TypeScript linting, and Stylelint for CSS linting:

- [Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html)
- [Oxlint](https://oxc.rs/docs/guide/usage/linter.html)
- [Stylelint](https://github.com/stylelint/awesome-stylelint#editor-integrations)

## Run project locally

To start:

```
npm ci
npm start
```

Open the local URL printed by Vite, normally http://localhost:5173/.

## Check the source

```
npm run typecheck
npm run lint
npm run lint:css
npm run format:check
```

Use `npm run format` to format the source, or `npm run fix` to apply automatic lint and formatting fixes.

## Create a production build

```
npm run build
npm run serve
```

The `build` command type-checks the source and outputs all the files needed for serving the web application to the `dist` folder. The `serve` command previews that build at the URL printed by Vite.

## Deploy to [GitHub Pages](https://pages.github.com/)

The application is set up to be deployed to Github pages using Github Actions. To configure your repository to support the workflow, follow steps 1-5 of ["Publishing with a custom GitHub Action workflow"](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site#publishing-with-a-custom-github-actions-workflow).
