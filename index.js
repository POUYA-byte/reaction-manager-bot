try { require("dotenv").config(); } catch (e) {}

const { Telegraf } = require("telegraf");
const fs = require("fs");

const bot = new Telegraf(process.env.BOT_TOKEN);

const OWNER_ID = Number(process.env.OWNER_ID);
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
bot.hears(/^تنظیم\s*ریکشن$/, async (ctx) => {
  if (!isOwner(ctx)) return;
  if (!isGroup(ctx)) return;

  const reply = ctx.message.reply_to_message;

  if (!reply) {
    return ctx.reply("روی پیام شخص ریپلای کن.");
  }

  waiting[ctx.from.id] = {
    userId: String(reply.from.id),
    name: reply.from.first_name || "User"
  };

  ctx.reply("ایموجی ریکشن رو بفرست ❤️");
});

// گرفتن ایموجی
bot.on("text", async (ctx, next) => {
  if (!waiting[ctx.from.id]) {
    return next();
  }

  const emoji = ctx.message.text.trim();
  const data = waiting[ctx.from.id];
  const rules = loadRules();

  rules[data.userId] = {
    reaction: emoji,
    name: data.name
  };

  saveRules(rules);
  delete waiting[ctx.from.id];

  ctx.reply(`ثبت شد ${emoji} (برای همه‌ی گروه‌ها فعاله)`);
});

// حذف
bot.hears(/^حذف\s*ریکشن$/, async (ctx) => {
  if (!isOwner(ctx)) return;

  const reply = ctx.message.reply_to_message;
  if (!reply) return ctx.reply("روی پیام شخص ریپلای کن.");

  const rules = loadRules();
  const userId = String(reply.from.id);

  if (rules[userId]) {
    delete rules[userId];
    saveRules(rules);
    return ctx.reply("حذف شد ✅");
  }

  ctx.reply("چیزی پیدا نشد.");
});

// لیست
bot.hears(/^لیست\s*ریکشن‌?ها$/, async (ctx) => {
  if (!isOwner(ctx)) return;

  const rules = loadRules();

  if (Object.keys(rules).length === 0) {
    return ctx.reply("لیست خالی است.");
  }

  let text = "📋 لیست:\n\n";
  for (const id in rules) {
    text += `${rules[id].name} → ${rules[id].reaction}\n`;
  }

  ctx.reply(text);
});

// ریکشن خودکار
bot.on("message", async (ctx, next) => {
  try {
    if (!isGroup(ctx)) return next();
    if (ctx.from.is_bot) return next();

    const rules = loadRules();
    const rule = rules[String(ctx.from.id)];

    if (!rule) return next();

    await ctx.telegram.callApi("setMessageReaction", {
      chat_id: ctx.chat.id,
      message_id: ctx.message.message_id,
      reaction: [{ type: "emoji", emoji: rule.reaction }]
    });
  } catch (e) {
    console.log(e.message);
  }
});

bot.launch()
  .then(() => console.log("Bot Started"))
  .catch(console.log);

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
