# Development and Deployment

## Prerequisites

- Node.js 16.0+

The project uses Prettier for formatting, as well as ESLint and Stylelint for linting. You can have a look at their respective editor integration documentation to see how to use them with your development environment:

- [Prettier](https://prettier.io/docs/en/editors)
- [ESLint](https://eslint.org/docs/latest/use/integrations#editors)
- [Stylelint](https://github.com/stylelint/awesome-stylelint#editor-integrations)

## Run project locally

To start:

```
npm install
npm start
```

Then open your browser at http://localhost:3000/

## Create productive build

```
npm run build
npm run serve
```

The `build` command will output all the files needed for serving the web application to the `dist` folder.

## Deploy to [GitHub Pages](https://pages.github.com/)

The application is set up to be deployed to Github pages using Github Actions. To configure your repository to support the workflow, follow steps 1-5 of ["Publishing with a custom GitHub Action workflow"](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site#publishing-with-a-custom-github-actions-workflow).
