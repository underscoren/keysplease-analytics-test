import { test, expect } from "@playwright/test";

const exampleURL = "https://example.org/"

const hostname = "keysplease.co.uk";
const publicPath = "/AmmExtranet/Public/";
const publicPathMinimal = "/AmmExtranet/";

let allURLs: string[] = [];

// construct list of all possible URL combinations
for(const path of ["/", publicPath, publicPathMinimal])
    for(const subdomain of ["", "www."]) 
//        for(const protocol of ["https", "http"]) // https -> http strips referer header, as per RFC 9110 (https://www.rfc-editor.org/rfc/rfc9110#section-10.1.3)
            allURLs.push(`https://${subdomain}${hostname}${path}`);

for(const url of allURLs) {
    /** 
     * Accurately simulate referral by navigating to example.org and replacing
     * the link on their page with our own, then clicking it.
     **/
    test(`Referrer correctly set when navigating to ${url}`, async ({page}) => {
        await page.goto(exampleURL);

        // replace anchor on example page with our own URL
        const anchor = page.locator("a");
        await anchor.evaluate((element, url) => element.setAttribute("href", url), url);

        // handle request events to intercept browser navigation data
        const catchRequestPromise = new Promise<void>(resolve => {
            const listener = async (request) => {
                const response = await request.response();
                if(!(await response?.headers())?.["content-type"]?.includes("text/html"))
                    return; // ignore non-document requests

                // if we're redirected, just keep trying till we get the first non-redirect response
                const statusCode = response?.status() ?? NaN; 
                if(statusCode >= 300 && statusCode < 400) {
                    console.log(`redirected to ${(await response?.allHeaders())?.location}`);
                    console.dir(await response?.allHeaders());
                    return;
                }

                // at this point we should either be on the correct page, or the first non-redirect page
                console.log(response?.url());
                console.dir(await request.allHeaders());

                expect(response?.status()).toBe(200); // sanity check
                expect((await request.allHeaders()).referer).toBe(exampleURL);

                page.off("request", listener); // remove event listener to prevent it from firing after test finishes
                resolve();
            }

            page.on("request", listener);
        });

        // click anchor to simulate referral
        await anchor.click();

        // wait for request promise to resolve (so test doesn't termiate early)
        await catchRequestPromise;
    });
}

/** Test that query parameters are correctly preserved on redirects */

for (const url of allURLs) {
    /**
     * Check if query parameters on various URLs are preserved. These are typically utm tags
     * that are used for Google Analytics tracking cross-platform/device/program
     */
    test(`Query parameters should be preserved when navigating to ${url}`, async ({page}) => {
        const queryParameters = "?test=shouldexist";
        const response = await page.goto(url+queryParameters);

        const responseUrl = new URL(response?.url() ?? "");
        expect(responseUrl.searchParams.size).toBeGreaterThanOrEqual(1);
        expect(responseUrl.searchParams.get("test")).toBe("shouldexist");
    });
}