---
title: 'Admin UI Theming & Branding'
---

The Vendure Admin UI can be themed to your company's style and branding.
    
## AdminUiPlugin branding settings

The `AdminUiPlugin` allows you to specify your "brand" name, and allows you to control whether to display the Vendure name and version in the UI. Specifying a brand name will also set it as the title of the Admin UI in the browser.

```ts title="src/vendure-config.ts"
import { VendureConfig } from '@bb-vendure/core';
import { AdminUiPlugin } from '@bb-vendure/admin-ui-plugin';

export const config: VendureConfig = {
    // ...
    plugins: [
        AdminUiPlugin.init({
            // ...
            adminUiConfig:{
                brand: 'My Store',
                hideVendureBranding: false,
                hideVersion: false,
            }
        }),
    ],
};
```

:::note
For the simple level of branding shown above, the `@bb-vendure/ui-devkit` package is not required.
:::

## Specifying custom logos

You can replace the Vendure logos and favicon with your own brand logo:

1. Install `@bb-vendure/ui-devkit`
2. Configure the AdminUiPlugin to compile a custom build featuring your logos:
    ```ts title="src/vendure-config.ts"
    import path from 'path';
    import { AdminUiPlugin } from '@bb-vendure/admin-ui-plugin';
    import { VendureConfig } from '@bb-vendure/core';
    import { compileUiExtensions, setBranding } from '@bb-vendure/ui-devkit/compiler';
    
    export const config: VendureConfig = {
        // ...
        plugins: [
            AdminUiPlugin.init({
                app: compileUiExtensions({
                    outputPath: path.join(__dirname, '../admin-ui'),
                    extensions: [
                        setBranding({
                            // The small logo appears in the top left of the screen  
                            smallLogoPath: path.join(__dirname, 'images/my-logo-sm.png'),
                            // The large logo is used on the login page  
                            largeLogoPath: path.join(__dirname, 'images/my-logo-lg.png'),
                            faviconPath: path.join(__dirname, 'images/my-favicon.ico'),
                        }),
                    ],
                }),
            }),
        ],
    }
    ```

## Theming

Much of the visual styling of the Admin UI can be customized by providing your own themes in a Sass stylesheet. For the most part, the Admin UI uses [CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*) to control colors and other styles. Here's a simple example which changes the color of links:

1. Install `@bb-vendure/ui-devkit`
2. Create a custom stylesheet which overrides one or more of the CSS custom properties used in the Admin UI:
    ```css title="my-theme.scss"
    :root {
      --clr-link-active-color: hsl(110, 65%, 57%);
      --clr-link-color: hsl(110, 65%, 57%);
      --clr-link-hover-color: hsl(110, 65%, 57%);
      --clr-link-visited-color: hsl(110, 55%, 75%);
    }
    ```
   To get an idea of which custom properties are available for theming, take a look at the source of the [Default theme](https://github.com/vendure-ecommerce/vendure/tree/master/packages/admin-ui/src/lib/static/styles/theme/default.scss) and the [Dark theme](https://github.com/vendure-ecommerce/vendure/tree/master/packages/admin-ui/src/lib/static/styles/theme/dark.scss)
3. Set this as a globalStyles extension:   
    ```ts title="src/vendure-config.ts"
    import path from 'path';
    import { AdminUiPlugin } from '@bb-vendure/admin-ui-plugin';
    import { VendureConfig } from '@bb-vendure/core';
    import { compileUiExtensions } from '@bb-vendure/ui-devkit/compiler';
    
    export const config: VendureConfig = {
        // ...
        plugins: [
            AdminUiPlugin.init({
                app: compileUiExtensions({
                    outputPath: path.join(__dirname, '../admin-ui'),
                    extensions: [{
                        globalStyles: path.join(__dirname, 'my-theme.scss')
                    }],
                }),
            }),
        ],
    }
    ```

Some customizable styles in [Clarity](https://clarity.design/), the Admin UI's underlying UI framework, are controlled by Sass variables, which can be found on the [project's GitHub page](https://github.com/vmware-clarity/ng-clarity/blob/689a572344149aea90df1676eae04479795754f3/projects/angular/src/utils/_variables.clarity.scss). Similar to above, you can also provide your own values, which will override defaults set by the framework. Here's an example which changes the [height of the main header](https://github.com/vmware-clarity/ng-clarity/blob/689a572344149aea90df1676eae04479795754f3/projects/angular/src/layout/main-container/_variables.header.scss#L10):

1. Install `@bb-vendure/ui-devkit` if not already installed
2. Create a custom stylesheet which overrides the target variable(s):
    ```css title="my-variables.scss"
    $clr-header-height: 4rem;
    ```
3. Set this as a `sassVariableOverrides` extension:
    ```ts title="src/vendure-config.ts"
    import path from 'path';
    import { AdminUiPlugin } from '@bb-vendure/admin-ui-plugin';
    import { VendureConfig } from '@bb-vendure/core';
    import { compileUiExtensions } from '@bb-vendure/ui-devkit/compiler';

    export const config: VendureConfig = {
        // ...
        plugins: [
            AdminUiPlugin.init({
                app: compileUiExtensions({
                    outputPath: path.join(__dirname, 'admin-ui'),
                    extensions: [{
                        sassVariableOverrides: path.join(__dirname, 'my-variables.scss')
                    }],
                }),
            }),
        ],
    }
    ```

`globalStyles` and `sassVariableOverrides` extensions can be used in conjunction or separately.
