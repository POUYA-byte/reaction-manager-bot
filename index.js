require("dotenv").config(); // ← این خط رو اگه نداری اضافه کن، حتماً بالای فایل

const { Telegraf } = require("telegraf");
const fs = require("fs");

const bot = new Telegraf(process.env.BOT_TOKEN);

const OWNER_ID = Number(process.env.OWNER_ID);
console.log("OWNER_ID from env:", OWNER_ID); // ← اگه NaN چاپ شد، مشکل همینه

const DB_FILE = "rules.json";
const waiting = {};

function loadRules() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch {
    return {};
  }
}

function saveRules(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function isGroup(ctx) {
  return ["group", "supergroup"].includes(ctx.chat.type);
}

function isOwner(ctx) {
  return ctx.from.id === OWNER_ID;
}

// تنظیم ریکشن
bot.hears("تنظیم ریکشن", async (ctx) => {
  console.log("hears matched. from.id =", ctx.from.id, "OWNER_ID =", OWNER_ID, "isOwner:", isOwner(ctx), "isGroup:", isGroup(ctx));

  if (!isOwner(ctx)) return;
  if (!isGroup(ctx)) return;

  const reply = ctx.message.reply_to_message;
  if (!reply) {
    return ctx.reply("روی پیام شخص ریپلای کن.");
  }

  waiting[ctx.from.id] = {
    chatId: String(ctx.chat.id),
    userId: String(reply.from.id),
    name: reply.from.first_name || "User",
  };

  ctx.reply("ایموجی ریکشن رو بفرست ❤️");
});
