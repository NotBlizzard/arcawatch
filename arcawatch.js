const puppeteer = require("puppeteer");
const prompt = require("prompt");
const fs = require("fs");

prompt.start();

console.log("What is the username you want to get watches from?");
prompt.get(["username"], (err, result) => {
  (async () => {
    console.log("Asking for login information");
    let browser = await puppeteer.launch({ headless: false });
    let page = await browser.newPage();

    // ask user to login since captcha
    await page.goto("https://furaffinity.net/login");

    await page.waitForNavigation();

    // get login cookies so puppeteer can do all the boring work
    const cookies = await page.cookies();

    await browser.close();

    browser = await puppeteer.launch();
    page = await browser.newPage();

    // log in
    await page.setCookie(...cookies);

    await page.goto(`https://furaffinity.net/watchlist/by/${result.username}/`);

    // get names
    let names = [];
    let loop = true;
    console.log("Getting usernames");
    while (loop) {
      page.setDefaultNavigationTimeout(0);

      let url = await page.url().replace("?", "");
      let text = await page.$$eval('a[target="_blank"]', (el) =>
        el.map((i) => i.textContent.replace("_", "")),
      );

      names.push(...text);

      await page.waitForSelector(
        ".floatright > form:nth-child(1) > button:nth-child(1)",
      );
      await page.click(".floatright > form:nth-child(1) > button:nth-child(1)");

      let newUrl = await page.url().replace("?", "");

      if (newUrl === url) {
        loop = false;
      }
    }

    // watch users
    console.log("Watching users");
    for (let i = 0; i < names.length; i++) {
      await page.goto(`https://furaffinity.net/user/${names[i]}`);
      await page.waitForSelector("a.button:nth-child(1)");
      const element = await page.$("a.button:nth-child(1)");
      const value = await page.evaluate((e) => e.textContent, element);
      if (value === "+Watch") {
        await page.click("a.button:nth-child(1)");
      }
    }

    console.log("Done!");
    await browser.close();
  })();
});
