"use strict";
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const md5File = require("md5-file");
const puppeteer = require("puppeteer");
const { compress } = require("compress-images/promise");

const robotKeys = [];
const targetUrl = `https://voice.baidu.com/act/newpneumonia/newpneumonia/`;
const sendImagePath = "/tmp/olympic-min.png";
const sourceImagePath = "/tmp/olympic.png";
const destImagePath = "/tmp/";

const getMD5 = () => {
  return md5File.sync(sendImagePath);
};

const getBase64 = () => {
  return fs.readFileSync(sendImagePath, "base64");
};

const getMiniImage = async () => {
  console.log("getMiniImage");
  await compress({
    source: sourceImagePath,
    destination: destImagePath,
    params: { compress_force: true, statistic: true, autoupdate: true },
    enginesSetup: {
      jpg: { engine: false, command: false },
      png: {
        engine: "pngquant",
        command: ["--quality=20-50", "--ext=-min.png", "--force"],
      },
    },
  });
};

const getScreenshot = async () => {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  const desiredWidth = 800;
  const desiredHeight = 940;
  const sf = 1.152;
  await page.setViewport({
    width: parseInt(desiredWidth / sf),
    height: parseInt(desiredHeight / sf),
    deviceScaleFactor: sf,
  });
  await page.goto(targetUrl, {
    waitUtil: "networkidle2",
  });
  // const body = await page.$('.wa-tiyu-page-container');
  await page.screenshot({ path: sourceImagePath });
  await browser.close();
};

const triggerRobot = (base64Value, md5Value) => {
  console.log("md5", md5Value);
  console.log(base64Value);
  robotKeys.forEach((key) => {
    execSync(`curl 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${key}' \\
   -H 'Content-Type: application/json' \\
   -d '
   {
        "msgtype": "image",
        "image": {
            "base64": "${base64Value}",
            "md5": "${md5Value}"
        }
   }'
`);
  });
};

const main = async () => {
  try {
    await getScreenshot();
    await getMiniImage();
    const base64 = getBase64();
    const md5 = getMD5();
    triggerRobot(base64, md5);
  } catch (e) {
    console.log(e);
  }
};

exports.main_handler = async (event, context) => {
  await main();
  return event;
};
