const { Telegraf, session } = require("telegraf");
const fs = require("fs");

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(session());

const OWNER_ID = Number(process.env.OWNER_ID);
const DB_FILE = "rules.json";

function loadRules() {
  if (!fs.existsSync(DB_FILE)) return {};
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function saveRules(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function isOwner(ctx) {
  return ctx.from.id === OWNER_ID;
}

function isGroup(ctx) {
  return ["group", "supergroup"].includes(ctx.chat.type);
}

bot.hears("تنظیم ریکشن", async (ctx) => {
  if (!isOwner(ctx) || !isGroup(ctx)) return;

  const replied = ctx.message.reply_to_message;
  if (!replied)
    return ctx.reply("روی پیام شخص ریپلای کن و دوباره بفرست.");

  ctx.session.waiting = true;
  ctx.session.chatId = String(ctx.chat.id);
  ctx.session.userId = String(replied.from.id);
  ctx.session.name = replied.from.first_name || replied.from.username;

  ctx.reply("فقط ایموجی ریکشن رو بفرست. مثال: 👍");
});

bot.on("text", async (ctx, next) => {
  if (!ctx.session?.waiting) return next();

  const reaction = ctx.message.text.trim();
  const rules = loadRules();

  if (!rules[ctx.session.chatId]) rules[ctx.session.chatId] = {};

  rules[ctx.session.chatId][ctx.session.userId] = {
    reaction,
    name: ctx.session.name
  };

  saveRules(rules);

  ctx.session = null;

  ctx.reply(`✅ ثبت شد: ${reaction}`);
});

bot.hears("لیست ریکشن‌ها", async (ctx) => {
  if (!isOwner(ctx) || !isGroup(ctx)) return;

  const rules = loadRules();
  const group = rules[String(ctx.chat.id)];

  if (!group) return ctx.reply("هیچ موردی ثبت نشده.");

  let text = "📋 لیست:\n\n";
  let i = 1;

  for (const id in group) {
    text += `${i}. ${group[id].name} → ${group[id].reaction}\n`;
    i++;
  }

  ctx.reply(text);
});

bot.hears("حذف ریکشن", async (ctx) => {
  if (!isOwner(ctx) || !isGroup(ctx)) return;

  const replied = ctx.message.reply_to_message;
  if (!replied) return ctx.reply("روی پیام شخص ریپلای کن.");

  const rules = loadRules();
  const chatId = String(ctx.chat.id);
  const userId = String(replied.from.id);

  if (rules[chatId]?.[userId]) {
    delete rules[chatId][userId];
    saveRules(rules);
    return ctx.reply("🗑 حذف شد.");
  }

  ctx.reply("چیزی برای حذف نیست.");
});

bot.on("message", async (ctx) => {
  try {
    if (!isGroup(ctx)) return;
    if (ctx.from.is_bot) return;

    const rules = loadRules();
    const chatId = String(ctx.chat.id);
    const userId = String(ctx.from.id);

    const rule = rules[chatId]?.[userId];
    if (!rule) return;

    await ctx.telegram.callApi("setMessageReaction", {
      chat_id: ctx.chat.id,
      message_id: ctx.message.message_id,
      reaction: [
        {
          type: "emoji",
          emoji: rule.reaction
        }
      ]
    });
  } catch (e) {
    console.log(e.message);
  }
});

bot.launch();
console.log("Bot Started");
