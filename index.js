const { Telegraf } = require("telegraf");
const fs = require("fs");

const bot = new Telegraf(process.env.BOT_TOKEN);

const OWNER_ID = Number(process.env.OWNER_ID);
const DB_FILE = "rules.json";


// خواندن اطلاعات
function loadRules() {
  if (!fs.existsSync(DB_FILE)) {
    return {};
  }

  return JSON.parse(
    fs.readFileSync(DB_FILE, "utf8")
  );
}


// ذخیره اطلاعات
function saveRules(data) {
  fs.writeFileSync(
    DB_FILE,
    JSON.stringify(data, null, 2)
  );
}


function isOwner(ctx) {
  return ctx.from.id === OWNER_ID;
}


function isGroup(ctx) {
  return (
    ctx.chat &&
    ["group", "supergroup"].includes(ctx.chat.type)
  );
}


// برای اینکه بعد از تنظیم منتظر ایموجی بماند
const waiting = {};


// شروع تنظیم ریکشن
bot.hears("تنظیم ریکشن", async (ctx) => {

  if (!isOwner(ctx)) return;
  if (!isGroup(ctx)) return;


  const replied =
    ctx.message.reply_to_message;


  if (!replied) {

    return ctx.reply(
      "❌ روی پیام شخص ریپلای کن و دوباره بفرست."
    );

  }


  waiting[ctx.from.id] = {

    chatId: String(ctx.chat.id),

    userId: String(replied.from.id),

    name:
      replied.from.first_name ||
      replied.from.username ||
      "کاربر"

  };


  ctx.reply(
    "✅ حالا فقط ایموجی ریکشن رو بفرست."
  );

});



// گرفتن ایموجی
bot.on("text", async (ctx, next) => {


  const data = waiting[ctx.from.id];


  if (!data) {
    return next();
  }


  const reaction =
    ctx.message.text.trim();



  const rules = loadRules();


  if (!rules[data.chatId]) {
    rules[data.chatId] = {};
  }



  rules[data.chatId][data.userId] = {

    reaction: reaction,

    name: data.name

  };



  saveRules(rules);


  delete waiting[ctx.from.id];


  ctx.reply(
    `✅ ثبت شد: ${reaction}`
  );

});



// لیست ریکشن‌ها
bot.hears("لیست ریکشن‌ها", async (ctx)=>{


  if (!isOwner(ctx)) return;


  const rules = loadRules();


  const group =
    rules[String(ctx.chat.id)];


  if (!group) {

    return ctx.reply(
      "❌ چیزی ثبت نشده."
    );

  }



  let text =
    "📋 لیست ریکشن‌ها:\n\n";


  let i = 1;


  for (const id in group) {

    text +=
      `${i}. ${group[id].name} → ${group[id].reaction}\n`;

    i++;

  }


  ctx.reply(text);


});



// حذف ریکشن
bot.hears("حذف ریکشن", async (ctx)=>{


  if (!isOwner(ctx)) return;


  const replied =
    ctx.message.reply_to_message;


  if (!replied) {

    return ctx.reply(
      "❌ روی پیام شخص ریپلای کن."
    );

  }



  const rules = loadRules();


  const chatId =
    String(ctx.chat.id);


  const userId =
    String(replied.from.id);



  if (rules[chatId]?.[userId]) {


    delete rules[chatId][userId];


    saveRules(rules);


    return ctx.reply(
      "🗑 حذف شد."
    );

  }


  ctx.reply(
    "چیزی پیدا نشد."
  );

});




// ریکشن خودکار
bot.on("message", async (ctx)=>{


  try {


    if (!isGroup(ctx)) return;


    if (ctx.from.is_bot) return;



    const rules =
      loadRules();



    const chatId =
      String(ctx.chat.id);



    const userId =
      String(ctx.from.id);



    const rule =
      rules[chatId]?.[userId];



    if (!rule) return;



    await ctx.telegram.callApi(
      "setMessageReaction",
      {

        chat_id:
          ctx.chat.id,


        message_id:
          ctx.message.message_id,


        reaction: [

          {
            type: "emoji",
            emoji: rule.reaction
          }

        ]

      }
    );



  } catch(err) {

    console.log(err.message);

  }


});





bot.launch()
.then(()=>{

  console.log(
    "Bot Started"
  );

})
.catch(console.log);



process.once(
  "SIGINT",
  ()=>bot.stop("SIGINT")
);


process.once(
  "SIGTERM",
  ()=>bot.stop("SIGTERM")
);
