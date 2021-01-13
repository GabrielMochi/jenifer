import dotenv from "dotenv";
import puppeteer, { Page } from "puppeteer-core";
import redis from "redis";

dotenv.config();

const redisClient = redis.createClient();

(async () => {
  try {
    const browser = await puppeteer.connect({
      browserURL: process.env.CHROME_URL,
      defaultViewport: {
        isLandscape: true,
        hasTouch: false,
        isMobile: false,
        width: 1920,
        height: 1080,
      },
    });

    await createRedisKey();

    const [page] = await browser.pages();

    setInterval(async () => {
      try {
        await sendLike(page);
        await countLike();
      } catch (err) {
        console.error(err);
      }
    }, 500);
  } catch (err) {
    console.error(err);
  }
})();

const createRedisKey = (): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    redisClient.exists("jeniferLikesCount", (err, exists) => {
      if (err) return reject(err);

      if (exists === 1) return resolve();

      redisClient.set("jeniferLikesCount", (0).toString(), (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
};

const sendLike = async (page: Page): Promise<void> => {
  const [cancelSuperLikeButton] = await page.$x("//button[contains(., 'Não, obrigado(a)')]");

  if (cancelSuperLikeButton) {
    await cancelSuperLikeButton.click();
  }

  const [likeButton] = await page.$x("//button[contains(., 'Curti')]");
  await likeButton.click();
};

const countLike = (): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    redisClient.get("jeniferLikesCount", (err, jeniferLikesCount) => {
      if (err) return reject(err);

      const newCounting = Number(jeniferLikesCount) + 1;

      redisClient.set("jeniferLikesCount", newCounting.toString(), (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
};
