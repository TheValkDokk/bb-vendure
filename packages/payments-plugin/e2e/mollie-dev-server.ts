import { AdminUiPlugin } from '@bb-vendure/admin-ui-plugin';
import {
    ChannelService,
    DefaultLogger,
    DefaultSearchPlugin,
    LogLevel,
    mergeConfig,
    RequestContext,
} from '@bb-vendure/core';
import { createTestEnvironment, registerInitializer, SqljsInitializer, testConfig } from '@bb-vendure/testing';
import { compileUiExtensions } from '@bb-vendure/ui-devkit/compiler';
import gql from 'graphql-tag';
import localtunnel from 'localtunnel';
import path from 'path';

import { initialData } from '../../../e2e-common/e2e-initial-data';
import { molliePaymentHandler } from '../package/mollie/mollie.handler';
import { MolliePlugin } from '../src/mollie';

import { CREATE_PAYMENT_METHOD } from './graphql/admin-queries';
import {
    CreatePaymentMethodMutation,
    CreatePaymentMethodMutationVariables,
    LanguageCode,
} from './graphql/generated-admin-types';
import { AddItemToOrderMutation, AddItemToOrderMutationVariables } from './graphql/generated-shop-types';
import { ADD_ITEM_TO_ORDER, ADJUST_ORDER_LINE } from './graphql/shop-queries';
import { CREATE_MOLLIE_PAYMENT_INTENT, setShipping } from './payment-helpers';

/**
 * This should only be used to locally test the Mollie payment plugin
 * Make sure you have `MOLLIE_APIKEY=test_xxxx` in your .env file
 * Make sure you have `MOLLIE_APIKEY=test_xxxx` in your .env file
 */
/* eslint-disable @typescript-eslint/no-floating-promises */
async function runMollieDevServer() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('dotenv').config();

    registerInitializer('sqljs', new SqljsInitializer(path.join(__dirname, '__data__')));
    const tunnel = await localtunnel({ port: 3050 });
    const config = mergeConfig(testConfig, {
        plugins: [
            ...testConfig.plugins,
            DefaultSearchPlugin,
            AdminUiPlugin.init({
                route: 'admin',
                port: 5001,
            }),
            MolliePlugin.init({ vendureHost: tunnel.url }),
        ],
        logger: new DefaultLogger({ level: LogLevel.Debug }),
        apiOptions: {
            adminApiPlayground: true,
            shopApiPlayground: true,
        },
    });
    const { server, shopClient, adminClient } = createTestEnvironment(config as any);
    await server.init({
        initialData,
        productsCsvPath: path.join(__dirname, 'fixtures/e2e-products-minimal.csv'),
        customerCount: 1,
    });
    // Set EUR as currency for Mollie
    await adminClient.asSuperAdmin();
    await adminClient.query(gql`
        mutation {
            updateChannel(input: { id: "T_1", currencyCode: EUR }) {
                __typename
            }
        }
    `);
    // Create method
    await adminClient.query<CreatePaymentMethodMutation, CreatePaymentMethodMutationVariables>(
        CREATE_PAYMENT_METHOD,
        {
            input: {
                code: 'mollie',
                translations: [
                    {
                        languageCode: LanguageCode.en,
                        name: 'Mollie payment test',
                        description: 'This is a Mollie test payment method',
                    },
                ],
                enabled: true,
                handler: {
                    code: molliePaymentHandler.code,
                    arguments: [
                        {
                            name: 'redirectUrl',
                            value: `${tunnel.url}/admin/orders?filter=open&page=1`,
                        },
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        { name: 'apiKey', value: process.env.MOLLIE_APIKEY! },
                        { name: 'autoCapture', value: 'false' },
                    ],
                },
            },
        },
    );
    // Prepare order with 2 items
    await shopClient.asUserWithCredentials('hayden.zieme12@hotmail.com', 'test');
    // Add another item to the order
    await shopClient.query<AddItemToOrderMutation, AddItemToOrderMutationVariables>(ADD_ITEM_TO_ORDER, {
        productVariantId: 'T_4',
        quantity: 1,
    });
    await shopClient.query<AddItemToOrderMutation, AddItemToOrderMutationVariables>(ADD_ITEM_TO_ORDER, {
        productVariantId: 'T_5',
        quantity: 1,
    });
    await setShipping(shopClient);
    // Create payment intent
    // Create payment intent
    const { createMolliePaymentIntent } = await shopClient.query(CREATE_MOLLIE_PAYMENT_INTENT, {
        input: {
            redirectUrl: `${tunnel.url}/admin/orders?filter=open&page=1`,
            paymentMethodCode: 'mollie',
            //            molliePaymentMethodCode: 'klarnapaylater'
        },
    });
    if (createMolliePaymentIntent.errorCode) {
        throw createMolliePaymentIntent;
    }
    // eslint-disable-next-line no-console
    console.log('\x1b[41m', `Mollie payment link: ${createMolliePaymentIntent.url as string}`, '\x1b[0m');

    // Remove first orderLine
    await shopClient.query(ADJUST_ORDER_LINE, {
        orderLineId: 'T_1',
        quantity: 0,
    });
    await setShipping(shopClient);

    // Create another intent after Xs, should update the mollie order
    await new Promise(resolve => setTimeout(resolve, 5000));
    const { createMolliePaymentIntent: secondIntent } = await shopClient.query(CREATE_MOLLIE_PAYMENT_INTENT, {
        input: {
            redirectUrl: `${tunnel.url}/admin/orders?filter=open&page=1&dynamicRedirectUrl=true`,
            paymentMethodCode: 'mollie',
        },
    });
    // eslint-disable-next-line no-console
    console.log('\x1b[41m', `Second payment link: ${secondIntent.url as string}`, '\x1b[0m');
}

(async () => {
    await runMollieDevServer();
})();
